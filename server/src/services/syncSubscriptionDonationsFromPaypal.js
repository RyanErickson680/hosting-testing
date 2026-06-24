/**
 * Compare PayPal subscription billing API results to Donation rows and optionally backfill gaps.
 * Covers recurring subscription charges only (not one-time Checkout orders).
 */
/* eslint-disable no-await-in-loop, no-continue, no-restricted-syntax -- sequential writes + control flow */
import Donation from 'models/donation.model'
import RecurringDonation from 'models/recurring-donation.model'
import Project from 'models/project.model'
import User from 'models/user.model'
import * as paypalService from 'services/paypal.service'
import { sendRecurringDonationReceiptEmail } from 'services/email.service'

const ALT_WEBHOOK_DEDUPE_MS = 180000

function parseTxnGrossAmount(t) {
  const raw =
    t.amount_with_breakdown?.gross_amount?.value ??
    t.amount_with_breakdown?.net_amount?.value ??
    t.gross_amount?.value ??
    t.amount?.value ??
    t.amount
  return parseFloat(raw || 0)
}

function parseTxnCurrency(t) {
  return (
    t.amount_with_breakdown?.gross_amount?.currency_code ??
    t.amount_with_breakdown?.net_amount?.currency_code ??
    t.gross_amount?.currency_code ??
    t.amount?.currency_code ??
    'USD'
  )
}

function parseTxnTime(t) {
  return new Date(t.time || t.create_time || t.update_time || Date.now())
}

function txnId(t) {
  return t.id || t.transaction_id
}

/**
 * @returns {Promise<{ recurringDonation: object|null, missing: Array<{ txn: object, id: string, amount: number, currency: string, time: Date }>, paypalTransactionCount: number }>}
 */
export async function listMissingSubscriptionCharges(subscriptionId, daysBack) {
  const end = new Date()
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const data = await paypalService.listSubscriptionTransactions(
    subscriptionId,
    start.toISOString(),
    end.toISOString()
  )
  const txns = data.transactions || []
  const completed = txns.filter((t) => {
    const st = (t.status || '').toUpperCase()
    return !st || st === 'COMPLETED'
  })
  const ids = completed.map((t) => txnId(t)).filter(Boolean)
  const existing = await Donation.find({ providerTxnId: { $in: ids } })
    .select('providerTxnId')
    .lean()
  const have = new Set(existing.map((d) => d.providerTxnId))

  const recurringDonation = await RecurringDonation.findOne({
    paypalSubscriptionId: subscriptionId,
    status: 'active',
  }).lean()

  const missing = completed.flatMap((t) => {
    const id = txnId(t)
    if (!id || have.has(id)) return []
    const amount = parseTxnGrossAmount(t)
    const currency = parseTxnCurrency(t)
    const time = parseTxnTime(t)
    return [{ txn: t, id, amount, currency, time }]
  })

  return {
    recurringDonation,
    missing,
    paypalTransactionCount: txns.length,
  }
}

/**
 * Insert Donation rows for PayPal subscription transactions missing from the DB.
 * Updates project and user totals; optional receipt email per row.
 *
 * @returns {Promise<{ inserted: number, skipped: number, errors: string[] }>}
 */
export async function insertMissingSubscriptionDonations(
  subscriptionId,
  daysBack,
  options = {}
) {
  const { sendReceipts = false } = options
  const { recurringDonation, missing } = await listMissingSubscriptionCharges(
    subscriptionId,
    daysBack
  )

  if (!recurringDonation) {
    throw new Error(
      `No active RecurringDonation found for PayPal subscription ${subscriptionId}. Check paypalSubscriptionId in MongoDB.`
    )
  }

  let inserted = 0
  let skipped = 0
  const errors = []

  for (const row of missing) {
    const { id: chargeId, amount, currency, time: chargeInstant } = row
    if (!amount || amount <= 0) {
      skipped += 1
      errors.push(`Skip ${chargeId}: could not parse amount`)
      continue
    }

    try {
      const existing = await Donation.findOne({
        providerTxnId: chargeId,
        projectId: recurringDonation.projectId,
        userId: recurringDonation.userId,
      })
      if (existing?.paymentStatus === 'completed') {
        skipped += 1
        continue
      }

      const duplicateAlternate = await Donation.findOne({
        recurringDonationId: recurringDonation._id,
        paymentStatus: 'completed',
        amount,
        donatedAt: {
          $gte: new Date(chargeInstant.getTime() - ALT_WEBHOOK_DEDUPE_MS),
          $lte: new Date(chargeInstant.getTime() + ALT_WEBHOOK_DEDUPE_MS),
        },
        providerTxnId: { $ne: chargeId },
      })
      if (duplicateAlternate) {
        skipped += 1
        continue
      }

      const donation = new Donation({
        userId: recurringDonation.userId,
        projectId: recurringDonation.projectId,
        amount,
        currency,
        donatedAt: chargeInstant,
        message: null,
        paymentProvider: 'paypal',
        paymentStatus: 'completed',
        paypalOrderId: null,
        providerTxnId: chargeId,
        paypalPayerId: null,
        recurringDonationId: recurringDonation._id,
      })
      await donation.save()

      await Project.findByIdAndUpdate(recurringDonation.projectId, {
        $inc: { currentAmount: amount },
      })
      await User.findByIdAndUpdate(recurringDonation.userId, {
        $inc: { 'donorProfile.totalAmountDonated': amount },
      })

      if (sendReceipts) {
        try {
          const user = await User.findById(recurringDonation.userId)
            .select('email firstName')
            .lean()
          if (user?.email) {
            const project = await Project.findById(recurringDonation.projectId)
              .select('name')
              .lean()
            await sendRecurringDonationReceiptEmail(
              user.email,
              user.firstName,
              amount,
              currency,
              recurringDonation.interval,
              project?.name || 'Mill Creek United Foundation'
            )
            donation.receiptEmailSent = true
            await donation.save()
          }
        } catch (e) {
          errors.push(`Receipt ${chargeId}: ${e.message}`)
        }
      }

      const rd = await RecurringDonation.findById(recurringDonation._id)
      if (rd) {
        rd.lastChargeDate = chargeInstant
        const nextDate = new Date(chargeInstant)
        if (rd.interval === 'weekly') nextDate.setDate(nextDate.getDate() + 7)
        else if (rd.interval === 'monthly')
          nextDate.setMonth(nextDate.getMonth() + 1)
        else if (rd.interval === 'yearly')
          nextDate.setFullYear(nextDate.getFullYear() + 1)
        rd.nextChargeDate = nextDate
        await rd.save()
      }

      inserted += 1
    } catch (e) {
      errors.push(`${chargeId}: ${e.message}`)
    }
  }

  return { inserted, skipped, errors }
}

function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

function amountsDiffer(stored, payPal) {
  return roundMoney(stored) !== roundMoney(payPal)
}

/**
 * Read PayPal's current recurring amount for a subscription.
 * Prefers last successful payment amount; falls back to plan REGULAR cycle fixed price.
 *
 * @returns {Promise<{ amount: number, currency: string } | null>}
 */
export async function fetchAuthoritativeRecurringAmountFromPaypal(subscriptionId) {
  const sub = await paypalService.getSubscriptionDetails(subscriptionId)
  const lastAmt = sub.billing_info?.last_payment?.amount
  if (lastAmt?.value != null && String(lastAmt.value).trim() !== '') {
    const amount = parseFloat(lastAmt.value)
    if (!Number.isNaN(amount) && amount > 0) {
      return {
        amount,
        currency: lastAmt.currency_code || 'USD',
      }
    }
  }
  if (sub.plan_id) {
    const plan = await paypalService.getBillingPlan(sub.plan_id)
    const regular = plan.billing_cycles?.find((bc) => bc.tenure_type === 'REGULAR')
    const fp = regular?.pricing_scheme?.fixed_price
    if (fp?.value != null && String(fp.value).trim() !== '') {
      const amount = parseFloat(fp.value)
      if (!Number.isNaN(amount) && amount > 0) {
        return {
          amount,
          currency: fp.currency_code || 'USD',
        }
      }
    }
  }
  return null
}

/**
 * Align RecurringDonation.amount/currency with PayPal for active rows.
 *
 * @param {Object} options
 * @param {string[]} options.subscriptionIds - PayPal subscription IDs (I-...)
 * @param {boolean} [options.dryRun=true] - If false, persist updates
 * @returns {Promise<Array<{ subscriptionId: string, recurringDonationId?: string, status: string, previous?: object, next?: object, error?: string }>>}
 */
export async function syncRecurringDonationAmountsFromPaypal(options = {}) {
  const { subscriptionIds = [], dryRun = true } = options
  const results = []

  for (const sid of subscriptionIds) {
    try {
      const authoritative = await fetchAuthoritativeRecurringAmountFromPaypal(sid)
      if (!authoritative) {
        results.push({
          subscriptionId: sid,
          status: 'error',
          error: 'Could not read amount from PayPal (no last_payment and no plan price)',
        })
        continue
      }

      const docs = await RecurringDonation.find({
        paypalSubscriptionId: sid,
        status: 'active',
      })

      if (!docs.length) {
        results.push({
          subscriptionId: sid,
          status: 'skipped',
          error: 'No active RecurringDonation for this PayPal subscription',
        })
        continue
      }

      for (const doc of docs) {
        const prev = { amount: doc.amount, currency: doc.currency || 'USD' }
        const currencyMismatch =
          (doc.currency || 'USD').toUpperCase() !==
          (authoritative.currency || 'USD').toUpperCase()
        const changed =
          amountsDiffer(doc.amount, authoritative.amount) || currencyMismatch

        if (!changed) {
          results.push({
            subscriptionId: sid,
            recurringDonationId: String(doc._id),
            status: 'unchanged',
          })
          continue
        }

        if (!dryRun) {
          doc.amount = authoritative.amount
          doc.currency = authoritative.currency
          await doc.save()
        }

        results.push({
          subscriptionId: sid,
          recurringDonationId: String(doc._id),
          status: dryRun ? 'would_update' : 'updated',
          previous: prev,
          next: {
            amount: authoritative.amount,
            currency: authoritative.currency,
          },
        })
      }
    } catch (e) {
      results.push({ subscriptionId: sid, status: 'error', error: e.message })
    }
  }

  return results
}
