import { Router } from 'express'
import {
  createProduceLog,
  getProduceLogs,
  getProduceLogById,
  deleteProduceLog,
  exportProduceCsv,
  getNetTotals,
} from 'controllers/produce.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const produceRouter = Router()

// Admin-only CSV export (must come before /:id to avoid Express matching 'export.csv' as an id)
produceRouter.get('/export.csv', authenticate, requireRole('admin'), exportProduceCsv)

// Net totals aggregation (must come before /:id to avoid Express matching 'net-totals' as an id)
produceRouter.get('/net-totals', authenticate, getNetTotals)

// View logs: all authenticated users
produceRouter.get('/', authenticate, getProduceLogs)
produceRouter.get('/:id', authenticate, getProduceLogById)

// Admin-only create/delete
produceRouter.post('/', authenticate, requireRole('admin'), createProduceLog)
produceRouter.delete('/:id', authenticate, requireRole('admin'), deleteProduceLog)

export default produceRouter
