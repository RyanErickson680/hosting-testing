import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  getCurrentUser,
  logout,
  getAccountWaiverDetails,
  approveAccountWaiver,
  requestAccountWaiverEmail,
  forgotPassword,
  resetPassword,
  verifyResetTokenEndpoint,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter limiter for waiver endpoints to prevent token brute-force
const waiverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Public routes
authRouter.post('/register', authLimiter, register)
authRouter.post('/login', authLimiter, login)

// Public waiver routes (token-authenticated)
authRouter.get('/waiver/:token', waiverLimiter, getAccountWaiverDetails)
authRouter.post('/waiver/:token/approve', waiverLimiter, approveAccountWaiver)

authRouter.post('/forgot-password', authLimiter, forgotPassword)
authRouter.post('/reset-password', authLimiter, resetPassword)
authRouter.get('/verify-reset-token/:token', authLimiter, verifyResetTokenEndpoint)
// Protected routes
authRouter.get('/me', authenticate, getCurrentUser)
authRouter.post('/logout', authenticate, logout)
authRouter.post('/request-waiver-email', authenticate, requestAccountWaiverEmail)

export default authRouter
