import { model, Schema, SchemaTypes } from 'mongoose'

const ProjectSchema = new Schema(
  {
    name: {
      type: SchemaTypes.String,
      required: true,
    },
    description: {
      type: SchemaTypes.String,
      required: true,
    },
    priority: {
      type: SchemaTypes.Number,
      required: true,
    },
    goalAmount: {
      type: SchemaTypes.Number,
      required: true,
    },
    status: {
      type: SchemaTypes.String,
      required: true,
      enum: ['active', 'completed', 'proposed'],
      index: true,
    },
    slug: {
      type: SchemaTypes.String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    currentAmount: {
      type: SchemaTypes.Number,
    },
    timeline: {
      startDate: SchemaTypes.Date,
      targetEndDate: SchemaTypes.Date,
    },
    currentNeeds: [
      {
        item: SchemaTypes.String,
        quantity: SchemaTypes.String,
        priority: SchemaTypes.Number,
      },
    ],
    images: [
      {
        url: { type: SchemaTypes.String, required: true },
        caption: { type: SchemaTypes.String, default: '' },
      },
    ],
    createdAt: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
    },
    updatedAt: {
      type: SchemaTypes.Date,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes match database setup
ProjectSchema.index({ priority: 1, status: 1 })
ProjectSchema.index({ status: 1 })
ProjectSchema.index({ slug: 1 }, { unique: true, sparse: true })

const Project = model('project', ProjectSchema, 'projects') // use the 'projects' collection

export default Project
