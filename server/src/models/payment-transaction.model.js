import { model, Schema, SchemaTypes } from 'mongoose'

const PaymentTransactionSchema = new Schema(
  {
    type: {
      type: SchemaTypes.String,
      required: true,
      enum: ['donation', 'recurring_charge', 'refund'],
      index: true,
    },
    donationId: {
      type: SchemaTypes.ObjectId,
      ref: 'donation',
    },
    recurringDonationId: {
      type: SchemaTypes.ObjectId,
      ref: 'recurring_donation',
    },
    userId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      default: null,
      index: true,
    },
    projectId: {
      type: SchemaTypes.ObjectId,
      ref: 'project',
      default: null,
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
    paypalOrderId: {
      type: SchemaTypes.String,
      index: true,
    },
    paypalTransactionId: {
      type: SchemaTypes.String,
      index: true,
    },
    status: {
      type: SchemaTypes.String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      index: true,
    },
    paypalEventType: {
      type: SchemaTypes.String,
    },
    paypalEventId: {
      type: SchemaTypes.String,
      index: true,
      sparse: true, // Allow null values but index non-null ones
    },
    createdAt: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
      index: true,
    },
    processedAt: {
      type: SchemaTypes.Date,
    },
    metadata: {
      type: SchemaTypes.Mixed,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes for efficient queries
PaymentTransactionSchema.index({ paypalOrderId: 1 })
PaymentTransactionSchema.index({ paypalTransactionId: 1 })
PaymentTransactionSchema.index({ paypalEventId: 1 }, { unique: true, sparse: true }) // Unique index for idempotency
PaymentTransactionSchema.index({ userId: 1, createdAt: -1 })
PaymentTransactionSchema.index({ type: 1, status: 1 })

const PaymentTransaction = model('payment_transaction', PaymentTransactionSchema, 'payment_transactions')

export default PaymentTransaction
