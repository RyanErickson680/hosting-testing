import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, login as loginAPI, register as registerAPI, logout as logoutAPI } from '../api/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Listen for auth:expired events dispatched by the global Axios interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null)
      setIsAuthenticated(false)
    }
    window.addEventListener('auth:expired', handleAuthExpired)
    return () => window.removeEventListener('auth:expired', handleAuthExpired)
  }, [])

  /**
   * Check if user is authenticated by calling /api/auth/me
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getCurrentUser()
      if (response.data?.user) {
        setUser(response.data.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      // Not authenticated or token expired
      setUser(null)
      setIsAuthenticated(false)
      setError(null) // Don't show error for unauthenticated state
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Login user
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await loginAPI(email, password, rememberMe)
      if (response.data?.user) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        return { success: true, user: response.data.user }
      }
      throw new Error('Login failed')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.'
      setError(errorMessage)
      setUser(null)
      setIsAuthenticated(false)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await registerAPI(userData)
      if (response.data?.user) {
        setUser(response.data.user)
        setIsAuthenticated(true)
        return { success: true, user: response.data.user }
      }
      throw new Error('Registration failed')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.'
      setError(errorMessage)
      setUser(null)
      setIsAuthenticated(false)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setIsLoading(true)
      await logoutAPI()
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
    } catch (error) {
      // Even if logout fails, clear local state
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update user data in context
   */
  const updateUser = (userData) => {
    setUser(userData)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
