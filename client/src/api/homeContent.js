import api from './api'

export const fetchHomeContent = async () => {
  const response = await api.get('/api/home-content')
  return response.data?.content || null
}

export const saveHomeContent = async (content) => {
  const response = await api.put('/api/home-content', { content })
  return response.data?.content || null
}
