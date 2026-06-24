import { model, Schema, SchemaTypes } from 'mongoose'

const UserSchema = new Schema(
  {
    email: {
      type: SchemaTypes.String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: SchemaTypes.String,
      required: true,
      enum: ['admin', 'staff', 'user'],
      index: true,
    },
    firstName: {
      type: SchemaTypes.String,
      required: true,
    },
    lastName: {
      type: SchemaTypes.String,
      required: true,
    },
    passwordHash: {
      type: SchemaTypes.String,
    },
    contactInfo: {
      phone: SchemaTypes.String,
      preferredContactMethod: SchemaTypes.String,
    },
    volunteerProfile: {
      availability: [
        {
          day: SchemaTypes.String,
          start: SchemaTypes.String,
          end: SchemaTypes.String,
        },
      ],
      skills: [SchemaTypes.String],
      waiverSigned: { type: SchemaTypes.Boolean, default: false },
      waiverSignedAt: { type: SchemaTypes.Date, default: null },
      waiverToken: { type: SchemaTypes.String, default: null },
      waiverTokenExpiresAt: { type: SchemaTypes.Date, default: null },
      approved: {
        type: SchemaTypes.Boolean,
        index: true,
      },
      totalHoursVolunteered: SchemaTypes.Number,
    },
    donorProfile: {
      totalAmountDonated: SchemaTypes.Number,
      recurringDonationCount: SchemaTypes.Number,
    },
    newsletterSubscribed: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    resetToken: {
      type: SchemaTypes.String,
    },
    resetTokenExpiry: {
      type: SchemaTypes.Date,
    },
    tokenVersion: {
      type: SchemaTypes.Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// indexes match database setup
UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ role: 1 })
UserSchema.index({ 'volunteerProfile.approved': 1 })
UserSchema.index({ 'volunteerProfile.waiverToken': 1 }, { sparse: true })

const User = model('user', UserSchema, 'users') // use the 'users' collection

export default User
