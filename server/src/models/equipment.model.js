import { model, Schema, SchemaTypes } from 'mongoose'

const EquipmentSchema = new Schema(
  {
    name: {
      type: SchemaTypes.String,
      required: true,
      index: true,
    },
    category: {
      type: SchemaTypes.String,
      required: true,
      enum: ['tools', 'equipment', 'supplies', 'other'],
      index: true,
    },
    quantity: {
      type: SchemaTypes.Number,
      required: true,
      default: 1,
    },
    condition: {
      type: SchemaTypes.String,
      enum: ['new', 'good', 'fair', 'poor', 'needs repair'],
      default: 'good',
    },
    location: {
      type: SchemaTypes.String,
    },
    notes: {
      type: SchemaTypes.String,
    },
    addedByUserId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

EquipmentSchema.index({ category: 1, name: 1 })

const Equipment = model('equipment', EquipmentSchema, 'equipment')

export default Equipment
