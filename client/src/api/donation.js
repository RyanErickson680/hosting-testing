import axios from 'axios'

const DonationClient = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'}/api/donations`,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests for authenticated endpoints
})

/**
 * Get donations for a specific project
 * @param {string} projectId - The project ID
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Limit number of results (default: 20)
 * @param {number} params.skip - Skip number of results (default: 0)
 * @param {boolean} params.includeMessages - Only return donations with messages (default: false)
 */
export const getDonationsByProject = ({ projectId, ...params }) => {
  const queryParams = new URLSearchParams()
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key])
    }
  })
  const queryString = queryParams.toString()
  return DonationClient.get(
    `/project/${projectId}${queryString ? `?${queryString}` : ''}`
  )
}

/**
 * Create a PayPal order for donation
 * @param {Object} donationData - The donation data
 * @param {string} donationData.projectId - Project ID
 * @param {number} donationData.amount - Donation amount
 * @param {string} donationData.currency - Currency code (default: USD)
 * @param {boolean} donationData.isAnonymous - Whether donation is anonymous
 * (Optional donor message is sent with capture-order after PayPal approval, not here.)
 */
export const createDonationOrder = (donationData) => {
  return DonationClient.post('/create-order', donationData)
}

/**
 * Capture PayPal order (complete payment)
 * @param {Object} orderData - The order data
 * @param {string} orderData.orderId - PayPal order ID
 * @param {string} orderData.payerId - PayPal payer ID
 */
export const captureDonationOrder = (orderData) => {
  return DonationClient.post('/capture-order', orderData)
}

/**
 * Create a recurring donation subscription
 * @param {Object} subscriptionData - The subscription data
 * @param {string} subscriptionData.projectId - Project ID
 * @param {number} subscriptionData.amount - Subscription amount
 * @param {string} subscriptionData.interval - 'weekly', 'monthly', or 'yearly'
 * @param {string} subscriptionData.currency - Currency code (default: USD)
 * @param {string} subscriptionData.message - Optional message
 */
export const createRecurringSubscription = (subscriptionData) => {
  return DonationClient.post('/create-subscription', subscriptionData)
}

/**
 * Activate a subscription after the user returns from PayPal approval.
 * Creates the initial donation, updates project totals, and sends receipt email.
 * @param {string} subscriptionId - PayPal subscription ID
 */
export const activateSubscription = (subscriptionId) => {
  return DonationClient.post('/subscription/activate', { subscriptionId })
}

/**
 * Get recurring donation details by app _id (for manage page)
 * @param {string} recurringDonationId - Recurring donation _id
 */
export const getRecurringDonationDetails = (recurringDonationId) => {
  return DonationClient.get(`/recurring/${recurringDonationId}`)
}

/**
 * Get subscription details (by PayPal subscription ID)
 * @param {string} subscriptionId - PayPal subscription ID
 */
export const getSubscriptionDetails = (subscriptionId) => {
  return DonationClient.get(`/subscription/${subscriptionId}`)
}

/**
 * Switch which project receives this PayPal subscription (same billing agreement).
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {Object} body - { projectId }
 */
export const updateSubscription = (subscriptionId, body) => {
  return DonationClient.patch(`/subscription/${subscriptionId}`, body)
}

/**
 * Pause recurring charges (PayPal suspend)
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {string} [reason] - Optional reason
 */
export const suspendRecurringSubscription = (subscriptionId, reason) => {
  return DonationClient.post(`/subscription/${subscriptionId}/suspend`, reason ? { reason } : {})
}

/**
 * Resume a paused subscription (PayPal activate)
 * @param {string} subscriptionId - PayPal subscription ID
 */
export const resumeRecurringSubscription = (subscriptionId) => {
  return DonationClient.post(`/subscription/${subscriptionId}/resume`, {})
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {string} reason - Cancellation reason (optional)
 */
export const cancelSubscription = (subscriptionId, reason) => {
  return DonationClient.post(`/subscription/${subscriptionId}/cancel`, { reason })
}

/**
 * Get current user's donations
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Limit number of results (default: 20)
 * @param {number} params.skip - Skip number of results (default: 0)
 * @param {string} params.projectId - Filter by project ID (optional)
 */
export const getUserDonations = (params = {}) => {
  const queryParams = new URLSearchParams()
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key])
    }
  })
  const queryString = queryParams.toString()
  return DonationClient.get(`/me${queryString ? `?${queryString}` : ''}`)
}

/**
 * Get current user's recurring donations
 */
export const getUserRecurringDonations = () => {
  return DonationClient.get('/recurring/me')
}

// Admin analytics
export const getDonationStats = () => DonationClient.get('/stats')

export const getAdminDonationPayments = (params = {}) => {
  const queryParams = new URLSearchParams()
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key])
    }
  })
  const queryString = queryParams.toString()
  return DonationClient.get(`/admin/payments${queryString ? `?${queryString}` : ''}`)
}
