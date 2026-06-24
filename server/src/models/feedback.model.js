import { model, Schema, SchemaTypes } from 'mongoose'

const FeedbackSchema = new Schema(
  {
    recipientUserId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
    senderUserId: {
      type: SchemaTypes.ObjectId,
      ref: 'user',
      required: true,
    },
    category: {
      type: SchemaTypes.String,
      enum: ['thank_you', 'suggestion', 'concern', 'general'],
      required: true,
    },
    message: {
      type: SchemaTypes.String,
      required: true,
    },
    createdAt: {
      type: SchemaTypes.Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
)

const Feedback = model('feedback', FeedbackSchema, 'feedback')

export default Feedback
