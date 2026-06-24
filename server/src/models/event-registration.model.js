import mongoose from 'mongoose'

const EventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'volunteering_event',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'user',
      index: true,
    },
    registeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    attended: {
      type: Boolean,
      default: null,
    },
    hoursCredited: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    paymentRequired: {
      type: Boolean,
      default: false,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentProvider: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'completed', 'failed'],
      default: 'not_required',
    },
    paypalOrderId: {
      type: String,
      default: null,
    },
    paypalTransactionId: {
      type: String,
      default: null,
    },
    reminder24hSentAt: {
      type: Date,
      default: null,
    },
    waiverSigned: {
      type: Boolean,
      default: false,
    },
    waiverSignedAt: {
      type: Date,
      default: null,
    },
    waiverToken: {
      type: String,
      default: null,
    },
    waiverTokenExpiresAt: {
      type: Date,
      default: null,
    },
    /** When the participant tapped Sign in at the event (self-service attendance). */
    signedInAt: {
      type: Date,
      default: null,
    },
    /** When the participant tapped Sign out; admin is notified with in/out times. */
    signedOutAt: {
      type: Date,
      default: null,
    },
    /** Optional note submitted at sign-in (e.g. parking, dietary). */
    attendanceNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
    collection: 'event_registrations',
  }
)

// Indexes match database setup
EventRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true })
EventRegistrationSchema.index({ eventId: 1 })
EventRegistrationSchema.index({ userId: 1 })
EventRegistrationSchema.index({ reminder24hSentAt: 1 })
EventRegistrationSchema.index({ waiverToken: 1 }, { sparse: true })

const EventRegistration = mongoose.model(
  'event_registration',
  EventRegistrationSchema,
  'event_registrations'
)

export default EventRegistration
