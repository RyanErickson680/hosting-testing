import { Schema, model } from 'mongoose'

const HomeContentSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      index: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  { timestamps: true }
)

export default model('home_content', HomeContentSchema)
