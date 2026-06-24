/**
 * Retries an async function with exponential backoff.
 * @param {() => Promise<any>} fn - Async function to retry
 * @param {number} attempts - Maximum number of attempts (default: 3)
 * @param {number} delayMs - Base delay in ms; doubles each retry (default: 2000)
 * @returns {Promise<any>}
 */
export async function withRetry(fn, attempts = 3, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === attempts - 1) throw err
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
    }
  }
}
