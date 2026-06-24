import { Router } from 'express'
import {
  getDonationsByProject,
  createDonationOrder,
  captureDonationOrder,
  createRecurringSubscription,
  activateSubscription,
  getRecurringDonationById,
  getSubscriptionDetails,
  updateSubscription,
  cancelSubscription,
  suspendUserSubscription,
  resumeUserSubscription,
  getUserDonations,
  getUserRecurringDonations,
  getDonationStats,
  getAdminDonationPayments,
} from 'controllers/donation.controller'
import { authenticate, optionalAuth, isAdmin } from 'middleware/auth.middleware'

const donationRouter = Router()

// Admin analytics
donationRouter.get('/stats', authenticate, isAdmin, getDonationStats)
donationRouter.get(
  '/admin/payments',
  authenticate,
  isAdmin,
  getAdminDonationPayments
)

// Get donations for a specific project (optional auth: full donor names when logged in)
donationRouter.get('/project/:projectId', optionalAuth, getDonationsByProject)

// User-specific endpoints (require authentication)
donationRouter.get('/me', authenticate, getUserDonations)
donationRouter.get('/recurring/me', authenticate, getUserRecurringDonations)
donationRouter.get(
  '/recurring/:recurringDonationId',
  authenticate,
  getRecurringDonationById
)

// One-time donations
donationRouter.post('/create-order', optionalAuth, createDonationOrder) // Guest donations allowed
donationRouter.post('/capture-order', captureDonationOrder)

// Recurring donations (require authentication)
donationRouter.post(
  '/create-subscription',
  authenticate,
  createRecurringSubscription
)
donationRouter.post(
  '/subscription/activate',
  authenticate,
  activateSubscription
) // Must be before :subscriptionId
donationRouter.post(
  '/subscription/:subscriptionId/suspend',
  authenticate,
  suspendUserSubscription
)
donationRouter.post(
  '/subscription/:subscriptionId/resume',
  authenticate,
  resumeUserSubscription
)
donationRouter.patch(
  '/subscription/:subscriptionId',
  authenticate,
  updateSubscription
)
donationRouter.get(
  '/subscription/:subscriptionId',
  authenticate,
  getSubscriptionDetails
)
donationRouter.post(
  '/subscription/:subscriptionId/cancel',
  authenticate,
  cancelSubscription
)

export default donationRouter
