/**
 * Webhook Controller
 * Handles PayPal webhook events
 */

import Donation from 'models/donation.model'
import RecurringDonation from 'models/recurring-donation.model'
import PaymentTransaction from 'models/payment-transaction.model'
import Project from 'models/project.model'
import User from 'models/user.model'
import * as paypalService from 'services/paypal.service'
import {
  resolveDonorInfo,
  sendDonationReceiptEmail,
  sendGenericDonationReceiptEmail,
  sendRecurringDonationReceiptEmail,
} from 'services/email.service'
import mongoose from 'mongoose'
import {
  normalizePayPalChargeResource,
  parseWebhookResourceAmount,
  parseWebhookResourceCurrency,
} from 'utils/paypal-webhook-resource'
import { withRetry } from 'utils/retry'

async function getRecurringIntervalForDonation(donation) {
  if (!donation?.recurringDonationId) return null
  const rd = await RecurringDonation.findById(donation.recurringDonationId).select('interval').lean()
  return rd?.interval || null
}

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events
 */
export const handlePayPalWebhook = async (req, res) => {
  const headers = req.headers
  const body = req.body

  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error(
      'Webhook rejected: PAYPAL_WEBHOOK_ID not set. Add the webhook ID from the PayPal developer dashboard (sandbox or live) to your environment.',
    )
    return res.status(503).json({ error: 'Webhook verification not configured' })
  }

  let isValid
  try {
    isValid = await paypalService.verifyWebhookSignature(headers, body, webhookId)
  } catch (verifyError) {
    // Transport/network error reaching PayPal — return 500 so PayPal retries
    console.error('Webhook verification transport error:', verifyError.message)
    return res.status(500).json({ error: 'Webhook verification temporarily unavailable' })
  }
  if (!isValid) {
    console.error('Invalid webhook signature')
    return res.status(401).json({ error: 'Invalid webhook signature' })
  }

  const eventType = body.event_type
  const resource = body.resource
  const eventId = body.id // Webhook event ID for idempotency

  if (!eventType) {
    return res.status(400).json({ error: 'Missing event_type in webhook payload' })
  }

  // Check if we've already processed this webhook event (idempotency)
  if (eventId) {
    const existingTransaction = await PaymentTransaction.findOne({
      paypalEventId: eventId,
    })
    if (existingTransaction) {
      console.log(`⚠️  Webhook event ${eventId} already processed - skipping duplicate`)
      return res.status(200).json({ received: true, message: 'Event already processed' })
    }
  }

  console.log(`Received PayPal webhook: ${eventType} (Event ID: ${eventId})`)

  try {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(resource)
        break

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(resource)
        break

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(resource)
        break

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentSaleCompleted(resource)
        break

      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(resource)
        break

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource)
        break

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource)
        break

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(resource)
        break

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(resource)
        break

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    // Log transaction for audit trail (with event ID for idempotency)
    // Try to get donation info for userId and projectId, but don't fail if not found
    try {
      const orderId = resource.supplementary_data?.related_ids?.order_id
      const subscriptionId = resource.billing_agreement_id || 
                              resource.supplementary_data?.related_ids?.subscription_id
      
      let donation = null
      let recurringDonation = null
      
      // Try to find donation by order ID (one-time) or transaction ID (recurring)
      if (orderId) {
        donation = await Donation.findOne({ paypalOrderId: orderId })
      }
      
      // If not found and we have a transaction ID, try to find by transaction ID (for recurring)
      if (!donation && resource.id) {
        donation = await Donation.findOne({ providerTxnId: resource.id })
      }
      
      // Try to find recurring donation if subscription ID exists (active only — same subscription can have a transferred + active record)
      if (subscriptionId) {
        recurringDonation = await RecurringDonation.findOne({
          paypalSubscriptionId: subscriptionId,
          status: 'active',
        })
      }

      // Determine transaction type
      let transactionType = 'donation'
      if (recurringDonation || subscriptionId) {
        transactionType = 'recurring_charge'
      }

      const transaction = new PaymentTransaction({
        type: transactionType,
        donationId: donation?._id || null,
        recurringDonationId: recurringDonation?._id || null,
        userId: donation?.userId || recurringDonation?.userId || null,
        projectId: donation?.projectId || recurringDonation?.projectId || null,
        amount: parseWebhookResourceAmount(resource),
        currency: parseWebhookResourceCurrency(resource),
        paypalOrderId: orderId,
        paypalTransactionId: resource.id,
        paypalEventId: eventId, // Store event ID to prevent duplicate processing
        status: 'completed',
        paypalEventType: eventType,
        processedAt: new Date(),
        metadata: { eventType, paypalResourceId: resource.id, subscriptionId: resource.billing_agreement_id },
      })
      await transaction.save()
    } catch (transactionError) {
      // If it's a duplicate key error, that's fine - we've already processed this event
      if (transactionError.code === 11000) {
        console.log(`⚠️  Webhook event ${eventId} already logged - duplicate webhook`)
      } else {
        console.error('Error saving payment transaction:', transactionError)
      }
      // Don't fail the webhook if transaction logging fails
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 200 to PayPal so they don't retry
    // But log the error for investigation
    return res.status(200).json({ received: true })
  }
}

/**
 * Handle payment completed event
 * This handles both one-time donations and recurring subscription charges
 */
async function handlePaymentCompleted(resource) {
  // Check if this is a recurring payment by looking for subscription ID
  const subscriptionId = resource.billing_agreement_id ||
                        resource.supplementary_data?.related_ids?.subscription_id ||
                        resource.custom_id?.match(/subscription_([^_]+)/)?.[1]

  if (subscriptionId) {
    const charge = normalizePayPalChargeResource(resource)
    await processRecurringCharge(charge, subscriptionId)
    return
  }

  // One-time donation — atomically claim it to prevent race with captureDonationOrder
  const orderId = resource.supplementary_data?.related_ids?.order_id
  if (!orderId) {
    console.warn('PAYMENT.CAPTURE.COMPLETED: No order ID found')
    return
  }

  // CAS: only claim if still 'pending' — returns OLD doc (new: false)
  const donation = await Donation.findOneAndUpdate(
    { paypalOrderId: orderId, paymentStatus: 'pending' },
    { $set: { paymentStatus: 'in-progress' } },
    { new: false }
  )

  if (!donation) {
    const existing = await Donation.findOne({ paypalOrderId: orderId }).lean()
    if (!existing) {
      console.warn(`Payment completed but donation not found for order ${orderId}`)
    } else {
      console.log(`ℹ️  Donation ${existing._id} already claimed (${existing.paymentStatus}) — skipping webhook`)
    }
    return
  }

  // If providerTxnId was already set the donation went through the 3D-Secure PENDING path
  // in captureDonationOrder — project/user totals were already incremented there.
  const totalsAlreadyUpdated = Boolean(donation.providerTxnId)

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Donation.findByIdAndUpdate(
        donation._id,
        {
          $set: {
            paymentStatus: 'completed',
            providerTxnId: resource.id,
            ...(resource.payer?.payer_id && { paypalPayerId: resource.payer.payer_id }),
          },
        },
        { session }
      )

      if (!totalsAlreadyUpdated) {
        await Project.findByIdAndUpdate(
          donation.projectId,
          { $inc: { currentAmount: donation.amount } },
          { session }
        )
        if (donation.userId) {
          await User.findByIdAndUpdate(
            donation.userId,
            { $inc: { 'donorProfile.totalAmountDonated': donation.amount } },
            { session }
          )
        }
      }
    })
  } finally {
    await session.endSession()
  }

  console.log(`✅ Payment completed for donation ${donation._id}${totalsAlreadyUpdated ? ' (was 3D-Secure pending)' : ''}`)

  // Send receipt email with retry — must not happen inside the transaction
  if (!donation.receiptEmailSent) {
    try {
      const donorInfo = await resolveDonorInfo(donation)
      if (donorInfo) {
        const project = await Project.findById(donation.projectId).select('name currentAmount goalAmount').lean()
        const projectName = project?.name || 'Mill Creek United Foundation'
        const projectProgress = project?.goalAmount
          ? { currentAmount: project.currentAmount || 0, goalAmount: project.goalAmount }
          : null
        const txnId = resource.id
        const recurringInterval = await getRecurringIntervalForDonation(donation)

        await withRetry(() =>
          donorInfo.firstName
            ? sendDonationReceiptEmail(
                donorInfo.email, donorInfo.firstName, donation.amount, donation.currency,
                projectName, projectProgress, txnId, donation._id.toString(), recurringInterval,
              )
            : sendGenericDonationReceiptEmail(
                donorInfo.email, donation.amount, donation.currency,
                projectName, txnId, donation._id.toString(), recurringInterval,
              )
        )

        await Donation.findByIdAndUpdate(donation._id, { receiptEmailSent: true })
      }
    } catch (emailError) {
      console.error('Warning: Failed to send donation receipt email (webhook) after retries:', emailError.message)
    }
  }
}

/**
 * PayPal documents subscription renewals via PAYMENT.SALE.COMPLETED; captures may also fire with a different txn id.
 * If both arrive for the same billing cycle, skip the second (same recurring + amount + time window, different providerTxnId).
 */
const RECURRING_ALT_WEBHOOK_DEDUPE_MS = 180000

/**
 * PAYMENT.SALE.COMPLETED — payment on a subscription (see PayPal Subscriptions webhooks reference).
 */
async function handlePaymentSaleCompleted(resource) {
  const subscriptionId = resource.billing_agreement_id
  if (!subscriptionId) {
    console.warn('PAYMENT.SALE.COMPLETED: missing billing_agreement_id')
    return
  }
  try {
    const charge = normalizePayPalChargeResource(resource)
    await processRecurringCharge(charge, subscriptionId)
  } catch (err) {
    console.error('PAYMENT.SALE.COMPLETED: invalid resource', err.message)
  }
}

/**
 * Shared path for recurring charge: v2 capture (PAYMENT.CAPTURE.COMPLETED) or sale (PAYMENT.SALE.COMPLETED).
 * Creates a new Donation document for each recurring charge.
 *
 * @param {{ id: string, amount: number, currency: string, createTime: Date, orderId: string|null, payerId: string|null }} charge
 * @param {string} subscriptionId - PayPal subscription id (I-...)
 */
async function processRecurringCharge(charge, subscriptionId) {
  try {
    // Find the active recurring donation (after a project switch there may be a transferred + active record)
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
      status: 'active',
    })

    if (!recurringDonation) {
      console.warn(`Recurring donation not found for subscription: ${subscriptionId}`)
      return
    }

    const { id: chargeId, amount, currency, createTime: chargeInstant, orderId, payerId } = charge

    // Idempotency: same PayPal txn id
    const existingDonation = await Donation.findOne({
      providerTxnId: chargeId,
      projectId: recurringDonation.projectId,
      userId: recurringDonation.userId,
    })

    if (existingDonation && existingDonation.paymentStatus === 'completed') {
      console.log(`ℹ️  Recurring payment already processed for transaction ${chargeId}`)
      return
    }

    // Same billing cycle may emit both PAYMENT.SALE.COMPLETED and PAYMENT.CAPTURE.COMPLETED with different ids — count once
    const duplicateAlternateWebhook = await Donation.findOne({
      recurringDonationId: recurringDonation._id,
      paymentStatus: 'completed',
      amount,
      donatedAt: {
        $gte: new Date(chargeInstant.getTime() - RECURRING_ALT_WEBHOOK_DEDUPE_MS),
        $lte: new Date(chargeInstant.getTime() + RECURRING_ALT_WEBHOOK_DEDUPE_MS),
      },
      providerTxnId: { $ne: chargeId },
    })
    if (duplicateAlternateWebhook) {
      console.log(
        `ℹ️  Skipping duplicate recurring webhook (same cycle already recorded as ${duplicateAlternateWebhook._id}); txn ${chargeId}`,
      )
      return
    }

    // Create new Donation document for this charge (NO MESSAGE on recurring charges)
    const donation = new Donation({
      userId: recurringDonation.userId,
      projectId: recurringDonation.projectId,
      amount,
      currency,
      donatedAt: chargeInstant,
      message: null, // ⚠️ NO MESSAGE on recurring charges - message only appears once
      paymentProvider: 'paypal',
      paymentStatus: 'completed',
      paypalOrderId: orderId || null,
      providerTxnId: chargeId,
      paypalPayerId: payerId,
      recurringDonationId: recurringDonation._id,
    })
    await donation.save()

    // Update project total
    await Project.findByIdAndUpdate(recurringDonation.projectId, {
      $inc: { currentAmount: amount },
    })

    // Update user donor profile
    await User.findByIdAndUpdate(recurringDonation.userId, {
      $inc: { 'donorProfile.totalAmountDonated': amount },
    })

    // Send recurring donation receipt email with retry
    try {
      const user = await User.findById(recurringDonation.userId).select('email firstName').lean()
      if (user && user.email) {
        const project = await Project.findById(recurringDonation.projectId).select('name').lean()
        const projectName = project?.name || 'Mill Creek United Foundation'

        await withRetry(() =>
          sendRecurringDonationReceiptEmail(
            user.email,
            user.firstName,
            amount,
            currency,
            recurringDonation.interval,
            projectName,
          )
        )

        await Donation.findByIdAndUpdate(donation._id, { receiptEmailSent: true })
      }
    } catch (emailError) {
      console.error('Warning: Failed to send recurring donation receipt email after retries:', emailError.message)
    }

    // Update subscription metadata (align with donation timestamp)
    recurringDonation.lastChargeDate = chargeInstant

    // Calculate next charge date based on interval
    const nextDate = new Date(recurringDonation.lastChargeDate)
    if (recurringDonation.interval === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7)
    } else if (recurringDonation.interval === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1)
    } else if (recurringDonation.interval === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1)
    }
    recurringDonation.nextChargeDate = nextDate
    await recurringDonation.save()

    console.log(`✅ Recurring payment processed: $${amount} for subscription ${subscriptionId} (Donation ID: ${donation._id})`)
  } catch (error) {
    console.error('Error handling recurring payment:', error)
    throw error
  }
}

/**
 * Handle payment denied event
 */
async function handlePaymentDenied(resource) {
  const orderId = resource.supplementary_data?.related_ids?.order_id
  if (!orderId) return

  const donation = await Donation.findOne({ paypalOrderId: orderId })
  if (donation) {
    // If donation was pending, we need to rollback the project total
    if (donation.paymentStatus === 'pending') {
      // Rollback project total
      await Project.findByIdAndUpdate(donation.projectId, {
        $inc: { currentAmount: -donation.amount },
      })

      // Rollback user donor profile
      if (donation.userId) {
        await User.findByIdAndUpdate(donation.userId, {
          $inc: { 'donorProfile.totalAmountDonated': -donation.amount },
        })
      }
    }

    donation.paymentStatus = 'failed'
    donation.failureReason = resource.reason_code || 'Payment denied'
    await donation.save()
    console.log(`❌ Payment denied for donation ${donation._id} - rolled back project total`)
  }
}

/**
 * Handle payment refunded event
 */
async function handlePaymentRefunded(resource) {
  const orderId = resource.supplementary_data?.related_ids?.order_id
  if (!orderId) return

  const donation = await Donation.findOne({ paypalOrderId: orderId })
  if (donation) {
    donation.paymentStatus = 'refunded'
    donation.refundedAt = new Date()
    donation.refundAmount = parseFloat(resource.amount?.value || 0)
    await donation.save()

    // Update project total (subtract refund)
    await Project.findByIdAndUpdate(donation.projectId, {
      $inc: { currentAmount: -donation.refundAmount },
    })

    console.log(`💰 Refund processed for donation ${donation._id}`)
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(resource) {
  console.log(`Subscription created: ${resource.id}`)
  // Subscription created - status will be updated when activated
}

/**
 * Handle subscription activated event
 * Creates initial Donation document with message (if provided) when subscription is activated
 */
async function handleSubscriptionActivated(resource) {
  const subscription = await RecurringDonation.findOne({
    paypalSubscriptionId: resource.id,
    status: { $in: ['active', 'paused'] },
  })
  if (subscription) {
    subscription.status = 'active'
    subscription.paymentStatus = 'active'
    await subscription.save()
    console.log(`✅ Subscription activated: ${resource.id}`)

    // Create initial Donation document for the subscription.
    // The activateSubscription endpoint (called when the user returns from PayPal)
    // may have already created this — use providerTxnId for reliable idempotency.
    try {
      const initialTxnId = `subscription_initial_${subscription._id}`
      const existingInitialDonation = await Donation.findOne({ providerTxnId: initialTxnId })

      if (!existingInitialDonation) {
        const initialDonation = new Donation({
          userId: subscription.userId,
          projectId: subscription.projectId,
          amount: subscription.amount,
          currency: subscription.currency,
          donatedAt: subscription.startDate,
          message: subscription.initialMessage || null,
          paymentProvider: 'paypal',
          paymentStatus: 'completed',
          providerTxnId: initialTxnId,
          recurringDonationId: subscription._id,
        })
        await initialDonation.save()

        // Update project total
        await Project.findByIdAndUpdate(subscription.projectId, {
          $inc: { currentAmount: subscription.amount },
        })

        // Update user donor profile
        await User.findByIdAndUpdate(subscription.userId, {
          $inc: { 'donorProfile.totalAmountDonated': subscription.amount },
        })

        console.log(`✅ Created initial donation for subscription ${resource.id}`)

        // Send personalized receipt
        if (!initialDonation.receiptEmailSent) {
          try {
            const user = await User.findById(subscription.userId).select('email firstName').lean()
            if (user && user.email) {
              const project = await Project.findById(subscription.projectId).select('name currentAmount goalAmount').lean()
              const projectName = project?.name || 'Mill Creek United Foundation'
              const projectProgress = project?.goalAmount
                ? { currentAmount: project.currentAmount || 0, goalAmount: project.goalAmount }
                : null

              await sendDonationReceiptEmail(
                user.email,
                user.firstName,
                subscription.amount,
                subscription.currency,
                projectName,
                projectProgress,
                initialDonation.providerTxnId,
                initialDonation._id.toString(),
                subscription.interval,
              )

              initialDonation.receiptEmailSent = true
              await initialDonation.save()
            }
          } catch (emailError) {
            console.error('Warning: Failed to send subscription activation receipt email:', emailError.message)
          }
        }
      } else {
        if (!existingInitialDonation.recurringDonationId) {
          existingInitialDonation.recurringDonationId = subscription._id
          await existingInitialDonation.save()
        }
        console.log(`ℹ️  Initial donation already exists for subscription ${resource.id} — skipping`)
      }
    } catch (error) {
      console.error('Error creating initial donation for subscription:', error)
      // Don't fail the webhook if initial donation creation fails
    }
  }
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(resource) {
  const subscription = await RecurringDonation.findOne({
    paypalSubscriptionId: resource.id,
    status: { $in: ['active', 'paused'] },
  })
  if (subscription) {
    subscription.status = 'cancelled'
    subscription.paymentStatus = 'cancelled'
    subscription.cancellationReason = 'Cancelled via PayPal'
    await subscription.save()
    if (subscription.paypalPlanId) {
      try {
        await paypalService.deactivateBillingPlan(subscription.paypalPlanId)
      } catch (planErr) {
        console.warn('Warning: Failed to deactivate PayPal billing plan after webhook cancel:', planErr.message)
      }
    }
    console.log(`❌ Subscription cancelled: ${resource.id}`)
  }
}

/**
 * Handle subscription payment failed event
 */
async function handleSubscriptionPaymentFailed(resource) {
  const subscriptionId = resource.billing_agreement_id || resource.id
  const subscription = await RecurringDonation.findOne({
    paypalSubscriptionId: subscriptionId,
    status: 'active',
  })
  if (subscription) {
    subscription.failureCount = (subscription.failureCount || 0) + 1
    subscription.lastFailureDate = new Date()
    await subscription.save()
    console.log(`⚠️  Subscription payment failed: ${subscriptionId} (failure count: ${subscription.failureCount})`)
  }
}

/**
 * Handle subscription suspended event
 */
async function handleSubscriptionSuspended(resource) {
  const subscription = await RecurringDonation.findOne({
    paypalSubscriptionId: resource.id,
    status: 'active',
  })
  if (subscription) {
    subscription.status = 'paused'
    subscription.paymentStatus = 'suspended'
    await subscription.save()
    console.log(`⏸️  Subscription suspended: ${resource.id}`)
  }
}
