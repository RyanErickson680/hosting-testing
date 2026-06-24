import axios from 'axios'

const AuthClient = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'}/api/auth`,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests
})

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {boolean} userData.isVolunteer - Whether to sign up as volunteer
 * @param {Object} userData.contactInfo - Optional contact information
 * @returns {Promise} Axios response with user object
 */
export const register = (userData) => {
  return AuthClient.post('/register', userData)
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Whether to extend session to 30 days
 * @returns {Promise} Axios response with user object
 */
export const login = (email, password, rememberMe = false) => {
  return AuthClient.post('/login', { email, password, rememberMe })
}

/**
 * Get current authenticated user
 * @returns {Promise} Axios response with user object
 */
export const getCurrentUser = () => {
  return AuthClient.get('/me')
}

/**
 * Logout user
 * @returns {Promise} Axios response
 */
export const logout = () => {
  return AuthClient.post('/logout')
}

/**
 * Fetch account waiver details by token (public — link from email).
 */
export const getAccountWaiverDetails = (token) => {
  return AuthClient.get(`/waiver/${token}`)
}

/**
 * Approve the account-level volunteer waiver using the one-time token.
 */
export const approveAccountWaiver = (token) => {
  return AuthClient.post(`/waiver/${token}/approve`)
}

/** Logged-in volunteer: email a fresh link to sign the account waiver (e.g. before waiver-required events). */
export const requestAccountWaiverEmail = () => {
  return AuthClient.post('/request-waiver-email')
}

// Response interceptor to handle 401 errors globally
// Note: This will redirect to login if token is expired/invalid
// The actual redirect is handled in AuthContext when checkAuth fails
AuthClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - let AuthContext handle the redirect
      // Don't redirect here to avoid circular dependencies
    }
    return Promise.reject(error)
  }
)
