import { model, Schema, SchemaTypes } from 'mongoose'

const WishlistItemSchema = new Schema(
  {
    name: {
      type: SchemaTypes.String,
      required: true,
      trim: true,
    },
    priority: {
      type: SchemaTypes.String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    acquired: {
      type: SchemaTypes.Boolean,
      default: false,
    },
    price: {
      type: SchemaTypes.Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'wishlist_items',
  }
)

const WishlistItem = model('wishlist_item', WishlistItemSchema, 'wishlist_items')

export default WishlistItem
