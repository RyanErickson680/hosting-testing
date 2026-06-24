import api from './api.js'

export function sendFeedback(data) {
  return api.post('/api/feedback', data)
}

export function getMyFeedback(params = {}) {
  return api.get('/api/feedback/me', { params })
}
