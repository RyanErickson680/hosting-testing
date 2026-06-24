/**
 * Normalize PayPal webhook payment resources for recurring charges.
 * v2 Captures use amount.value / amount.currency_code; legacy Sale objects use amount.total / amount.currency.
 *
 * @param {Object} resource - Webhook `resource` object (capture or sale)
 * @returns {{ id: string, amount: number, currency: string, createTime: Date, orderId: string|null, payerId: string|null }}
 */
export function normalizePayPalChargeResource(resource) {
  if (!resource?.id) {
    throw new Error('Invalid PayPal charge resource: missing id')
  }

  const amountRaw = resource.amount?.value ?? resource.amount?.total
  const amount = parseFloat(amountRaw || 0)
  const currency =
    resource.amount?.currency_code || resource.amount?.currency || 'USD'
  const createTime = new Date(
    resource.create_time || resource.update_time || Date.now()
  )
  const orderId = resource.supplementary_data?.related_ids?.order_id || null
  const payerId =
    resource.payer?.payer_id || resource.payer_info?.payer_id || null

  return {
    id: resource.id,
    amount,
    currency,
    createTime,
    orderId,
    payerId,
  }
}

/** For audit logging when resource may be Capture (value) or Sale (total). */
export function parseWebhookResourceAmount(resource) {
  const raw = resource?.amount?.value ?? resource?.amount?.total
  return raw ? parseFloat(raw) : 0
}

export function parseWebhookResourceCurrency(resource) {
  return resource?.amount?.currency_code || resource?.amount?.currency || 'USD'
}
