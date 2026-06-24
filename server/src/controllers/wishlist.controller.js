import WishlistItem from 'models/wishlist.model'

/**
 * GET /api/wishlist
 * Public — anyone can view the farm wishlist.
 */
export const getWishlist = async (req, res) => {
  try {
    const items = await WishlistItem.find().sort({ createdAt: 1 }).lean()
    return res.json({ items })
  } catch (error) {
    console.error('getWishlist error', error)
    return res.status(500).json({ error: 'Failed to fetch wishlist' })
  }
}

/**
 * POST /api/wishlist
 * Admin only — add a new item to the wishlist.
 */
export const createWishlistItem = async (req, res) => {
  try {
    const { name, priority = 'medium', price } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' })
    }

    const item = await WishlistItem.create({
      name: name.trim(),
      priority,
      price: price != null && price !== '' ? Number(price) : null,
    })
    return res.status(201).json({ item })
  } catch (error) {
    console.error('createWishlistItem error', error)
    return res.status(500).json({ error: 'Failed to create wishlist item' })
  }
}

/**
 * PATCH /api/wishlist/:id
 * Admin only — update an item (name, priority, or acquired status).
 */
export const updateWishlistItem = async (req, res) => {
  try {
    const { id } = req.params
    const { name, priority, acquired, price } = req.body

    const update = {}
    if (name !== undefined) update.name = name.trim()
    if (priority !== undefined) update.priority = priority
    if (acquired !== undefined) update.acquired = acquired
    if (price !== undefined) update.price = price != null && price !== '' ? Number(price) : null

    const item = await WishlistItem.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean()

    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' })
    }

    return res.json({ item })
  } catch (error) {
    console.error('updateWishlistItem error', error)
    return res.status(500).json({ error: 'Failed to update wishlist item' })
  }
}

/**
 * DELETE /api/wishlist/:id
 * Admin only — remove an item from the wishlist.
 */
export const deleteWishlistItem = async (req, res) => {
  try {
    const { id } = req.params
    const item = await WishlistItem.findByIdAndDelete(id).lean()

    if (!item) {
      return res.status(404).json({ error: 'Wishlist item not found' })
    }

    return res.json({ message: 'Item removed from wishlist' })
  } catch (error) {
    console.error('deleteWishlistItem error', error)
    return res.status(500).json({ error: 'Failed to delete wishlist item' })
  }
}
