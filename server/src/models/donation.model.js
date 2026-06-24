import { model, Schema, SchemaTypes } from 'mongoose'

const DonationSchema = new Schema(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      default: null,
      index: true,
    },
    projectId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: 'project',
      index: true,
    },
    amount: {
      type: SchemaTypes.Number,
      required: true,
    },
    currency: {
      type: SchemaTypes.String,
      required: true,
      default: 'USD',
    },
    donatedAt: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
      index: true,
    },
    message: {
      type: SchemaTypes.String,
      default: null,
    },
    paymentProvider: {
      type: SchemaTypes.String,
    },
    providerTxnId: {
      type: SchemaTypes.String,
    },
    donorEmail: {
      type: SchemaTypes.String,
      default: null,
    },
    receiptEmailSent: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    // PayPal-specific fields
    paymentStatus: {
      type: SchemaTypes.String,
      enum: ['pending', 'in-progress', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paypalOrderId: {
      type: SchemaTypes.String,
      index: true,
    },
    paypalPayerId: {
      type: SchemaTypes.String,
    },
    failureReason: {
      type: SchemaTypes.String,
    },
    refundedAt: {
      type: SchemaTypes.Date,
    },
    refundAmount: {
      type: SchemaTypes.Number,
    },
    recurringDonationId: {
      type: SchemaTypes.ObjectId,
      ref: 'recurring_donation',
      default: null,
      index: true,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes match database setup
DonationSchema.index({ userId: 1, donatedAt: -1 })
DonationSchema.index({ projectId: 1 })
DonationSchema.index({ recurringDonationId: 1, donatedAt: -1 })

const Donation = model('donation', DonationSchema, 'donations') // use the 'donations' collection

export default Donation
