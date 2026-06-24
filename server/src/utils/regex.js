/** Max length for user-supplied search strings (limits ReDoS-style regex cost). */
export const MAX_REGEX_SEARCH_LENGTH = 200

/**
 * Escape special regex characters so user input can be used safely in MongoDB $regex.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Truncate and escape a query string for case-insensitive substring search.
 */
export function safeRegexSubstring(raw) {
  const s = String(raw).slice(0, MAX_REGEX_SEARCH_LENGTH)
  return escapeRegex(s)
}
