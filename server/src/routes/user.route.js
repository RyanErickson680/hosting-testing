import { Router } from 'express'
import {
  createUser,
  deleteUser,
  deleteOwnAccount,
  getDonors,
  getUser,
  getUserByEmail,
  getUserStats,
  getUserImpactStats,
  getUsers,
  getUsersByRole,
  getVolunteers,
  resendVolunteerWaiver,
  updateUser,
  updateNewsletterSubscription,
  changePassword,
  updateOwnProfile,
} from 'controllers/user.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const userRouter = Router()

// Self-service endpoints (must come before /:id routes)
userRouter.patch('/me/newsletter', authenticate, updateNewsletterSubscription)
userRouter.patch('/me/password', authenticate, changePassword)
userRouter.patch('/me', authenticate, updateOwnProfile)
userRouter.delete('/me', authenticate, deleteOwnAccount)

// Statistics endpoints (must come before /:id routes)
userRouter.get('/stats', authenticate, requireRole('admin'), getUserStats)
userRouter.get('/impact-stats', authenticate, getUserImpactStats)

// Specialized query endpoints (must come before /:id routes)
userRouter.get('/volunteers', authenticate, requireRole('admin'), getVolunteers)
userRouter.get('/donors', authenticate, requireRole('admin'), getDonors)
userRouter.get(
  '/role/:role',
  authenticate,
  requireRole('admin'),
  getUsersByRole
)
userRouter.get(
  '/email/:email',
  authenticate,
  requireRole('admin'),
  getUserByEmail
)

userRouter.post(
  '/:id/resend-waiver',
  authenticate,
  requireRole('admin'),
  resendVolunteerWaiver
)

// Standard CRUD endpoints
userRouter.get('/', authenticate, requireRole('admin'), getUsers)
userRouter.get('/:id', authenticate, getUser)
userRouter.post('/', authenticate, requireRole('admin'), createUser)
userRouter.patch(
  '/email/:email',
  authenticate,
  requireRole('admin'),
  updateUser
)
userRouter.delete('/:id', authenticate, requireRole('admin'), deleteUser)

export default userRouter
