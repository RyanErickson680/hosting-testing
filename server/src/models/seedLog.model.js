import { model, Schema, SchemaTypes } from 'mongoose'

const SeedLogSchema = new Schema(
  {
    seedType: { type: SchemaTypes.String, required: true, index: true },
    datePlanted: { type: SchemaTypes.Date, required: true, index: true },
    quantity: { type: SchemaTypes.Number },
    plantedByUserId: { type: SchemaTypes.ObjectId, ref: 'user', index: true },
    notes: { type: SchemaTypes.String },
    isSample: { type: SchemaTypes.Boolean, default: false },
    createdAt: { type: SchemaTypes.Date, required: true, default: Date.now },
  },
  { timestamps: false }
)

SeedLogSchema.index({ datePlanted: -1 })

const SeedLog = model('seed_log', SeedLogSchema, 'seed_logs')

export default SeedLog
