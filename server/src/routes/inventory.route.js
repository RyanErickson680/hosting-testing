import { Router } from 'express'
import {
  createInventoryLog,
  getInventoryLogs,
  getInventoryLogById,
  deleteInventoryLog,
} from 'controllers/inventory.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const inventoryRouter = Router()

// Viewing logs: all authenticated users (employees and admins)
inventoryRouter.get('/', authenticate, getInventoryLogs)
inventoryRouter.get('/:id', authenticate, getInventoryLogById)

// Creating logs: admin only (employees must use /api/inventory-requests)
inventoryRouter.post('/', authenticate, requireRole('admin'), createInventoryLog)

// Admin-only delete
inventoryRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  deleteInventoryLog
)

export default inventoryRouter
