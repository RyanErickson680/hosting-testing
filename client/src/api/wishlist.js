import api from './api.js'

export function getWishlist() {
  return api.get('/api/wishlist')
}

export function createWishlistItem({ name, priority, price }) {
  return api.post('/api/wishlist', { name, priority, price: price != null && price !== '' ? Number(price) : null })
}

export function updateWishlistItem({ id, ...data }) {
  return api.patch(`/api/wishlist/${id}`, data)
}

export function deleteWishlistItem({ id }) {
  return api.delete(`/api/wishlist/${id}`)
}
