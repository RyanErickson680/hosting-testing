import { model, Schema, SchemaTypes } from 'mongoose'

const InventorySchema = new Schema(
  {
    type: {
      type: SchemaTypes.String,
      required: true,
      enum: ['harvest', 'distribution', 'compost', 'supplies', 'seed'],
      index: true,
    },
    cropType: {
      type: SchemaTypes.String,
      required: true,
      index: true,
    },
    weightKg: {
      type: SchemaTypes.Number,
    },
    distributionLocation: {
      type: SchemaTypes.String,
      index: true,
    },
    peopleServed: {
      type: SchemaTypes.Number,
    },
    compostMethod: {
      type: SchemaTypes.String,
    },
    volumeLiters: {
      type: SchemaTypes.Number,
    },
    quantity: {
      type: SchemaTypes.Number,
    },
    date: {
      type: SchemaTypes.Date,
      required: true,
      index: true,
    },
    recordedByUserId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      index: true,
    },
    source: {
      type: SchemaTypes.String,
    },
    notes: {
      type: SchemaTypes.String,
    },
    isSample: {
      type: SchemaTypes.Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes to match db-setup (compound indices where useful)
InventorySchema.index({ date: -1 })
InventorySchema.index({ cropType: 1, date: -1 })
InventorySchema.index({ type: 1, date: -1 })
InventorySchema.index({ distributionLocation: 1, date: -1 })

const Inventory = model('inventory_log', InventorySchema, 'inventory_logs')

export default Inventory
