export const MAX_LIMIT = 200

/**
 * Clamp a client-provided limit to a server-side maximum.
 * @param {string|number} value - The raw limit from req.query
 * @param {number} defaultLimit - Fallback when value is missing/invalid
 * @returns {number}
 */
export const clampLimit = (value, defaultLimit = 100) => {
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 1) return defaultLimit
  return Math.min(parsed, MAX_LIMIT)
}
