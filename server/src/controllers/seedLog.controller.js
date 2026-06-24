import SeedLog from 'models/seedLog.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { clampLimit } from 'utils/pagination'
import { safeRegexSubstring } from 'utils/regex'

export const createSeedLog = async (req, res) => {
  try {
    const { seedType, datePlanted, quantity, notes } = req.body
    if (!seedType) return res.status(400).json({ error: 'seedType required' })
    if (!datePlanted) return res.status(400).json({ error: 'datePlanted required' })

    const doc = {
      seedType,
      datePlanted: new Date(datePlanted),
      quantity: quantity ?? null,
      plantedByUserId: req.userId ? new mongoose.Types.ObjectId(req.userId) : null,
      notes: notes ?? null,
      createdAt: new Date(),
    }

    const [err, created] = await to(SeedLog.create(doc))
    if (err) return res.status(500).json({ error: 'Internal server error' })
    return res.status(201).json({ seedLog: created })
  } catch (error) {
    console.error('createSeedLog exception', error)
    return res.status(500).json({ error: 'Failed to create seed log' })
  }
}

export const getSeedLogs = async (req, res) => {
  try {
    const { seedType, startDate, endDate, limit, skip = 0 } = req.query
    const clampedLimit = clampLimit(limit, 100)
    const filter = {}
    if (seedType) filter.seedType = { $regex: safeRegexSubstring(seedType), $options: 'i' }
    if (startDate || endDate) {
      filter.datePlanted = {}
      if (startDate) filter.datePlanted.$gte = new Date(startDate)
      if (endDate) filter.datePlanted.$lte = new Date(endDate)
    }

    const [err, items] = await to(
      SeedLog.find(filter)
        .limit(clampedLimit)
        .skip(parseInt(skip, 10))
        .sort({ datePlanted: -1 })
        .lean()
    )
    if (err) return res.status(500).json({ error: 'Internal server error' })
    const [countErr, total] = await to(SeedLog.countDocuments(filter))
    if (countErr) return res.status(500).json({ error: countErr.message })
    return res.json({ seedLogs: items, total, limit: clampedLimit, skip: parseInt(skip, 10) })
  } catch (error) {
    console.error('getSeedLogs exception', error)
    return res.status(500).json({ error: 'Failed to get seed logs' })
  }
}

export const getSeedLogById = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })
    const [err, item] = await to(SeedLog.findById(id).lean())
    if (err) return res.status(500).json({ error: 'Internal server error' })
    if (!item) return res.status(404).json({ error: 'Seed log not found' })
    return res.json({ seedLog: item })
  } catch (error) {
    console.error('getSeedLogById exception', error)
    return res.status(500).json({ error: 'Failed to get seed log' })
  }
}

export const deleteSeedLog = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })
    const [err, deleted] = await to(SeedLog.findByIdAndDelete(id).lean())
    if (err) return res.status(500).json({ error: 'Internal server error' })
    if (!deleted) return res.status(404).json({ error: 'Seed log not found' })
    return res.json({ seedLog: deleted, message: 'Deleted' })
  } catch (error) {
    console.error('deleteSeedLog exception', error)
    return res.status(500).json({ error: 'Failed to delete seed log' })
  }
}
