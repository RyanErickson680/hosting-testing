import { Router } from 'express'
import {
  createEquipment,
  getEquipment,
  updateEquipment,
  deleteEquipment,
} from 'controllers/equipment.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const equipmentRouter = Router()

// All equipment endpoints require authentication
equipmentRouter.post('/', authenticate, createEquipment)
equipmentRouter.get('/', authenticate, getEquipment)
equipmentRouter.put('/:id', authenticate, requireRole('admin'), updateEquipment)

// Admin-only delete
equipmentRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  deleteEquipment
)

export default equipmentRouter
