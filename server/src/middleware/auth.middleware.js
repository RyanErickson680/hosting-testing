import { verifyToken } from '../services/auth.service.js'
import User from '../models/user.model.js'

/**
 * Middleware to verify JWT token from httpOnly cookie.
 * Also verifies tokenVersion to invalidate tokens issued before a password reset.
 */
export const authenticate = async (req, res, next) => {
  // Step 1: Extract and verify token (synchronous, no DB — real auth failures are 401)
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // Step 2: DB lookup — infrastructure failures return 503 (not 401) so the
  // frontend auth:expired interceptor does not incorrectly clear auth state.
  try {
    const user = await User.findById(decoded.userId).select('tokenVersion role').lean()
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ error: 'Session expired, please log in again' })
    }

    // Attach userId and fresh DB role to request
    req.userId = decoded.userId
    req.userRole = user.role

    next()
  } catch (error) {
    console.error('Authentication middleware DB error:', error.message)
    return res.status(503).json({ error: 'Service temporarily unavailable, please try again' })
  }
}

/**
 * Optional middleware - check if user is authenticated, but don't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token

    if (token) {
      const decoded = verifyToken(token)
      if (decoded) {
        req.userId = decoded.userId
        req.userRole = decoded.role
      }
    }

    next()
  } catch (error) {
    // Continue even if token is invalid
    next()
  }
}

/**
 * Middleware to ensure authenticated user is an admin.
 * Uses the role from the JWT token to avoid a DB round-trip.
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Authentication required' })

    if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin role required' })

    next()
  } catch (error) {
    return res.status(500).json({ error: 'Authorization failed' })
  }
}
