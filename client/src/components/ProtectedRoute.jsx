import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Box, CircularProgress } from '@mui/material'

/**
 * Protected Route Component
 * Wraps routes that require authentication and optionally a specific role.
 *
 * @param {React.ReactNode} children
 * @param {string} [requiredRole] - If provided, redirects non-matching roles to home
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Preserve query string (e.g. /volunteer-dashboard?t=) so return after login keeps the QR token
    const returnUrl = `${location.pathname}${location.search || ''}`
    return <Navigate to="/login" state={{ returnUrl }} replace />
  }

  // Redirect to home if authenticated but wrong role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  // Render protected content
  return children
}
