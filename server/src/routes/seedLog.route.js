import { Router } from 'express'
import {
  createSeedLog,
  getSeedLogs,
  getSeedLogById,
  deleteSeedLog,
} from 'controllers/seedLog.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const seedRouter = Router()

// View seed logs: all authenticated users
seedRouter.get('/', authenticate, getSeedLogs)
seedRouter.get('/:id', authenticate, getSeedLogById)

// Admin-only create/delete
seedRouter.post('/', authenticate, requireRole('admin'), createSeedLog)
seedRouter.delete('/:id', authenticate, requireRole('admin'), deleteSeedLog)

export default seedRouter
