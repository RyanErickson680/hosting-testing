import InventoryRequest from 'models/inventoryRequest.model'
import Inventory from 'models/inventory.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { findUserById } from 'services/auth.service'
import { clampLimit } from 'utils/pagination'
import pickInventoryDocumentFields from 'utils/inventoryPayload'

/**
 * POST /api/inventory-requests
 * Employees submit requests to create/update/delete inventory logs.
 */
export const createInventoryRequest = async (req, res) => {
  try {
    const { action, payload, notes } = req.body

    if (!action || !['create', 'update', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'action must be create|update|delete' })
    }

    if (!payload) {
      return res.status(400).json({ error: 'payload is required' })
    }

    const requestDoc = {
      requestedByUserId: new mongoose.Types.ObjectId(req.userId),
      action,
      payload,
      reviewNotes: notes ?? null,
      status: 'pending',
      createdAt: new Date(),
    }

    const [err, created] = await to(InventoryRequest.create(requestDoc))
    if (err) {
      console.error('createInventoryRequest error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.status(201).json({ request: created })
  } catch (error) {
    console.error('createInventoryRequest exception', error)
    return res.status(500).json({ error: 'Failed to create request' })
  }
}

/**
 * GET /api/inventory-requests
 * Admins see all requests; employees see only their own.
 */
export const listInventoryRequests = async (req, res) => {
  try {
    const { status, limit, skip = 0 } = req.query

    const clampedLimit = clampLimit(limit, 100)
    const filter = {}
    if (status) filter.status = status

    const user = req.userId ? await findUserById(req.userId) : null
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Employees can only see their own requests
    if (user.role !== 'admin') {
      filter.requestedByUserId = new mongoose.Types.ObjectId(req.userId)
    }

    const [err, items] = await to(
      InventoryRequest.find(filter)
        .populate('requestedByUserId', 'firstName lastName email')
        .limit(clampedLimit)
        .skip(parseInt(skip, 10))
        .sort({ createdAt: -1 })
        .lean()
    )
    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    const [countErr, total] = await to(InventoryRequest.countDocuments(filter))
    if (countErr) {
      return res.status(500).json({ error: countErr.message })
    }

    return res.json({
      requests: items,
      total,
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
    })
  } catch (error) {
    console.error('listInventoryRequests exception', error)
    return res.status(500).json({ error: 'Failed to list requests' })
  }
}

/**
 * POST /api/inventory-requests/:id/approve
 * Admin only: approves a request and applies the change.
 */
export const approveInventoryRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id' })
    }

    const [findErr, request] = await to(InventoryRequest.findById(id))
    if (findErr) {
      return res.status(500).json({ error: findErr.message })
    }
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' })
    }

    // Apply the requested action (only whitelisted fields — never pass raw payload to MongoDB)
    let applyErr
    let result
    if (request.action === 'create') {
      const doc = pickInventoryDocumentFields(request.payload)
      if (!doc.type || !doc.cropType || !doc.date) {
        return res.status(400).json({
          error: 'Invalid create payload: type, cropType, and date are required',
        })
      }
      ;[applyErr, result] = await to(Inventory.create(doc))
    } else if (request.action === 'update') {
      const targetId = request.payload._id
      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ error: 'Invalid target id for update' })
      }
      const updates = pickInventoryDocumentFields(request.payload)
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }
      ;[applyErr, result] = await to(
        Inventory.findByIdAndUpdate(
          targetId,
          { $set: updates },
          {
            returnDocument: 'after',
            runValidators: true,
          }
        ).lean()
      )
    } else if (request.action === 'delete') {
      const targetId = request.payload._id
      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ error: 'Invalid target id for delete' })
      }
      ;[applyErr, result] = await to(
        Inventory.findByIdAndDelete(targetId).lean()
      )
    }

    if (applyErr) {
      return res.status(500).json({ error: applyErr.message })
    }

    // Mark request as approved
    request.status = 'approved'
    request.reviewedByUserId = new mongoose.Types.ObjectId(req.userId)
    request.reviewedAt = new Date()
    request.reviewNotes = notes ?? request.reviewNotes
    await request.save()

    return res.json({ request, result })
  } catch (error) {
    console.error('approveInventoryRequest exception', error)
    return res.status(500).json({ error: 'Failed to approve request' })
  }
}

/**
 * POST /api/inventory-requests/:id/reject
 * Admin only: reject request.
 */
export const rejectInventoryRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid request id' })
    }

    const [findErr, request] = await to(InventoryRequest.findById(id))
    if (findErr) {
      return res.status(500).json({ error: findErr.message })
    }
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' })
    }

    request.status = 'rejected'
    request.reviewedByUserId = new mongoose.Types.ObjectId(req.userId)
    request.reviewedAt = new Date()
    request.reviewNotes = notes ?? request.reviewNotes
    await request.save()

    return res.json({ request })
  } catch (error) {
    console.error('rejectInventoryRequest exception', error)
    return res.status(500).json({ error: 'Failed to reject request' })
  }
}
