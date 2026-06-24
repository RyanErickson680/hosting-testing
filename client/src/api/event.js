import api from "./api.js"

export function createEvent(data) {
  return api.post('/api/events', data)
}

export function getEvents(params = {}) {
  return api.get('/api/events', { params })
}

export function getEvent({ id }) {
  return api.get(`/api/events/${id}`)
}

export function updateEvent({ id, ...data }) {
  return api.patch(`/api/events/${id}`, data)
}

export function deleteEvent({ id }) {
  return api.delete(`/api/events/${id}`)
}

export function registerForEvent({ id, notes = '' }) {
  return api.post(`/api/events/${id}/register`, { notes })
}

export function createPaidEventOrder({ id }) {
  return api.post(`/api/events/${id}/create-order`)
}

export function capturePaidEventOrder({ id, orderId, payerId, notes = '' }) {
  return api.post(`/api/events/${id}/capture-order`, {
    orderId,
    payerId,
    notes,
  })
}

export function cancelEventRegistration({ id }) {
  return api.delete(`/api/events/${id}/register`)
}

/**
 * Get current user's event registrations
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Limit number of results (default: 20)
 * @param {number} params.skip - Skip number of results (default: 0)
 * @param {string} params.status - Filter by status: 'attended', 'upcoming', 'past' (optional)
 */
export function getUserEventRegistrations(params = {}) {
  return api.get('/api/events/me', { params })
}

// Get all registrations for a specific event
export function getEventRegistrations({ id, ...params }) {
  return api.get(`/api/events/${id}/registrations`, { params })
}

// Admin analytics
export function getEventStats() {
  return api.get('/api/events/stats')
}

/** Self-service: record arrival at an event (must be registered). Requires attendanceToken during the event window. */
export function checkInToEvent({ id, attendanceNotes = '', attendanceToken }) {
  return api.post(`/api/events/${id}/check-in`, { attendanceNotes, attendanceToken })
}

/** Self-service: record departure; marks attended and emails admins. Requires attendanceToken during the event window. */
export function checkOutOfEvent({ id, attendanceToken }) {
  return api.post(`/api/events/${id}/check-out`, { attendanceToken })
}

/** Public: resolve QR token to event id (for UI). */
export function resolveAttendanceToken(t) {
  return api.get('/api/events/resolve-attendance-token', { params: { t } })
}

/** Admin: roster with sign-in/out times for an event. */
export function getEventAttendance({ id }) {
  return api.get(`/api/events/${id}/attendance`)
}

/** Admin: full URL for attendance QR (creates token if missing). */
export function getEventAttendanceLink({ id }) {
  return api.get(`/api/events/${id}/attendance-link`)
}

