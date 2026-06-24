import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || 'http://localhost:8080',
  withCredentials: true,
  timeout: 30_000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Signal AuthContext to clear auth state and redirect to login
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  }
)

export default api