import api from './api.js'

export function createInventoryLog(data) {
  return api.post('/api/produce', data)
}

export function getInventoryLogs(params = {}) {
  return api.get('/api/produce', { params })
}

export function getInventoryLogById({ id }) {
  return api.get(`/api/produce/${id}`)
}

export function deleteInventoryLog({ id }) {
  return api.delete(`/api/produce/${id}`)
}

export function createInventoryRequest(data) {
  return api.post('/api/produce-requests', data)
}

export function getInventoryRequests(params = {}) {
  return api.get('/api/produce-requests', { params })
}

export function approveInventoryRequest(id, data = {}) {
  return api.post(`/api/produce-requests/${id}/approve`, data)
}

export function rejectInventoryRequest(id, data = {}) {
  return api.post(`/api/produce-requests/${id}/reject`, data)
}

export function exportProduceCsv() {
  return api.get('/api/produce/export.csv', { responseType: 'blob' })
}

export function getNetTotals(params = {}) {
  return api.get('/api/produce/net-totals', { params })
}
