import Inventory from 'models/inventory.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { findUserById } from 'services/auth.service'
import { clampLimit } from 'utils/pagination'
import { safeRegexSubstring } from 'utils/regex'

/**
 * POST /api/inventory
 * Create a new inventory log (harvest or distribution)
 */
export const createInventoryLog = async (req, res) => {
  try {
    const {
      type,
      cropType,
      date,
      weightKg,
      distributionLocation,
      peopleServed,
      compostMethod,
      volumeLiters,
      quantity,
      notes,
    } = req.body

    // Basic validation
    if (!type || !['harvest', 'distribution', 'compost', 'supplies'].includes(type)) {
      return res
        .status(400)
        .json({ error: 'type is required and must be harvest|distribution|compost|supplies' })
    }

    if (!cropType) {
      return res.status(400).json({ error: 'cropType is required' })
    }

    if (!date) {
      return res.status(400).json({ error: 'date is required' })
    }

    const log = {
      type,
      cropType,
      date: new Date(date),
      weightKg: weightKg ?? null,
      distributionLocation: distributionLocation ?? null,
      peopleServed: peopleServed ?? null,
      compostMethod: compostMethod ?? null,
      volumeLiters: volumeLiters ?? null,
      quantity: quantity ?? null,
      recordedByUserId: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
      notes: notes ?? null,
    }

    const [err, created] = await to(Inventory.create(log))
    if (err) {
      console.error('createInventoryLog error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.status(201).json({ inventory: created })
  } catch (error) {
    console.error('createInventoryLog exception', error)
    return res.status(500).json({ error: 'Failed to create inventory log' })
  }
}

/**
 * GET /api/inventory
 * Query params: type, cropType, distributionLocation, startDate, endDate, limit, skip
 * Note: distribution logs are only visible to admin. Non-admins will automatically have distribution logs excluded.
 */
export const getInventoryLogs = async (req, res) => {
  try {
    const {
      type,
      excludeType,
      cropType,
      distributionLocation,
      startDate,
      endDate,
      limit,
      skip = 0,
    } = req.query

    const clampedLimit = clampLimit(limit, 100)

    // Build filter
    const filter = {}
    if (type) filter.type = type
    if (excludeType && !type) filter.type = { $ne: excludeType }
    if (cropType) filter.cropType = { $regex: safeRegexSubstring(cropType), $options: 'i' }
    if (distributionLocation) filter.distributionLocation = distributionLocation
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    // All authenticated users (employees and admins) can view all logs.
    // Creating/editing/deleting is restricted to admins; employees must submit requests.

    const [err, items] = await to(
      Inventory.find(filter)
        .limit(clampedLimit)
        .skip(parseInt(skip, 10))
        .sort({ date: -1 })
        .lean()
    )

    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    const [countErr, total] = await to(Inventory.countDocuments(filter))
    if (countErr) {
      return res.status(500).json({ error: countErr.message })
    }

    return res.json({
      inventory: items,
      total,
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
    })
  } catch (error) {
    console.error('getInventoryLogs exception', error)
    return res.status(500).json({ error: 'Failed to fetch inventory logs' })
  }
}

/**
 * GET /api/inventory/:id
 */
export const getInventoryLogById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid inventory id' })
    }

    const [err, item] = await to(Inventory.findById(id).lean())
    if (err) return res.status(500).json({ error: 'Internal server error' })
    if (!item) return res.status(404).json({ error: 'Inventory log not found' })

    // All authenticated users can view all logs (employees and admins).

    return res.json({ inventory: item })
  } catch (error) {
    console.error('getInventoryLogById exception', error)
    return res.status(500).json({ error: 'Failed to fetch inventory log' })
  }
}

/**
 * DELETE /api/inventory/:id
 * Admin only
 */
export const deleteInventoryLog = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid inventory id' })
    }

    const [err, deleted] = await to(Inventory.findByIdAndDelete(id).lean())
    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Inventory log not found' })
    }

    return res.json({
      inventory: deleted,
      message: 'Deleted',
    })
  } catch (error) {
    console.error('deleteInventoryLog exception', error)
    return res
      .status(500)
      .json({ error: 'Failed to delete inventory log' })
  }
}
