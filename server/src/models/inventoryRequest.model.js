import { model, Schema, SchemaTypes } from 'mongoose'

const InventoryRequestSchema = new Schema(
  {
    requestedByUserId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    action: {
      type: SchemaTypes.String,
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    payload: {
      type: SchemaTypes.Mixed,
      required: true,
    },
    status: {
      type: SchemaTypes.String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedByUserId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      default: null,
    },
    reviewedAt: {
      type: SchemaTypes.Date,
      default: null,
    },
    reviewNotes: {
      type: SchemaTypes.String,
      default: null,
    },
    createdAt: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: false }
)

InventoryRequestSchema.index({ status: 1, createdAt: -1 })

const InventoryRequest = model(
  'inventory_request',
  InventoryRequestSchema,
  'inventory_requests'
)

export default InventoryRequest
