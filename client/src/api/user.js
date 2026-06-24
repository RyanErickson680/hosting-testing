import axios from 'axios'

const UserClient = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'}/api/user`,
  timeout: 10000,
  withCredentials: true, // Send codokies with requests for authenticated endpoints
})

// Get single user by ID
export const getUser = ({ id }) => UserClient.get(`/${id}`)

// Get user by email
export const getUserByEmail = ({ email }) => UserClient.get(`/email/${email}`)

// Get all users with optional query parameters
export const getUsers = (params = {}) => {
  const queryParams = new URLSearchParams()
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key])
    }
  })
  const queryString = queryParams.toString()
  return UserClient.get(queryString ? `/?${queryString}` : '/')
}

// Get users by role
export const getUsersByRole = ({ role }) => UserClient.get(`/role/${role}`)

// Get volunteers
export const getVolunteers = () => UserClient.get('/volunteers')

// Get donors
export const getDonors = () => UserClient.get('/donors')

// Get user statistics
export const getUserStats = () => UserClient.get('/stats')

// Create user
export const createUser = (userData) => UserClient.post('/', userData)

// Update user
export const updateUser = ({ email, ...userData }) =>
  UserClient.patch(`/email/${email}`, userData)

// Admin: resend account waiver email (new token) to an unsigned volunteer
export const resendVolunteerWaiver = ({ id }) =>
  UserClient.post(`/${id}/resend-waiver`)


// Delete user
export const deleteUser = ({ id }) => UserClient.delete(`/${id}`)

// Get user impact statistics
export const getUserImpactStats = () => UserClient.get('/impact-stats')

// Toggle newsletter subscription
export const updateNewsletterSubscription = (subscribed) =>
  UserClient.patch('/me/newsletter', { subscribed })

// Change own password
export const changePassword = ({ currentPassword, newPassword }) =>
  UserClient.patch('/me/password', { currentPassword, newPassword })

// Update own profile
export const updateOwnProfile = (data) => UserClient.patch('/me', data)

// Delete own account
export const deleteOwnAccount = () => UserClient.delete('/me')
