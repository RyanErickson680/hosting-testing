import api from './api.js'

export function createEquipment(data) {
  return api.post('/api/equipment', data)
}

export function getEquipment(params = {}) {
  return api.get('/api/equipment', { params })
}

export function updateEquipment({ id, ...data }) {
  return api.put(`/api/equipment/${id}`, data)
}

export function deleteEquipment({ id }) {
  return api.delete(`/api/equipment/${id}`)
}
