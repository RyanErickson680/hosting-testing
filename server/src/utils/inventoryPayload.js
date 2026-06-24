import mongoose from 'mongoose'

/** Fields that may be set on inventory log documents (no Mongo operators). */
const INVENTORY_FIELD_KEYS = [
  'type',
  'cropType',
  'weightKg',
  'distributionLocation',
  'peopleServed',
  'compostMethod',
  'volumeLiters',
  'quantity',
  'date',
  'recordedByUserId',
  'source',
  'notes',
  'isSample',
]

const INVENTORY_TYPES = new Set([
  'harvest',
  'distribution',
  'compost',
  'supplies',
  'seed',
])

/**
 * @returns {Record<string, unknown>} Single-field patch or empty object to skip.
 */
function fieldToPatch(key, val) {
  if (key === 'type') {
    if (typeof val !== 'string' || !INVENTORY_TYPES.has(val)) return {}
    return { type: val }
  }
  if (key === 'cropType') {
    if (typeof val !== 'string') return {}
    return { cropType: val }
  }
  if (key === 'date') {
    const d = val instanceof Date ? val : new Date(val)
    if (Number.isNaN(d.getTime())) return {}
    return { date: d }
  }
  if (key === 'recordedByUserId') {
    if (val === null) return { recordedByUserId: null }
    const idStr = typeof val === 'string' ? val : val?.toString?.()
    if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) return {}
    return { recordedByUserId: new mongoose.Types.ObjectId(idStr) }
  }
  if (key === 'isSample') {
    if (typeof val !== 'boolean') return {}
    return { isSample: val }
  }
  if (['weightKg', 'peopleServed', 'volumeLiters', 'quantity'].includes(key)) {
    if (val === null) return { [key]: null }
    const n = typeof val === 'number' ? val : Number(val)
    if (!Number.isFinite(n)) return {}
    return { [key]: n }
  }
  if (
    ['distributionLocation', 'compostMethod', 'source', 'notes'].includes(key)
  ) {
    if (val === null) return { [key]: null }
    if (typeof val !== 'string') return {}
    return { [key]: val }
  }
  return {}
}

/**
 * Pick only allowed scalar fields from a payload object (strips $-prefixed keys and nested operators).
 * Used when applying approved inventory requests so users cannot inject update operators.
 */
export default function pickInventoryDocumentFields(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }

  return INVENTORY_FIELD_KEYS.reduce((acc, key) => {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) return acc
    const val = payload[key]
    if (val === undefined) return acc
    const patch = fieldToPatch(key, val)
    return Object.keys(patch).length ? { ...acc, ...patch } : acc
  }, {})
}
