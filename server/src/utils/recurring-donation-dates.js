/**
 * Billing interval helpers for recurring donations (weekly / monthly / yearly).
 */

/**
 * @param {Date} date
 * @param {'weekly'|'monthly'|'yearly'} interval
 * @returns {Date}
 */
export function addInterval(date, interval) {
  const d = new Date(date.getTime())
  switch (interval) {
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + 1)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
    default:
      d.setMonth(d.getMonth() + 1)
  }
  return d
}

/**
 * Advance a date by n billing cycles in a single Date operation (O(1)).
 * Monthly/yearly use setMonth/setFullYear which correctly handle end-of-month clamping.
 */
function addIntervalN(date, interval, n) {
  if (n <= 0) return new Date(date.getTime())
  const d = new Date(date.getTime())
  switch (interval) {
    case 'weekly':
      d.setDate(d.getDate() + 7 * n)
      break
    case 'monthly':
      d.setMonth(d.getMonth() + n)
      break
    case 'yearly':
      d.setFullYear(d.getFullYear() + n)
      break
    default:
      d.setMonth(d.getMonth() + n)
  }
  return d
}

// Approximate cycle lengths in ms — used only to estimate the jump count.
const APPROX_INTERVAL_MS = {
  weekly: 7 * 86_400_000,
  monthly: 30 * 86_400_000,
  yearly: 365 * 86_400_000,
}

/**
 * Next display charge: one billing period after the latest known charge (last donation or lastChargeDate).
 * If that date is still in the past, rolls forward by interval until the next cycle is in the future.
 *
 * Uses a mathematical jump to skip most cycles in O(1), then at most 2 correction iterations
 * to handle variable month/year lengths.
 *
 * @param {{ lastDonationDate: Date|null, lastChargeDate: Date|null, interval: string }} params
 * @returns {Date|null}
 */
export function computeDisplayNextChargeDate({
  lastDonationDate,
  lastChargeDate,
  interval,
}) {
  const anchors = [lastDonationDate, lastChargeDate].filter(Boolean)
  if (anchors.length === 0) return null

  const anchor = new Date(Math.max(...anchors.map((a) => a.getTime())))
  const now = new Date()

  // Jump forward by the estimated number of elapsed cycles in one Date operation
  const approxMs = APPROX_INTERVAL_MS[interval] ?? APPROX_INTERVAL_MS.monthly
  const elapsed = now.getTime() - anchor.getTime()
  const jumpCycles = elapsed > 0 ? Math.max(1, Math.floor(elapsed / approxMs)) : 1
  let next = addIntervalN(anchor, interval, jumpCycles)

  // Correction loop: runs at most 2 iterations to account for month/year length variation
  while (next <= now) {
    next = addInterval(next, interval)
  }

  return next
}
