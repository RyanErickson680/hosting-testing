import Produce from 'models/produce.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { clampLimit } from 'utils/pagination'
import { safeRegexSubstring } from 'utils/regex'

/**
 * POST /api/produce
 * Create a new produce log (harvest or distribution)
 */
export const createProduceLog = async (req, res) => {
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
    if (!type || !['harvest', 'distribution', 'compost', 'supplies', 'seed'].includes(type)) {
      return res
        .status(400)
        .json({ error: 'type is required and must be harvest|distribution|compost|supplies|seed' })
    }

    if (!cropType) return res.status(400).json({ error: 'cropType is required' })
    if (!date) return res.status(400).json({ error: 'date is required' })

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

    const [err, created] = await to(Produce.create(log))
    if (err) {
      console.error('createProduceLog error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.status(201).json({ produce: created })
  } catch (error) {
    console.error('createProduceLog exception', error)
    return res.status(500).json({ error: 'Failed to create produce log' })
  }
}

/**
 * GET /api/produce
 * Query params: type, cropType, distributionLocation, startDate, endDate, limit, skip
 */
export const getProduceLogs = async (req, res) => {
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
    const filter = {}
    if (type) {
      const types = type.split(',').map((t) => t.trim()).filter(Boolean)
      filter.type = types.length === 1 ? types[0] : { $in: types }
    } else if (excludeType) {
      const excludes = excludeType.split(',').map((t) => t.trim()).filter(Boolean)
      filter.type = excludes.length === 1 ? { $ne: excludes[0] } : { $nin: excludes }
    }
    if (cropType) filter.cropType = { $regex: safeRegexSubstring(cropType), $options: 'i' }
    if (distributionLocation) filter.distributionLocation = distributionLocation
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    const [err, items] = await to(
      Produce.find(filter)
        .limit(clampedLimit)
        .skip(parseInt(skip, 10))
        .sort({ date: -1 })
        .lean()
    )

    if (err) return res.status(500).json({ error: 'Internal server error' })

    const [countErr, total] = await to(Produce.countDocuments(filter))
    if (countErr) return res.status(500).json({ error: countErr.message })

    return res.json({ produce: items, total, limit: parseInt(limit, 10), skip: parseInt(skip, 10) })
  } catch (error) {
    console.error('getProduceLogs exception', error)
    return res.status(500).json({ error: 'Failed to fetch produce logs' })
  }
}

/**
 * GET /api/produce/:id
 */
export const getProduceLogById = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const [err, item] = await to(Produce.findById(id).lean())
    if (err) return res.status(500).json({ error: 'Internal server error' })
    if (!item) return res.status(404).json({ error: 'Produce log not found' })

    return res.json({ produce: item })
  } catch (error) {
    console.error('getProduceLogById exception', error)
    return res.status(500).json({ error: 'Failed to fetch produce log' })
  }
}

/**
 * DELETE /api/produce/:id
 * Admin only
 */
export const deleteProduceLog = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const [err, deleted] = await to(Produce.findByIdAndDelete(id).lean())
    if (err) return res.status(500).json({ error: 'Internal server error' })
    if (!deleted) return res.status(404).json({ error: 'Produce log not found' })

    return res.json({ produce: deleted, message: 'Deleted' })
  } catch (error) {
    console.error('deleteProduceLog exception', error)
    return res.status(500).json({ error: 'Failed to delete produce log' })
  }
}

/**
 * GET /api/produce/export.csv
 * Admin-only CSV export of produce logs (filtered)
 */
export const exportProduceCsv = async (req, res) => {
  try {
    const { type, cropType, startDate, endDate } = req.query
    const filter = {}
    if (type) filter.type = type
    if (cropType) filter.cropType = { $regex: safeRegexSubstring(cropType), $options: 'i' }
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) filter.date.$lte = new Date(endDate)
    }

    const [err, items] = await to(Produce.find(filter).sort({ date: -1 }).lean())
    if (err) return res.status(500).json({ error: 'Internal server error' })

    // Convert to CSV
    const headers = ['_id', 'type', 'cropType', 'date', 'weightKg', 'distributionLocation', 'peopleServed', 'notes']
    const rows = items.map((it) => [
      it._id,
      it.type,
      it.cropType,
      it.date ? new Date(it.date).toISOString() : '',
      it.weightKg ?? '',
      it.distributionLocation ?? '',
      it.peopleServed ?? '',
      (it.notes || '').replace(/\r?\n/g, ' '),
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="produce_export.csv"')
    return res.send(csv)
  } catch (error) {
    console.error('exportProduceCsv exception', error)
    return res.status(500).json({ error: 'Failed to export CSV' })
  }
}

/**
 * GET /api/produce/net-totals
 * Returns per-crop net available quantity: harvest - distribution - compost.
 * Optional query param: cropType (partial match)
 */
export const getNetTotals = async (req, res) => {
  try {
    const { cropType } = req.query
    const matchStage = { type: { $in: ['harvest', 'distribution', 'compost'] } }
    if (cropType) matchStage.cropType = { $regex: safeRegexSubstring(cropType), $options: 'i' }

    const [err, results] = await to(
      Produce.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$cropType',
            harvested: {
              $sum: { $cond: [{ $eq: ['$type', 'harvest'] }, { $ifNull: ['$weightKg', 0] }, 0] },
            },
            distributed: {
              $sum: { $cond: [{ $eq: ['$type', 'distribution'] }, { $ifNull: ['$weightKg', 0] }, 0] },
            },
            composted: {
              $sum: { $cond: [{ $eq: ['$type', 'compost'] }, { $ifNull: ['$weightKg', 0] }, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            cropType: '$_id',
            harvested: { $round: ['$harvested', 1] },
            distributed: { $round: ['$distributed', 1] },
            composted: { $round: ['$composted', 1] },
            available: {
              $round: [
                { $subtract: ['$harvested', { $add: ['$distributed', '$composted'] }] },
                1,
              ],
            },
          },
        },
        { $sort: { cropType: 1 } },
      ])
    )

    if (err) {
      console.error('getNetTotals error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.json({ totals: results })
  } catch (error) {
    console.error('getNetTotals exception', error)
    return res.status(500).json({ error: 'Failed to compute net totals' })
  }
}
