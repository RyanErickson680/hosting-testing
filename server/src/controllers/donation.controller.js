import Donation from 'models/donation.model'
import RecurringDonation from 'models/recurring-donation.model'
import PaymentTransaction from 'models/payment-transaction.model'
import Project from 'models/project.model'
import User from 'models/user.model'
import * as paypalService from 'services/paypal.service'
import {
  createUser,
  findUserByEmail,
  generateToken,
} from 'services/auth.service'
import {
  resolveDonorInfo,
  sendDonationReceiptEmail,
  sendGenericDonationReceiptEmail,
} from 'services/email.service'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { clampLimit } from 'utils/pagination'
import { computeDisplayNextChargeDate } from 'utils/recurring-donation-dates'
import { withRetry } from 'utils/retry'
import { safeRegexSubstring } from 'utils/regex'

/**
 * Latest completed charge time for a recurring subscription (prefers linked donations).
 */
async function getLastCompletedDonationDateForRecurring(recurring, userIdObj) {
  const rid = recurring._id
  const linked = await Donation.findOne({
    recurringDonationId: rid,
    paymentStatus: 'completed',
  })
    .sort({ donatedAt: -1 })
    .select('donatedAt')
    .lean()
  if (linked?.donatedAt) return new Date(linked.donatedAt)

  const initialTxn = `subscription_initial_${rid}`
  const byInitial = await Donation.findOne({
    providerTxnId: initialTxn,
    userId: userIdObj,
    paymentStatus: 'completed',
  })
    .select('donatedAt')
    .lean()
  const candidates = []
  if (byInitial?.donatedAt) candidates.push(new Date(byInitial.donatedAt))

  if (candidates.length === 0) return null
  return new Date(Math.max(...candidates.map((d) => d.getTime())))
}

async function getStrictTotalContributedForRecurring(recurring, userIdObj) {
  const linkedSum = await Donation.aggregate([
    {
      $match: {
        recurringDonationId: recurring._id,
        userId: userIdObj,
        paymentStatus: 'completed',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ])

  let totalContributed = linkedSum[0]?.total || 0

  const initialTxnId = `subscription_initial_${recurring._id}`
  const initialDonation = await Donation.findOne({
    providerTxnId: initialTxnId,
    userId: userIdObj,
    paymentStatus: 'completed',
  })
    .select('_id amount recurringDonationId')
    .lean()

  // Include the initial recurring charge even if historical data missed recurringDonationId.
  if (initialDonation && !initialDonation.recurringDonationId) {
    totalContributed += initialDonation.amount || 0
  }

  return totalContributed
}

async function attachComputedNextChargeToSubscriptionLean(
  subscription,
  userId
) {
  const userIdObj = new mongoose.Types.ObjectId(userId)
  const lastDonationDate = await getLastCompletedDonationDateForRecurring(
    subscription,
    userIdObj
  )
  const lastChargeDate = subscription.lastChargeDate
    ? new Date(subscription.lastChargeDate)
    : null
  const nextChargeDate = computeDisplayNextChargeDate({
    lastDonationDate,
    lastChargeDate,
    interval: subscription.interval,
  })
  const fallbackAnchor = subscription.startDate ? new Date(subscription.startDate) : null
  const computedFromStart = fallbackAnchor
    ? computeDisplayNextChargeDate({
        lastDonationDate: fallbackAnchor,
        lastChargeDate: null,
        interval: subscription.interval,
      })
    : null
  return {
    ...subscription,
    nextChargeDate: nextChargeDate || computedFromStart || null,
  }
}

/** Public-safe label (initials) — no full names for anonymous API consumers */
function donorDisplayNamePublic(firstName, lastName) {
  const fi = (firstName || '').trim().charAt(0)
  const li = (lastName || '').trim().charAt(0)
  if (fi && li) return `${fi}. ${li}.`
  if (fi) return `${fi}.`
  return 'Supporter'
}

/**
 * GET /api/donations/project/:projectId
 * Get donations for a specific project (completed payments only — not abandoned checkouts).
 * Query parameters:
 * - limit: limit number of results (default: 20)
 * - skip: skip number of results (for pagination)
 * - includeMessages: only return donations with messages (default: false)
 */
export const getDonationsByProject = async (req, res) => {
  const { projectId } = req.params
  const { limit, skip = 0, includeMessages = false } = req.query
  const viewerAuthenticated = Boolean(req.userId)

  const clampedLimit = clampLimit(limit, 20)

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  // Build query filter — only completed payments count as public donations (messages, totals, lists).
  // Pending records exist only until PayPal checkout finishes; they must not appear as real donations.
  const filter = {
    projectId: new mongoose.Types.ObjectId(projectId),
    paymentStatus: 'completed',
  }

  // If includeMessages is true, only return donations with messages
  if (includeMessages === 'true') {
    filter.message = { $exists: true, $ne: null, $ne: '' }
  }

  const [error, donations] = await to(
    Donation.find(filter)
      .populate('userId', 'firstName lastName')
      .sort({ donatedAt: -1 }) // Most recent first
      .limit(clampedLimit)
      .skip(parseInt(skip, 10))
      .lean()
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })

  // Check for recurring donation info by cross-referencing RecurringDonation records
  // Collect unique user IDs from the fetched donations
  const userIds = [
    ...new Set(
      donations
        .map((d) =>
          d.userId && typeof d.userId === 'object'
            ? d.userId._id?.toString()
            : d.userId?.toString()
        )
        .filter(Boolean)
    ),
  ]

  // Batch query recurring donations for these users on this project
  let recurringMap = {}
  if (userIds.length > 0) {
    const [recurringError, recurringDonations] = await to(
      RecurringDonation.find({
        projectId: new mongoose.Types.ObjectId(projectId),
        userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .select('userId interval status')
        .lean()
    )

    if (!recurringError && recurringDonations) {
      recurringDonations.forEach((rd) => {
        recurringMap[rd.userId.toString()] = {
          interval: rd.interval,
          status: rd.status,
        }
      })
    }
  }

  // Format donations to include donor name and recurring info
  const formattedDonations = donations.map((donation) => {
    const donor = donation.userId
    // Handle both populated user object and ObjectId
    const isPopulated = donor && typeof donor === 'object' && donor._id
    const donorId = isPopulated ? donor._id?.toString() : donor?.toString()

    // Check if this donation is from a recurring subscription
    const recurringInfo = donorId ? recurringMap[donorId] || null : null

    let donorPayload = null
    if (isPopulated) {
      const fullName =
        `${donor.firstName || ''} ${donor.lastName || ''}`.trim() || 'Supporter'
      const displayName = viewerAuthenticated
        ? fullName
        : donorDisplayNamePublic(donor.firstName, donor.lastName)
      donorPayload = {
        displayName,
        name: displayName,
        ...(viewerAuthenticated && {
          firstName: donor.firstName,
          lastName: donor.lastName,
        }),
      }
    }

    return {
      _id: donation._id,
      amount: donation.amount,
      currency: donation.currency,
      donatedAt: donation.donatedAt,
      message: donation.message,
      paymentStatus: donation.paymentStatus, // Include status so frontend can show pending badge
      recurringInterval: recurringInfo ? recurringInfo.interval : null,
      donor: donorPayload,
    }
  })

  // Get total count for pagination
  const [countError, total] = await to(Donation.countDocuments(filter))
  if (countError) {
    return res.status(500).json({ error: countError.message })
  }

  // Unique donors who have completed at least one payment (exclude abandoned checkouts)
  const [donorCountError, donorCountResult] = await to(
    Donation.aggregate([
      {
        $match: {
          projectId: new mongoose.Types.ObjectId(projectId),
          paymentStatus: 'completed',
        },
      },
      { $group: { _id: '$userId' } },
      { $count: 'count' },
    ])
  )

  const donorCount = donorCountError ? 0 : donorCountResult[0]?.count || 0

  return res.json({
    donations: formattedDonations,
    total,
    limit: parseInt(limit, 10),
    skip: parseInt(skip, 10),
    donorCount,
  })
}

/**
 * GET /api/donations/admin/payments
 * Admin-only payment list + lookup for fundraising support.
 */
export const getAdminDonationPayments = async (req, res) => {
  const { query = '', status = '', projectId = '', limit, skip = 0 } = req.query

  const clampedLimit = clampLimit(limit, 25)
  const parsedSkip = Number.parseInt(skip, 10) || 0
  const trimmedQuery = String(query).trim()
  const filter = {}

  if (status) {
    filter.paymentStatus = status
  }

  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID format' })
    }
    filter.projectId = new mongoose.Types.ObjectId(projectId)
  }

  if (trimmedQuery) {
    const searchConditions = [
      { providerTxnId: { $regex: safeRegexSubstring(trimmedQuery), $options: 'i' } },
      { paypalOrderId: { $regex: safeRegexSubstring(trimmedQuery), $options: 'i' } },
      { donorEmail: { $regex: safeRegexSubstring(trimmedQuery), $options: 'i' } },
    ]

    if (mongoose.Types.ObjectId.isValid(trimmedQuery)) {
      searchConditions.unshift({
        _id: new mongoose.Types.ObjectId(trimmedQuery),
      })
    }

    filter.$or = searchConditions
  }

  const [error, donations] = await to(
    Donation.find(filter)
      .populate('projectId', 'name')
      .populate('userId', 'firstName lastName email')
      .sort({ donatedAt: -1, _id: -1 })
      .limit(clampedLimit)
      .skip(parsedSkip)
      .lean()
  )

  if (error)
    return res.status(500).json({ error: 'Failed to fetch donation payments' })

  const [countError, total] = await to(Donation.countDocuments(filter))
  if (countError)
    return res.status(500).json({ error: 'Failed to count donation payments' })

  const payments = donations.map((donation) => {
    const firstName = donation.userId?.firstName || ''
    const lastName = donation.userId?.lastName || ''
    const donorName = `${firstName} ${lastName}`.trim() || null

    return {
      _id: donation._id,
      referenceId: donation._id.toString(),
      donatedAt: donation.donatedAt,
      amount: donation.amount,
      currency: donation.currency,
      paymentStatus: donation.paymentStatus,
      paymentProvider: donation.paymentProvider || 'paypal',
      providerTxnId: donation.providerTxnId || null,
      paypalOrderId: donation.paypalOrderId || null,
      donorEmail: donation.userId?.email || donation.donorEmail || null,
      donorName,
      donorUserId: donation.userId?._id?.toString() || null,
      project: donation.projectId
        ? {
            _id: donation.projectId._id?.toString() || null,
            name: donation.projectId.name || 'Unknown project',
          }
        : null,
      message: donation.message || null,
      receiptEmailSent: Boolean(donation.receiptEmailSent),
    }
  })

  return res.json({
    payments,
    total,
    limit: clampedLimit,
    skip: parsedSkip,
  })
}

/**
 * POST /api/donations/create-order
 * Create a PayPal order for one-time donation
 */
export const createDonationOrder = async (req, res) => {
  const { projectId, amount, currency = 'USD', email } = req.body
  const rawUserId = req.userId || req.body.userId // Support guest donations
  const userId =
    rawUserId && mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : null

  // Validation
  if (!projectId || !amount) {
    return res.status(400).json({ error: 'Project ID and amount are required' })
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  if (amount < 1) {
    return res.status(400).json({ error: 'Amount must be at least $1.00' })
  }

  // Verify project exists
  const [projectError, project] = await to(Project.findById(projectId))
  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  try {
    // Create PayPal order (pass email for autofill in card payment form)
    const order = await paypalService.createOrder(
      amount,
      currency,
      projectId,
      userId,
      email
    )

    // Create pending donation record (no public message until capture — avoids showing messages for abandoned PayPal sessions)
    const donation = new Donation({
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      projectId: new mongoose.Types.ObjectId(projectId),
      amount,
      currency,
      message: null,
      donorEmail: email || null, // Persist guest donor email for receipt
      paymentProvider: 'paypal',
      paymentStatus: 'pending',
      paypalOrderId: order.orderId,
    })

    await donation.save()

    // Find approval URL
    const approvalUrl = order.links?.find(
      (link) => link.rel === 'approve'
    )?.href

    return res.json({
      success: true,
      orderId: order.orderId,
      approvalUrl,
      donationId: donation._id,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return res.status(500).json({ error: 'Failed to create order' })
  }
}

/**
 * POST /api/donations/capture-order
 * Capture payment after user approval
 */
export const captureDonationOrder = async (req, res) => {
  const {
    orderId,
    payerId,
    createAccount,
    accountData,
    updateAccountInfo,
    message,
  } = req.body
  const authenticatedUserId = req.userId // User ID from authentication middleware

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' })
  }

  try {
    // Atomically claim the donation for processing — prevents duplicate processing by webhook.
    // findOneAndUpdate returns the OLD document (new: false); returns null if already claimed.
    const donation = await Donation.findOneAndUpdate(
      { paypalOrderId: orderId, paymentStatus: 'pending' },
      { $set: { paymentStatus: 'in-progress' } },
      { new: false }
    )
    if (!donation) {
      // Either the donation doesn't exist or another handler already claimed it
      const existing = await Donation.findOne({ paypalOrderId: orderId }).lean()
      if (!existing) {
        return res.status(404).json({ error: 'Donation not found' })
      }
      // Already processed or being processed by the webhook — return idempotent success
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        donationId: existing._id,
      })
    }

    // Store optional donor message only after the user returns from the PayPal flow (not at create-order)
    if (message !== undefined) {
      donation.message =
        typeof message === 'string' && message.trim() !== ''
          ? message.trim()
          : null
    }

    let createdUser = null
    let userId = donation.userId
    let accountUpdated = false

    // Handle account info update for logged-in users who edited their info
    if (updateAccountInfo && authenticatedUserId) {
      const { firstName, lastName, email } = updateAccountInfo

      // Verify the authenticated user matches the donation user
      if (
        donation.userId &&
        donation.userId.toString() !== authenticatedUserId.toString()
      ) {
        return res
          .status(403)
          .json({ error: 'Cannot update account info for this donation' })
      }

      // Get current user to compare
      const currentUser = await User.findById(authenticatedUserId)
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      const updates = {}
      let hasChanges = false

      // Check if any fields changed
      if (firstName && firstName.trim() !== currentUser.firstName) {
        updates.firstName = firstName.trim()
        hasChanges = true
      }
      if (lastName && lastName.trim() !== currentUser.lastName) {
        updates.lastName = lastName.trim()
        hasChanges = true
      }
      if (email && email.trim() !== currentUser.email) {
        // Check if email is already taken by another user
        const emailExists = await findUserByEmail(email.trim())
        if (
          emailExists &&
          emailExists._id.toString() !== authenticatedUserId.toString()
        ) {
          return res
            .status(400)
            .json({ error: 'Email is already registered to another account' })
        }
        updates.email = email.trim()
        hasChanges = true
      }

      // Update user account if there are changes
      if (hasChanges) {
        await User.findByIdAndUpdate(authenticatedUserId, updates)
        accountUpdated = true
        console.log(`Updated account info for user ${authenticatedUserId}`)
      }
    }

    // Handle account creation if requested
    if (createAccount && accountData) {
      const { email, password, firstName, lastName } = accountData

      // Validate account data
      if (!email || !password || !firstName || !lastName) {
        return res
          .status(400)
          .json({
            error:
              'Account creation requires email, password, first name, and last name',
          })
      }

      // Check if user already exists
      const existingUser = await findUserByEmail(email)

      if (existingUser) {
        // User already exists, use their ID
        userId = existingUser._id
        // Update donation with existing user ID
        donation.userId = userId
      } else {
        // Create new user account
        try {
          createdUser = await createUser({
            email,
            password,
            firstName,
            lastName,
            isVolunteer: false, // Donations create donor accounts
          })
          userId = createdUser._id
          // Update donation with new user ID
          donation.userId = userId

          // Generate token and set cookie for automatic login
          const token = generateToken(userId.toString(), createdUser.role, createdUser.tokenVersion ?? 0)
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
          })
        } catch (userError) {
          console.error('Error creating user account:', userError)
          // Continue with donation even if account creation fails
          // The donation will be associated with a guest user
        }
      }
    }

    // Capture payment with PayPal
    const capture = await paypalService.captureOrder(orderId)

    // Check capture status - handle DECLINED, PENDING, and other non-completed statuses
    if (capture.status === 'DECLINED') {
      // Payment was declined by the card processor
      donation.paymentStatus = 'failed'
      donation.providerTxnId = capture.transactionId
      donation.paypalPayerId = payerId || capture.payerId
      donation.failureReason =
        capture.failureReason || 'Payment declined by card processor'
      await donation.save()

      return res.status(400).json({
        error: 'Payment declined',
        details:
          capture.failureReason ||
          'Your card was declined. Please try a different payment method.',
        donationId: donation._id,
      })
    }

    if (capture.status === 'PENDING') {
      // Payment is pending (e.g., 3D Secure authentication required)
      // Update donation status and add to project total immediately
      donation.paymentStatus = 'pending'
      donation.providerTxnId = capture.transactionId
      donation.paypalPayerId = payerId || capture.payerId
      await donation.save()

      // Update project total with pending amount (will be finalized when webhook confirms)
      await Project.findByIdAndUpdate(donation.projectId, {
        $inc: { currentAmount: donation.amount },
      })

      // Update user donor profile (tentative, will be finalized on completion)
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $inc: { 'donorProfile.totalAmountDonated': donation.amount },
        })
      }

      return res.status(202).json({
        success: true,
        pending: true,
        message:
          'Payment is pending. It will be processed once authentication is complete.',
        donation: {
          _id: donation._id,
          amount: donation.amount,
          currency: donation.currency,
          donatedAt: donation.donatedAt,
          message: donation.message,
          paymentStatus: 'pending',
        },
        donationId: donation._id,
      })
    }

    if (capture.status !== 'COMPLETED') {
      // Unknown or unexpected status
      donation.paymentStatus = 'failed'
      donation.providerTxnId = capture.transactionId
      donation.paypalPayerId = payerId || capture.payerId
      donation.failureReason = `Unexpected payment status: ${capture.status}`
      await donation.save()

      return res.status(400).json({
        error: 'Payment processing failed',
        details: `Payment status: ${capture.status}`,
        donationId: donation._id,
      })
    }

    // Payment is COMPLETED - proceed with success flow wrapped in a transaction
    // so all writes succeed or none do (prevents partial state on server crash)
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await Donation.findByIdAndUpdate(
          donation._id,
          {
            $set: {
              paymentStatus: 'completed',
              providerTxnId: capture.transactionId,
              paypalPayerId: payerId || capture.payerId,
              ...(message !== undefined && {
                message: typeof message === 'string' && message.trim() !== '' ? message.trim() : null,
              }),
            },
          },
          { session }
        )

        await Project.findByIdAndUpdate(
          donation.projectId,
          { $inc: { currentAmount: donation.amount } },
          { session }
        )

        if (userId) {
          await User.findByIdAndUpdate(
            userId,
            { $inc: { 'donorProfile.totalAmountDonated': donation.amount } },
            { session }
          )
        }

        await PaymentTransaction.create(
          [
            {
              type: 'donation',
              donationId: donation._id,
              userId: userId || null,
              projectId: donation.projectId,
              amount: donation.amount,
              currency: donation.currency,
              paypalOrderId: orderId,
              paypalTransactionId: capture.transactionId,
              status: 'completed',
              processedAt: new Date(),
              metadata: { capture },
            },
          ],
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    // Sync in-memory fields for response / email use
    donation.paymentStatus = 'completed'
    donation.providerTxnId = capture.transactionId

    // Send donation receipt email with retry — email failures must never roll back the donation
    try {
      const donorInfo = await resolveDonorInfo(donation)
      if (donorInfo) {
        const project = await Project.findById(donation.projectId).select('name currentAmount goalAmount').lean()
        const projectName = project?.name || 'Mill Creek United Foundation'
        const projectProgress = project?.goalAmount
          ? {
              currentAmount: project.currentAmount || 0,
              goalAmount: project.goalAmount,
            }
          : null

        let recurringInterval = null
        if (donation.recurringDonationId) {
          const rd = await RecurringDonation.findById(
            donation.recurringDonationId
          )
            .select('interval')
            .lean()
          recurringInterval = rd?.interval || null
        }

        await withRetry(() =>
          donorInfo.firstName
            ? sendDonationReceiptEmail(
                donorInfo.email,
                donorInfo.firstName,
                donation.amount,
                donation.currency,
                projectName,
                projectProgress,
                donation.providerTxnId,
                donation._id.toString(),
                recurringInterval,
              )
            : sendGenericDonationReceiptEmail(
                donorInfo.email,
                donation.amount,
                donation.currency,
                projectName,
                donation.providerTxnId,
                donation._id.toString(),
                recurringInterval,
              )
        )

        // Atomically mark receipt as sent only after confirmed delivery
        await Donation.findByIdAndUpdate(donation._id, { receiptEmailSent: true })
      }
    } catch (emailError) {
      console.error('Warning: Failed to send donation receipt email after retries:', emailError.message)
    }

    // Prepare response
    const response = {
      success: true,
      donation: {
        _id: donation._id,
        amount: donation.amount,
        currency: donation.currency,
        donatedAt: donation.donatedAt,
        message: donation.message,
        projectId: donation.projectId,
      },
      paypalTransactionId: donation.providerTxnId || null,
    }

    // Include user data if account was created
    if (createdUser) {
      response.user = createdUser
      response.accountCreated = true
    }

    // Indicate if account was updated
    if (accountUpdated) {
      response.accountUpdated = true
    }

    return res.json(response)
  } catch (error) {
    console.error('Capture order error:', error)

    // Update donation status if it exists
    const donation = await Donation.findOne({ paypalOrderId: orderId })
    if (donation && donation.paymentStatus === 'pending') {
      donation.paymentStatus = 'failed'
      donation.failureReason = error.message
      await donation.save()
    }

    return res.status(500).json({ error: 'Failed to capture payment' })
  }
}

/**
 * POST /api/donations/create-subscription
 * Create a recurring donation subscription
 */
export const createRecurringSubscription = async (req, res) => {
  const { projectId, amount, interval, currency = 'USD', message } = req.body
  const userId = req.userId || req.body.userId

  // Validation
  if (!projectId || !amount || !interval) {
    return res
      .status(400)
      .json({ error: 'Project ID, amount, and interval are required' })
  }

  if (!['weekly', 'monthly', 'yearly'].includes(interval)) {
    return res
      .status(400)
      .json({ error: 'Interval must be weekly, monthly, or yearly' })
  }

  if (!userId) {
    return res
      .status(400)
      .json({ error: 'User ID is required for recurring donations' })
  }

  // Verify project exists
  const [projectError, project] = await to(Project.findById(projectId))
  if (projectError || !project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  try {
    // Create PayPal subscription plan
    const plan = await paypalService.createSubscriptionPlan(
      amount,
      interval,
      currency
    )

    // Create PayPal subscription
    const subscription = await paypalService.createSubscription(
      plan.planId,
      projectId,
      userId
    )

    // Calculate next charge date
    const nextChargeDate = new Date()
    if (interval === 'weekly')
      nextChargeDate.setDate(nextChargeDate.getDate() + 7)
    else if (interval === 'monthly')
      nextChargeDate.setMonth(nextChargeDate.getMonth() + 1)
    else if (interval === 'yearly')
      nextChargeDate.setFullYear(nextChargeDate.getFullYear() + 1)

    // Create recurring donation record
    const recurringDonation = new RecurringDonation({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId),
      interval,
      amount,
      currency,
      status: 'active',
      provider: 'paypal',
      providerSubscriptionId: subscription.subscriptionId,
      paypalPlanId: plan.planId,
      paypalSubscriptionId: subscription.subscriptionId,
      paymentStatus: 'active',
      startDate: new Date(),
      nextChargeDate,
      initialMessage: message || null, // Store message for initial display only
    })
    await recurringDonation.save()

    return res.json({
      success: true,
      subscriptionId: subscription.subscriptionId,
      approvalUrl: subscription.approvalUrl,
      recurringDonationId: recurringDonation._id,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return res.status(500).json({ error: 'Failed to create subscription' })
  }
}

/**
 * POST /api/donations/subscription/activate
 * Activate a subscription after the user returns from PayPal approval.
 * Creates the initial Donation record, updates project/user totals, sends email.
 * This is the recurring-donation equivalent of captureDonationOrder.
 */
export const activateSubscription = async (req, res) => {
  const { subscriptionId } = req.body
  const userId = req.userId

  if (!subscriptionId) {
    return res.status(400).json({ error: 'Subscription ID is required' })
  }

  try {
    // Find the recurring donation record
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
    })

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    // Verify the subscription belongs to the authenticated user
    if (recurringDonation.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to activate this subscription' })
    }

    // Idempotency: check if an initial donation already exists for this subscription
    const existingDonation = await Donation.findOne({
      providerTxnId: `subscription_initial_${recurringDonation._id}`,
    })

    if (existingDonation) {
      if (!existingDonation.recurringDonationId) {
        existingDonation.recurringDonationId = recurringDonation._id
        await existingDonation.save()
      }
      // Already activated — return the existing donation data
      const project = await Project.findById(recurringDonation.projectId)
        .select('name')
        .lean()
      return res.json({
        success: true,
        alreadyActivated: true,
        donation: {
          _id: existingDonation._id,
          amount: existingDonation.amount,
          currency: existingDonation.currency,
          donatedAt: existingDonation.donatedAt,
          message: existingDonation.message,
          projectName: project?.name || null,
        },
      })
    }

    // Verify subscription status with PayPal
    let paypalStatus = null
    try {
      const paypalDetails = await paypalService.getSubscriptionDetails(
        subscriptionId
      )
      paypalStatus = paypalDetails.status
    } catch (paypalError) {
      console.error(
        'PayPal subscription status check failed:',
        paypalError.message
      )
      // Continue if PayPal check fails — the subscription record exists and user approved
    }

    // Accept ACTIVE or APPROVED — both mean the user has authorized the subscription
    if (paypalStatus && !['ACTIVE', 'APPROVED'].includes(paypalStatus)) {
      return res.status(400).json({
        error: `Subscription is not active (status: ${paypalStatus})`,
      })
    }

    // Update recurring donation status if needed
    if (recurringDonation.status !== 'active') {
      recurringDonation.status = 'active'
      recurringDonation.paymentStatus = 'active'
      await recurringDonation.save()
    }

    // Create the initial Donation record
    const donation = new Donation({
      userId: recurringDonation.userId,
      projectId: recurringDonation.projectId,
      amount: recurringDonation.amount,
      currency: recurringDonation.currency,
      donatedAt: new Date(),
      message: recurringDonation.initialMessage || null,
      paymentProvider: 'paypal',
      paymentStatus: 'completed',
      providerTxnId: `subscription_initial_${recurringDonation._id}`,
      recurringDonationId: recurringDonation._id,
    })
    await donation.save()

    // Update project total
    await Project.findByIdAndUpdate(recurringDonation.projectId, {
      $inc: { currentAmount: recurringDonation.amount },
    })

    // Update user donor profile
    await User.findByIdAndUpdate(userId, {
      $inc: { 'donorProfile.totalAmountDonated': recurringDonation.amount },
    })

    // Send receipt email (non-blocking)
    try {
      const donorInfo = await resolveDonorInfo(donation)
      if (donorInfo) {
        const project = await Project.findById(recurringDonation.projectId)
          .select('name currentAmount goalAmount')
          .lean()
        const projectName = project?.name || 'Mill Creek United Foundation'
        const projectProgress = project?.goalAmount
          ? {
              currentAmount: project.currentAmount || 0,
              goalAmount: project.goalAmount,
            }
          : null

        if (donorInfo.firstName) {
          await sendDonationReceiptEmail(
            donorInfo.email,
            donorInfo.firstName,
            recurringDonation.amount,
            recurringDonation.currency,
            projectName,
            projectProgress,
            donation.providerTxnId,
            donation._id.toString(),
            recurringDonation.interval
          )
        } else {
          await sendGenericDonationReceiptEmail(
            donorInfo.email,
            recurringDonation.amount,
            recurringDonation.currency,
            projectName,
            donation.providerTxnId,
            donation._id.toString(),
            recurringDonation.interval
          )
        }

        donation.receiptEmailSent = true
        await donation.save()
      }
    } catch (emailError) {
      console.error(
        'Warning: Failed to send subscription receipt email:',
        emailError.message
      )
    }

    // Get project name for response
    const project = await Project.findById(recurringDonation.projectId)
      .select('name')
      .lean()

    return res.json({
      success: true,
      donation: {
        _id: donation._id,
        amount: donation.amount,
        currency: donation.currency,
        donatedAt: donation.donatedAt,
        message: donation.message,
        projectName: project?.name || null,
      },
      interval: recurringDonation.interval,
    })
  } catch (error) {
    console.error('Activate subscription error:', error)
    return res.status(500).json({ error: 'Failed to activate subscription' })
  }
}

/**
 * GET /api/donations/recurring/:recurringDonationId
 * Get recurring donation details by app _id (for manage page)
 */
export const getRecurringDonationById = async (req, res) => {
  const { recurringDonationId } = req.params
  const userId = req.userId

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (!mongoose.Types.ObjectId.isValid(recurringDonationId)) {
    return res.status(400).json({ error: 'Invalid recurring donation ID' })
  }

  try {
    const recurringDonation = await RecurringDonation.findOne({
      _id: new mongoose.Types.ObjectId(recurringDonationId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('projectId', 'name')
      .lean()

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Recurring donation not found' })
    }

    let paypalDetails = null
    let paypalReachable = false
    let paypalSubscriptionStatus = null
    let paypalErrorCode = null

    if (recurringDonation.paypalSubscriptionId) {
      try {
        paypalDetails = await paypalService.getSubscriptionDetails(
          recurringDonation.paypalSubscriptionId
        )
        paypalReachable = true
        paypalSubscriptionStatus = paypalDetails?.status ?? null
      } catch (err) {
        paypalReachable = false
        paypalDetails = null
        if (paypalService.isPayPalSubscriptionNotFoundError(err)) {
          paypalErrorCode = 'PAYPAL_SUBSCRIPTION_NOT_FOUND'
        } else {
          paypalErrorCode = 'PAYPAL_REQUEST_FAILED'
        }
      }
    } else {
      paypalReachable = false
      paypalErrorCode = 'NO_PAYPAL_SUBSCRIPTION_ID'
    }

    const subscription = await attachComputedNextChargeToSubscriptionLean(
      recurringDonation,
      userId
    )

    return res.json({
      subscription,
      paypalDetails,
      paypalReachable,
      paypalSubscriptionStatus,
      paypalErrorCode,
    })
  } catch (error) {
    console.error('Get recurring donation error:', error)
    return res.status(500).json({ error: 'Failed to load recurring donation' })
  }
}

/**
 * GET /api/donations/subscription/:subscriptionId
 * Get subscription details (by PayPal subscription ID)
 */
export const getSubscriptionDetails = async (req, res) => {
  const { subscriptionId } = req.params
  const userId = req.userId

  try {
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
    })
      .populate('userId', 'firstName lastName email')
      .populate('projectId', 'name')

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    const ownerId = (
      recurringDonation.userId?._id || recurringDonation.userId
    )?.toString()
    if (userId && ownerId !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to view this subscription' })
    }

    // Get latest details from PayPal
    const paypalDetails = await paypalService.getSubscriptionDetails(
      subscriptionId
    )

    return res.json({
      subscription: recurringDonation,
      paypalDetails,
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return res.status(500).json({ error: 'Failed to get subscription' })
  }
}

/**
 * PATCH /api/donations/subscription/:subscriptionId
 * Switch project only (DB-only: end current record, create new one for same PayPal subscription).
 */
export const updateSubscription = async (req, res) => {
  const { subscriptionId } = req.params
  const { projectId: newProjectId } = req.body
  const userId = req.userId

  try {
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
      status: 'active',
    })

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    if (recurringDonation.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this subscription' })
    }

    // Switch project: DB-only — end current record and create new one (same PayPal subscription, new project)
    if (
      newProjectId &&
      newProjectId !== recurringDonation.projectId.toString()
    ) {
      const newProject = await Project.findById(newProjectId)
        .select('name')
        .lean()
      if (!newProject) {
        return res.status(400).json({ error: 'Project not found' })
      }

      const newRecurringDonation = new RecurringDonation({
        userId: recurringDonation.userId,
        projectId: newProjectId,
        interval: recurringDonation.interval,
        amount: recurringDonation.amount,
        currency: recurringDonation.currency,
        status: 'active',
        provider: recurringDonation.provider || 'paypal',
        providerSubscriptionId: recurringDonation.providerSubscriptionId,
        paypalPlanId: recurringDonation.paypalPlanId,
        paypalSubscriptionId: recurringDonation.paypalSubscriptionId,
        paymentStatus: recurringDonation.paymentStatus,
        startDate: new Date(),
        lastChargeDate: recurringDonation.lastChargeDate,
        nextChargeDate: recurringDonation.nextChargeDate,
        failureCount: recurringDonation.failureCount ?? 0,
        lastFailureDate: recurringDonation.lastFailureDate,
        autoRetry: recurringDonation.autoRetry ?? true,
      })
      await newRecurringDonation.save()

      recurringDonation.status = 'transferred'
      recurringDonation.transferredToRecurringDonationId =
        newRecurringDonation._id
      await recurringDonation.save()

      return res.json({
        success: true,
        subscription: {
          _id: newRecurringDonation._id,
          amount: newRecurringDonation.amount,
          currency: newRecurringDonation.currency,
          interval: newRecurringDonation.interval,
          projectName: newProject.name,
          nextChargeDate: newRecurringDonation.nextChargeDate,
        },
      })
    }

    return res.status(400).json({
      error:
        'Provide a different projectId to switch which campaign this subscription supports.',
    })
  } catch (error) {
    console.error('Update subscription error:', error)
    return res.status(500).json({ error: 'Failed to update subscription' })
  }
}

/**
 * POST /api/donations/subscription/:subscriptionId/cancel
 * Cancel a subscription
 */
export const cancelSubscription = async (req, res) => {
  const { subscriptionId } = req.params
  const { reason } = req.body
  const userId = req.userId

  try {
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
      status: { $in: ['active', 'paused'] },
    })

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    if (recurringDonation.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to cancel this subscription' })
    }

    // Cancel subscriber agreement in PayPal, then retire the plan template (one plan per signup in our integration)
    await paypalService.cancelSubscription(
      subscriptionId,
      reason || 'User requested cancellation'
    )

    if (recurringDonation.paypalPlanId) {
      try {
        await paypalService.deactivateBillingPlan(
          recurringDonation.paypalPlanId
        )
      } catch (planErr) {
        console.warn(
          'Warning: Failed to deactivate PayPal billing plan after cancel:',
          planErr.message
        )
      }
    }

    recurringDonation.status = 'cancelled'
    recurringDonation.paymentStatus = 'cancelled'
    recurringDonation.cancellationReason =
      reason || 'User requested cancellation'
    await recurringDonation.save()

    return res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    if (error instanceof paypalService.PayPalSubscriptionNotFoundError) {
      return res.status(502).json({
        error: error.message,
        code: 'PAYPAL_SUBSCRIPTION_NOT_FOUND',
      })
    }
    return res.status(500).json({ error: 'Failed to cancel subscription' })
  }
}

/**
 * POST /api/donations/subscription/:subscriptionId/suspend
 * Pause recurring charges in PayPal (subscriber can resume later).
 */
export const suspendUserSubscription = async (req, res) => {
  const { subscriptionId } = req.params
  const { reason } = req.body
  const userId = req.userId

  try {
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
      status: 'active',
    })

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    if (recurringDonation.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this subscription' })
    }

    await paypalService.suspendSubscription(
      subscriptionId,
      reason || 'Customer requested pause'
    )

    recurringDonation.status = 'paused'
    recurringDonation.paymentStatus = 'suspended'
    await recurringDonation.save()

    return res.json({ success: true, message: 'Subscription paused' })
  } catch (error) {
    console.error('Suspend subscription error:', error)
    if (error instanceof paypalService.PayPalSubscriptionNotFoundError) {
      return res.status(502).json({
        error: error.message,
        code: 'PAYPAL_SUBSCRIPTION_NOT_FOUND',
      })
    }
    return res.status(500).json({ error: 'Failed to pause subscription' })
  }
}

/**
 * POST /api/donations/subscription/:subscriptionId/resume
 * Resume a paused PayPal subscription.
 */
export const resumeUserSubscription = async (req, res) => {
  const { subscriptionId } = req.params
  const userId = req.userId

  try {
    const recurringDonation = await RecurringDonation.findOne({
      paypalSubscriptionId: subscriptionId,
      status: 'paused',
    })

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    if (recurringDonation.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this subscription' })
    }

    await paypalService.resumeSubscription(subscriptionId)

    recurringDonation.status = 'active'
    recurringDonation.paymentStatus = 'active'
    await recurringDonation.save()

    return res.json({ success: true, message: 'Subscription resumed' })
  } catch (error) {
    console.error('Resume subscription error:', error)
    if (error instanceof paypalService.PayPalSubscriptionNotFoundError) {
      return res.status(502).json({
        error: error.message,
        code: 'PAYPAL_SUBSCRIPTION_NOT_FOUND',
      })
    }
    return res.status(500).json({ error: 'Failed to resume subscription' })
  }
}

/**
 * GET /api/donations/me
 * Get current user's completed donations (excludes pending / incomplete payments)
 * Query parameters:
 * - limit: limit number of results (default: 20)
 * - skip: skip number of results (for pagination)
 * - projectId: filter by specific project (optional)
 */
export const getUserDonations = async (req, res) => {
  const userId = req.userId
  const { limit, skip = 0, projectId } = req.query

  const clampedLimit = clampLimit(limit, 20)

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  // Build query filter — completed payments only (exclude pending/abandoned PayPal checkouts)
  const filter = {
    userId: new mongoose.Types.ObjectId(userId),
    paymentStatus: 'completed',
  }

  // Optional project filter
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    filter.projectId = new mongoose.Types.ObjectId(projectId)
  }

  const [error, donations] = await to(
    Donation.find(filter)
      .populate('projectId', 'name')
      .sort({ donatedAt: -1 }) // Most recent first
      .limit(clampedLimit)
      .skip(parseInt(skip, 10))
      .lean()
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })

  // Format donations
  const formattedDonations = donations.map((donation) => ({
    _id: donation._id,
    projectId: donation.projectId?._id || donation.projectId,
    projectName: donation.projectId?.name || null,
    amount: donation.amount,
    currency: donation.currency,
    donatedAt: donation.donatedAt,
    message: donation.message,
    paymentStatus: donation.paymentStatus,
  }))

  // Get total count for pagination
  const [countError, total] = await to(Donation.countDocuments(filter))
  if (countError) {
    return res.status(500).json({ error: countError.message })
  }

  return res.json({
    donations: formattedDonations,
    total,
    limit: parseInt(limit, 10),
    skip: parseInt(skip, 10),
  })
}

/**
 * GET /api/donations/recurring/me
 * Get current user's recurring donations
 */
export const getUserRecurringDonations = async (req, res) => {
  const userId = req.userId

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const [error, recurringDonations] = await to(
    RecurringDonation.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['active', 'paused'] },
    })
      .populate('projectId', 'name')
      .sort({ startDate: -1 }) // Newest first
      .lean()
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })

  const userIdObj = new mongoose.Types.ObjectId(userId)

  // Calculate total contributed and next charge for each recurring donation
  const formattedRecurringDonations = await Promise.all(
    recurringDonations.map(async (recurring) => {
      const totalContributed = await getStrictTotalContributedForRecurring(
        recurring,
        userIdObj
      )

      const lastDonationDate = await getLastCompletedDonationDateForRecurring(
        recurring,
        userIdObj
      )
      const lastChargeDate = recurring.lastChargeDate
        ? new Date(recurring.lastChargeDate)
        : null
      const nextChargeDate = computeDisplayNextChargeDate({
        lastDonationDate,
        lastChargeDate,
        interval: recurring.interval,
      })
      const fallbackAnchor = recurring.startDate
        ? new Date(recurring.startDate)
        : null
      const computedFromStart = fallbackAnchor
        ? computeDisplayNextChargeDate({
            lastDonationDate: fallbackAnchor,
            lastChargeDate: null,
            interval: recurring.interval,
          })
        : null

      return {
        _id: recurring._id,
        projectId: recurring.projectId?._id || recurring.projectId,
        projectName: recurring.projectId?.name || null,
        amount: recurring.amount,
        currency: recurring.currency,
        interval: recurring.interval,
        status: recurring.status,
        paymentStatus: recurring.paymentStatus,
        startDate: recurring.startDate,
        lastChargeDate: recurring.lastChargeDate,
        nextChargeDate: nextChargeDate || computedFromStart || null,
        totalContributed: totalContributed || 0,
        paypalSubscriptionId: recurring.paypalSubscriptionId,
      }
    })
  )

  return res.json({
    recurringDonations: formattedRecurringDonations,
    total: formattedRecurringDonations.length,
  })
}

/**
 * GET /api/donations/stats
 * Admin only: aggregate donation data for analytics.
 * Returns:
 *   - monthlyTotals: [{ month: 'YYYY-MM', total, count }] for last 12 months
 *   - byCampaign: [{ projectId, name, total, count }] for all campaigns
 */
export const getDonationStats = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const [monthlyTotals, byCampaign] = await Promise.all([
      Donation.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            donatedAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$donatedAt' },
              month: { $month: '$donatedAt' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' },
                  ],
                },
              ],
            },
            total: 1,
            count: 1,
          },
        },
      ]),
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$projectId',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: '_id',
            as: 'project',
          },
        },
        { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            projectId: '$_id',
            name: { $ifNull: ['$project.name', 'Unknown Campaign'] },
            total: 1,
            count: 1,
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
    ])

    return res.json({ monthlyTotals, byCampaign })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
