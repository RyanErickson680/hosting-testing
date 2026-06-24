/**
 * PayPal Service
 * Handles all PayPal API interactions using @paypal/checkout-server-sdk
 */

import paypal from '@paypal/checkout-server-sdk'

/**
 * PayPal returns 404 or INVALID_RESOURCE_ID when the subscription id is unknown for these API credentials
 * (wrong sandbox/live mode, cancelled subscription, or stale id in the database).
 */
export const PAYPAL_SUBSCRIPTION_NOT_FOUND_MESSAGE =
  'PayPal could not find this subscription. It may have been cancelled in PayPal, or your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET may be from a different PayPal Developer app than the one that created this subscription (subscriptions belong to the merchant for that app). Ensure PAYPAL_MODE matches sandbox vs live.'

export class PayPalSubscriptionNotFoundError extends Error {
  constructor() {
    super(PAYPAL_SUBSCRIPTION_NOT_FOUND_MESSAGE)
    this.name = 'PayPalSubscriptionNotFoundError'
  }
}

/** True when PayPal indicates the subscription id is unknown for these API credentials (GET or mutation). */
export function isPayPalSubscriptionNotFoundError(error) {
  if (!error) return false
  if (error.status === 404) return true
  const m = String(error.message || '')
  return /INVALID_RESOURCE_ID|The specified resource does not exist/i.test(m)
}

function rethrowSubscriptionMutationError(error, actionLabel) {
  if (isPayPalSubscriptionNotFoundError(error)) {
    throw new PayPalSubscriptionNotFoundError()
  }
  throw new Error(`Failed to ${actionLabel}: ${error.message}`)
}

// Configure PayPal environment
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET')
  }

  if (mode === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret)
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

// Create PayPal HTTP client
function client() {
  return new paypal.core.PayPalHttpClient(environment())
}

/**
 * Create a PayPal order for one-time donation
 * @param {number} amount - Donation amount
 * @param {string} currency - Currency code (default: USD)
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID (optional for guest donations)
 * @param {string} email - Email address for autofill in card payment form (optional)
 * @returns {Promise<Object>} Order details with orderId and approval URL
 */
export async function createOrder(amount, currency = 'USD', projectId, userId, email) {
  const request = new paypal.orders.OrdersCreateRequest()
  request.prefer('return=representation')
  
  const orderBody = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description: `Donation to project ${projectId}`,
        custom_id: `donation_${projectId}_${userId || 'guest'}`,
      },
    ],
    application_context: {
      brand_name: 'Mill Creek Urban Farm',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.CLIENT_URL}/donate/success`,
      cancel_url: `${process.env.CLIENT_URL}/donate/cancel`,
    },
  }

  // Add payer email for autofill in card payment form
  if (email) {
    orderBody.payer = {
      email_address: email,
    }
  }
  
  request.requestBody(orderBody)

  try {
    const response = await client().execute(request)
    const order = response.result
    
    return {
      orderId: order.id,
      status: order.status,
      links: order.links,
    }
  } catch (error) {
    console.error('PayPal createOrder error:', error)
    const errorMessage = error.message || 'Failed to create PayPal order'
    throw new Error(errorMessage)
  }
}

/**
 * Capture a PayPal order (complete payment)
 * @param {string} orderId - PayPal order ID
 * @returns {Promise<Object>} Capture details including transaction ID
 */
export async function captureOrder(orderId) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId)
  request.requestBody({})

  try {
    const response = await client().execute(request)
    const result = response.result
    const capture = result.purchase_units[0].payments.captures[0]
    
    // Extract processor response for declined payments
    const processorResponse = capture.processor_response || {}
    const failureReason = processorResponse.response_code 
      ? `Payment declined: ${processorResponse.response_code} - ${processorResponse.avs_code || ''} ${processorResponse.cvv_code || ''}`
      : null
    
    return {
      transactionId: capture.id,
      status: capture.status, // Can be: COMPLETED, DECLINED, PENDING, etc.
      amount: parseFloat(capture.amount.value),
      currency: capture.amount.currency_code,
      payerId: result.payer?.payer_id,
      orderId: result.id,
      processorResponse: processorResponse,
      failureReason: failureReason,
      fullResponse: result,
    }
  } catch (error) {
    console.error('PayPal captureOrder error:', error)
    const errorMessage = error.message || 'Failed to capture PayPal order'
    throw new Error(errorMessage)
  }
}

/**
 * Get OAuth access token for PayPal REST API
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  const baseUrl = mode === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get access token: ${error}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Get access token error:', error)
    throw new Error(`Failed to get PayPal access token: ${error.message}`)
  }
}

/**
 * Make authenticated request to PayPal REST API
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {string} method - HTTP method
 * @param {Object} body - Request body (optional)
 * @param {Record<string, string>} [extraHeaders] - Extra headers (e.g. Prefer for plan details)
 * @returns {Promise<Object>} Response data
 */
async function paypalApiRequest(endpoint, method = 'GET', body = null, extraHeaders = {}) {
  const mode = process.env.PAYPAL_MODE || 'sandbox'
  const baseUrl = mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

  const accessToken = await getAccessToken()
  const url = `${baseUrl}${endpoint}`

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders,
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    const text = await response.text()
    
    if (!response.ok) {
      let errorMessage = `PayPal API error (${response.status})`
      try {
        const errorData = JSON.parse(text)
        errorMessage = errorData.message || errorData.error_description || errorMessage
        if (Array.isArray(errorData.details) && errorData.details.length) {
          const detailMsg = errorData.details
            .map((d) => [d.issue, d.field, d.description].filter(Boolean).join(' '))
            .join('; ')
          if (detailMsg) {
            errorMessage = `${errorMessage} [${detailMsg}]`
          }
        }
      } catch (e) {
        errorMessage = text || errorMessage
      }
      const err = new Error(errorMessage)
      err.status = response.status
      throw err
    }

    return text ? JSON.parse(text) : {}
  } catch (error) {
    console.error(`PayPal API request error (${method} ${endpoint}):`, error)
    throw error
  }
}

/**
 * Create or get PayPal product for donations
 * @returns {Promise<string>} Product ID
 */
async function getOrCreateProduct() {
  // First, try to get existing product
  // In production, you should create this in PayPal dashboard and store the ID
  const productId = process.env.PAYPAL_PRODUCT_ID
  
  if (productId) {
    return productId
  }

  // Create product if it doesn't exist
  try {
    const product = await paypalApiRequest('/v1/catalogs/products', 'POST', {
      name: 'Mill Creek Urban Farm Donations',
      description: 'Recurring donations to Mill Creek Urban Farm projects',
      type: 'SERVICE',
      category: 'CHARITY',
    })

    console.log('Created PayPal product:', product.id)
    console.warn('⚠️  Add PAYPAL_PRODUCT_ID to .env:', product.id)
    return product.id
  } catch (error) {
    // If product already exists or other error, try to list products
    console.error('Error creating product, using default:', error.message)
    throw new Error('PayPal product not configured. Set PAYPAL_PRODUCT_ID in .env or create product in PayPal dashboard.')
  }
}

/**
 * Billing plan vs subscription (PayPal Subscriptions API):
 * - Plan: reusable template (product, price, billing cycle). Created once per signup in this app (`createSubscriptionPlan`).
 * - Subscription: buyer’s agreement to a plan; has its own ID and is what gets charged/cancelled (`createSubscription`, `cancelSubscription`).
 * Plans are deactivated (not hard-deleted) after the subscription ends — see `deactivateBillingPlan`.
 */

/**
 * Create a PayPal subscription plan
 * Uses PayPal REST API directly since @paypal/checkout-server-sdk doesn't support subscriptions
 * @param {number} amount - Subscription amount
 * @param {string} interval - 'weekly', 'monthly', or 'yearly'
 * @param {string} currency - Currency code (default: USD)
 * @returns {Promise<Object>} Plan details with planId
 */
export async function createSubscriptionPlan(amount, interval, currency = 'USD') {
  // Map interval to PayPal frequency
  const frequencyMap = {
    weekly: { interval_unit: 'WEEK', interval_count: 1 },
    monthly: { interval_unit: 'MONTH', interval_count: 1 },
    yearly: { interval_unit: 'YEAR', interval_count: 1 },
  }
  
  const frequency = frequencyMap[interval] || frequencyMap.monthly

  // Get or create product
  const productId = await getOrCreateProduct()

  const planData = {
    product_id: productId,
    name: `Recurring Donation - ${interval}`,
    description: `Recurring ${interval} donation to Mill Creek Urban Farm`,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency,
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // 0 = infinite
        pricing_scheme: {
          fixed_price: {
            value: amount.toFixed(2),
            currency_code: currency,
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: currency,
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  }

  try {
    const plan = await paypalApiRequest('/v1/billing/plans', 'POST', planData)
    return {
      planId: plan.id,
      status: plan.status,
    }
  } catch (error) {
    console.error('PayPal createSubscriptionPlan error:', error)
    throw new Error(`Failed to create subscription plan: ${error.message}`)
  }
}

/**
 * Create a PayPal subscription
 * Uses PayPal REST API directly since @paypal/checkout-server-sdk doesn't support subscriptions
 * @param {string} planId - PayPal plan ID
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Subscription details with subscriptionId and approval URL
 */
export async function createSubscription(planId, projectId, userId) {
  const subscriptionData = {
    plan_id: planId,
    application_context: {
      brand_name: 'Mill Creek Urban Farm',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: `${process.env.CLIENT_URL}/donate/subscription/success?projectId=${projectId}`,
      cancel_url: `${process.env.CLIENT_URL}/donate/subscription/cancel`,
    },
    custom_id: `subscription_${projectId}_${userId}`,
  }

  try {
    const subscription = await paypalApiRequest('/v1/billing/subscriptions', 'POST', subscriptionData)
    
    // Find approval URL
    const approvalLink = subscription.links?.find(link => link.rel === 'approve')
    
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      links: subscription.links || [],
      approvalUrl: approvalLink?.href,
    }
  } catch (error) {
    console.error('PayPal createSubscription error:', error)
    throw new Error(`Failed to create subscription: ${error.message}`)
  }
}

/**
 * Get subscription details from PayPal
 * Uses PayPal REST API directly since @paypal/checkout-server-sdk doesn't support subscriptions
 * @param {string} subscriptionId - PayPal subscription ID
 * @returns {Promise<Object>} Subscription details
 */
export async function getSubscriptionDetails(subscriptionId) {
  try {
    const subscription = await paypalApiRequest(`/v1/billing/subscriptions/${subscriptionId}`, 'GET')
    return subscription
  } catch (error) {
    console.error('PayPal getSubscriptionDetails error:', error)
    const wrapped = new Error(`Failed to get subscription details: ${error.message}`)
    wrapped.status = error.status
    throw wrapped
  }
}

/**
 * Get billing plan by ID (used to read cycle amount when subscription has no last_payment yet).
 */
export async function getBillingPlan(planId) {
  try {
    return await paypalApiRequest(`/v1/billing/plans/${planId}`, 'GET', null, {
      Prefer: 'return=representation',
    })
  } catch (error) {
    console.error('PayPal getBillingPlan error:', error)
    throw new Error(`Failed to get billing plan: ${error.message}`)
  }
}

/** PayPal list subscription transactions rejects ranges longer than ~31 days with HTTP 400. */
const PAYPAL_SUBSCRIPTION_TXN_MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000

/**
 * ISO 8601 timestamps for subscriptions.transactions (strip milliseconds; Zulu).
 * PayPal's parameter validator is strict; second-precision matches their OpenAPI pattern.
 */
export function formatPayPalSubscriptionTransactionTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date for PayPal subscription transaction time')
  }
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

async function listSubscriptionTransactionsOnce(subscriptionId, startTimeStr, endTimeStr) {
  const qs = new URLSearchParams({
    start_time: startTimeStr,
    end_time: endTimeStr,
  })
  return paypalApiRequest(
    `/v1/billing/subscriptions/${subscriptionId}/transactions?${qs.toString()}`,
    'GET',
  )
}

/**
 * List transactions for a subscription (billing cycles). Long ranges are split into
 * ~31-day chunks and merged (PayPal rejects wider windows).
 * @see https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_transactions
 */
export async function listSubscriptionTransactions(subscriptionId, startTimeIso, endTimeIso) {
  const start = new Date(startTimeIso)
  const end = new Date(endTimeIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid start_time or end_time for subscription transactions')
  }
  if (start.getTime() >= end.getTime()) {
    throw new Error('start_time must be before end_time')
  }

  const rangeMs = end.getTime() - start.getTime()
  try {
    if (rangeMs <= PAYPAL_SUBSCRIPTION_TXN_MAX_RANGE_MS) {
      return await listSubscriptionTransactionsOnce(
        subscriptionId,
        formatPayPalSubscriptionTransactionTime(start),
        formatPayPalSubscriptionTransactionTime(end),
      )
    }

    const byId = new Map()
    let cursor = start.getTime()
    const endMs = end.getTime()
    while (cursor < endMs) {
      const chunkEnd = Math.min(endMs, cursor + PAYPAL_SUBSCRIPTION_TXN_MAX_RANGE_MS)
      const data = await listSubscriptionTransactionsOnce(
        subscriptionId,
        formatPayPalSubscriptionTransactionTime(new Date(cursor)),
        formatPayPalSubscriptionTransactionTime(new Date(chunkEnd)),
      )
      for (const t of data.transactions || []) {
        const id = t.id || t.transaction_id
        if (id && !byId.has(id)) byId.set(id, t)
      }
      cursor = chunkEnd + 1
    }
    return { transactions: [...byId.values()] }
  } catch (error) {
    console.error('PayPal listSubscriptionTransactions error:', error)
    throw new Error(`Failed to list subscription transactions: ${error.message}`)
  }
}

/**
 * Suspend a PayPal subscription (pause billing)
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {string} reason - Reason shown to PayPal
 */
export async function suspendSubscription(subscriptionId, reason = 'Customer requested pause') {
  try {
    await paypalApiRequest(`/v1/billing/subscriptions/${subscriptionId}/suspend`, 'POST', {
      reason,
    })
    return { success: true }
  } catch (error) {
    console.error('PayPal suspendSubscription error:', error)
    rethrowSubscriptionMutationError(error, 'suspend subscription')
  }
}

/**
 * Resume a suspended PayPal subscription (reactivate billing)
 * @param {string} subscriptionId - PayPal subscription ID
 */
export async function resumeSubscription(subscriptionId) {
  try {
    await paypalApiRequest(`/v1/billing/subscriptions/${subscriptionId}/activate`, 'POST', {})
    return { success: true }
  } catch (error) {
    console.error('PayPal resumeSubscription error:', error)
    rethrowSubscriptionMutationError(error, 'resume subscription')
  }
}

/**
 * Cancel a PayPal subscription
 * Uses PayPal REST API directly since @paypal/checkout-server-sdk doesn't support subscriptions
 * @param {string} subscriptionId - PayPal subscription ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Success status
 */
export async function cancelSubscription(subscriptionId, reason = 'User requested cancellation') {
  try {
    await paypalApiRequest(`/v1/billing/subscriptions/${subscriptionId}/cancel`, 'POST', {
      reason,
    })
    return { success: true }
  } catch (error) {
    console.error('PayPal cancelSubscription error:', error)
    rethrowSubscriptionMutationError(error, 'cancel subscription')
  }
}

/**
 * Deactivate a billing plan (POST /v1/billing/plans/{id}/deactivate).
 * Run after the subscription using this plan is cancelled so the plan template is retired.
 * PayPal does not remove plan records; INACTIVE/deactivate is the supported cleanup.
 * @param {string} planId - PayPal plan ID (e.g. P-...)
 * @returns {Promise<{ success: boolean, skipped?: boolean }>}
 */
export async function deactivateBillingPlan(planId) {
  if (!planId || typeof planId !== 'string') {
    return { success: false, skipped: true }
  }
  try {
    await paypalApiRequest(`/v1/billing/plans/${encodeURIComponent(planId)}/deactivate`, 'POST', {})
    return { success: true }
  } catch (error) {
    const status = error.status
    const msg = String(error.message || '')
    if (status === 404 || /not found|RESOURCE_NOT_FOUND|INVALID_RESOURCE_ID/i.test(msg)) {
      console.warn(`PayPal deactivateBillingPlan: plan ${planId} not found or already inactive (${msg})`)
      return { success: false, skipped: true }
    }
    console.error('PayPal deactivateBillingPlan error:', error)
    throw error
  }
}

/**
 * Verify webhook signature
 * Uses PayPal REST API directly since @paypal/checkout-server-sdk doesn't support webhook verification
 * @param {Object} headers - Request headers
 * @param {Object} body - Request body
 * @param {string} webhookId - PayPal webhook ID
 * @returns {Promise<boolean>} True if signature is valid
 */
export async function verifyWebhookSignature(headers, body, webhookId) {
  const verificationData = {
    auth_algo: headers['paypal-auth-algo'] || headers['PayPal-Auth-Algo'],
    cert_url: headers['paypal-cert-url'] || headers['PayPal-Cert-Url'],
    transmission_id: headers['paypal-transmission-id'] || headers['PayPal-Transmission-Id'],
    transmission_sig: headers['paypal-transmission-sig'] || headers['PayPal-Transmission-Sig'],
    transmission_time: headers['paypal-transmission-time'] || headers['PayPal-Transmission-Time'],
    webhook_id: webhookId,
    webhook_event: body,
  }

  // Let network/transport errors throw — caller returns 500 so PayPal retries.
  // Only return false when PayPal explicitly says the signature is invalid.
  const result = await paypalApiRequest('/v1/notifications/verify-webhook-signature', 'POST', verificationData)
  return result.verification_status === 'SUCCESS'
}
