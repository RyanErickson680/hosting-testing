import { Router } from 'express'
import { createFeedback, getUserFeedback } from 'controllers/feedback.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const feedbackRouter = Router()

// Admin or staff sends feedback to a user
feedbackRouter.post('/', authenticate, requireRole(['admin', 'staff']), createFeedback)

// Authenticated user retrieves their own feedback
feedbackRouter.get('/me', authenticate, getUserFeedback)

export default feedbackRouter
