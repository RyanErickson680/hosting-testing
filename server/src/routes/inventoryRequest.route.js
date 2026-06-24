import { Router } from 'express'
import {
  createInventoryRequest,
  listInventoryRequests,
  approveInventoryRequest,
  rejectInventoryRequest,
} from 'controllers/inventoryRequest.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const requestRouter = Router()

// Employees create requests (to propose creating/updating/deleting logs)
requestRouter.post('/', authenticate, createInventoryRequest)

// List requests (employees see their own, admins see all)
requestRouter.get('/', authenticate, listInventoryRequests)

// Admin-only: approve or reject requests
requestRouter.post(
  '/:id/approve',
  authenticate,
  requireRole('admin'),
  approveInventoryRequest
)
requestRouter.post(
  '/:id/reject',
  authenticate,
  requireRole('admin'),
  rejectInventoryRequest
)

export default requestRouter
