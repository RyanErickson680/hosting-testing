import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, isAdmin } from 'middleware/auth.middleware'
import {
  getHomeContent,
  upsertHomeContent,
} from 'controllers/homeContent.controller'

const router = Router()

const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.get('/', publicApiLimiter, getHomeContent)
router.put('/', authenticate, isAdmin, upsertHomeContent)

export default router
