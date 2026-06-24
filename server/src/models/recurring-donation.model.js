import { model, Schema, SchemaTypes } from 'mongoose'

const RecurringDonationSchema = new Schema(
  {
    userId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: 'user',
      index: true,
    },
    projectId: {
      type: SchemaTypes.ObjectId,
      required: true,
      ref: 'project',
      index: true,
    },
    interval: {
      type: SchemaTypes.String,
      required: true,
      enum: ['weekly', 'monthly', 'yearly'],
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
    status: {
      type: SchemaTypes.String,
      required: true,
      enum: ['active', 'paused', 'cancelled', 'transferred'],
      default: 'active',
    },
    provider: {
      type: SchemaTypes.String,
      default: 'paypal',
    },
    providerSubscriptionId: {
      type: SchemaTypes.String,
    },
    // PayPal-specific fields
    paypalPlanId: {
      type: SchemaTypes.String,
    },
    paypalSubscriptionId: {
      type: SchemaTypes.String,
      index: true,
    },
    paymentStatus: {
      type: SchemaTypes.String,
      enum: ['active', 'suspended', 'cancelled', 'expired'],
      default: 'active',
    },
    startDate: {
      type: SchemaTypes.Date,
      required: true,
      default: Date.now,
    },
    lastChargeDate: {
      type: SchemaTypes.Date,
    },
    nextChargeDate: {
      type: SchemaTypes.Date,
    },
    failureCount: {
      type: SchemaTypes.Number,
      default: 0,
    },
    lastFailureDate: {
      type: SchemaTypes.Date,
    },
    autoRetry: {
      type: SchemaTypes.Boolean,
      default: true,
    },
    cancellationReason: {
      type: SchemaTypes.String,
    },
    initialMessage: {
      type: SchemaTypes.String,
      default: null,
    },
    // When status is 'transferred', points to the new recurring donation (same PayPal subscription, different project)
    transferredToRecurringDonationId: {
      type: SchemaTypes.ObjectId,
      ref: 'recurring_donation',
      default: null,
    },
  },
  {
    timestamps: false,
  }
)

// Indexes match database setup
RecurringDonationSchema.index({ userId: 1, status: 1 })
RecurringDonationSchema.index({ projectId: 1, status: 1 })
RecurringDonationSchema.index({ paypalSubscriptionId: 1 })

const RecurringDonation = model('recurring_donation', RecurringDonationSchema, 'recurring_donations')

export default RecurringDonation
