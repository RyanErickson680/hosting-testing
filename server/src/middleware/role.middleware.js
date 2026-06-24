/**
 * requireRole - middleware factory to require a specific role (or roles).
 * Uses the role from the JWT token (req.userRole) to avoid a DB round-trip.
 * @param {string|string[]} allowedRoles
 */
const requireRole = (allowedRoles) => async (req, res, next) => {
  try {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    return next()
  } catch (error) {
    console.error('requireRole error', error)
    return res.status(500).json({ error: 'Server error' })
  }
}

export default requireRole
