import api from './api.js'

/**
 * Volunteer/events API — uses /api/events backend.
 * Prefer using event.js (getEvents, registerForEvent, getUserEventRegistrations) for new code.
 */

/** Get all events (volunteer opportunities, etc.) */
export function getVolunteeringEvents(params = {}) {
  return api.get('/api/events', { params })
}

/** Create a new event (admin only) */
export function createVolunteeringEvent(data) {
  return api.post('/api/events', data)
}

/** Delete an event (admin only) */
export function deleteVolunteeringEvent(id) {
  return api.delete(`/api/events/${id}`)
}

/**
 * Sign up for an event. Backend uses current user from auth.
 * @param {string} _userId - Unused; backend uses authenticated user.
 * @param {string} eventId - Event ID.
 * @param {Object} options - Optional: notes.
 */
export function signUpForEvent(_userId, eventId, options = {}) {
  const { notes = '' } = options
  return api.post(`/api/events/${eventId}/register`, { notes })
}

/**
 * Cancel signup for an event. Backend uses current user from auth.
 * @param {string} _userId - Unused; backend uses authenticated user.
 * @param {string} eventId - Event ID.
 */
export function cancelEventSignup(_userId, eventId) {
  return api.delete(`/api/events/${eventId}/register`)
}

/**
 * Get current user's event registrations (commitments).
 * @param {string} _userId - Unused; backend returns current user's registrations.
 * @param {Object} params - Optional: limit, skip, status ('attended'|'upcoming'|'past').
 */
export function getUserVolunteeringCommitments(_userId, params = {}) {
  return api.get('/api/events/me', { params })
}

/**
 * Update user availability. Backend not yet implemented — stub for compatibility.
 */
export function updateUserAvailability(_userId, _availability) {
  console.warn('updateUserAvailability: not yet implemented')
  return Promise.resolve({ error: 'Feature not yet available' })
}
