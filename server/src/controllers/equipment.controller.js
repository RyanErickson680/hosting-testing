import Equipment from 'models/equipment.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { clampLimit } from 'utils/pagination'
import { safeRegexSubstring } from 'utils/regex'

/**
 * POST /api/equipment
 * Create a new equipment item
 */
export const createEquipment = async (req, res) => {
  try {
    const { name, category, quantity, condition, location, notes } = req.body

    if (!name) {
      return res.status(400).json({ error: 'name is required' })
    }

    if (!category || !['tools', 'equipment', 'supplies', 'other'].includes(category)) {
      return res
        .status(400)
        .json({ error: 'category is required and must be tools|equipment|supplies|other' })
    }

    const item = {
      name,
      category,
      quantity: quantity ?? 1,
      condition: condition ?? 'good',
      location: location ?? null,
      notes: notes ?? null,
      addedByUserId: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
    }

    const [err, created] = await to(Equipment.create(item))
    if (err) {
      console.error('createEquipment error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.status(201).json({ equipment: created })
  } catch (error) {
    console.error('createEquipment exception', error)
    return res.status(500).json({ error: 'Failed to create equipment item' })
  }
}

/**
 * GET /api/equipment
 * Query params: category, condition, search, limit, skip
 */
export const getEquipment = async (req, res) => {
  try {
    const { category, condition, search, limit, skip = 0 } = req.query

    const clampedLimit = clampLimit(limit, 100)
    const filter = {}
    if (category) filter.category = category
    if (condition) filter.condition = condition
    if (search) {
      filter.name = { $regex: safeRegexSubstring(search), $options: 'i' }
    }

    const [err, items] = await to(
      Equipment.find(filter)
        .limit(clampedLimit)
        .skip(parseInt(skip, 10))
        .sort({ createdAt: -1 })
        .lean()
    )

    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    const [countErr, total] = await to(Equipment.countDocuments(filter))
    if (countErr) {
      return res.status(500).json({ error: countErr.message })
    }

    return res.json({
      equipment: items,
      total,
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
    })
  } catch (error) {
    console.error('getEquipment exception', error)
    return res.status(500).json({ error: 'Failed to fetch equipment' })
  }
}

/**
 * PUT /api/equipment/:id
 * Update an equipment item
 */
export const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid equipment id' })
    }

    const { name, category, quantity, condition, location, notes } = req.body

    const updates = {}
    if (name !== undefined) updates.name = name
    if (category !== undefined) updates.category = category
    if (quantity !== undefined) updates.quantity = quantity
    if (condition !== undefined) updates.condition = condition
    if (location !== undefined) updates.location = location
    if (notes !== undefined) updates.notes = notes

    const [err, updated] = await to(
      Equipment.findByIdAndUpdate(id, updates, { new: true }).lean()
    )

    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (!updated) {
      return res.status(404).json({ error: 'Equipment item not found' })
    }

    return res.json({ equipment: updated })
  } catch (error) {
    console.error('updateEquipment exception', error)
    return res.status(500).json({ error: 'Failed to update equipment item' })
  }
}

/**
 * DELETE /api/equipment/:id
 * Admin only
 */
export const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid equipment id' })
    }

    const [err, deleted] = await to(Equipment.findByIdAndDelete(id).lean())
    if (err) {
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Equipment item not found' })
    }

    return res.json({
      equipment: deleted,
      message: 'Deleted',
    })
  } catch (error) {
    console.error('deleteEquipment exception', error)
    return res.status(500).json({ error: 'Failed to delete equipment item' })
  }
}
