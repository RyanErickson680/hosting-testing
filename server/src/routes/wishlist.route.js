import { Router } from 'express'
import {
  getWishlist,
  createWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
} from 'controllers/wishlist.controller'
import { authenticate } from 'middleware/auth.middleware'
import requireRole from 'middleware/role.middleware'

const wishlistRouter = Router()

// Public — any visitor can see the farm wishlist
wishlistRouter.get('/', getWishlist)

// Admin only — manage wishlist items
wishlistRouter.post('/', authenticate, requireRole('admin'), createWishlistItem)
wishlistRouter.patch('/:id', authenticate, requireRole('admin'), updateWishlistItem)
wishlistRouter.delete('/:id', authenticate, requireRole('admin'), deleteWishlistItem)

export default wishlistRouter
