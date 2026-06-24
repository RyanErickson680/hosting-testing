import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import { colors } from '../theme/colors'

/**
 * Central layout wrapper that provides consistent structure across all pages
 * Manages Sidebar state and main content area
 */
export default function Layout({ children }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const location = useLocation()

  // Collapse sidebar when on project detail page or donate page
  useEffect(() => {
    // Check if we're on a project detail page (pattern: /donation-campaigns/:id)
    const isProjectDetailPage = /^\/donation-campaigns\/[^/]+$/.test(location.pathname)
    // Check if we're on a donate page (pattern: /donate/:id)
    const isDonatePage = /^\/donate\/[^/]+$/.test(location.pathname)
    if (isProjectDetailPage || isDonatePage) {
      setIsExpanded(false)
    } else {
      setIsExpanded(true)
    }
  }, [location.pathname])

  const sidebarWidth = isExpanded ? 280 : 72

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: colors.background.default,
      }}
    >
      <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
      <Box
        component="main"
        sx={{
          flex: 1,
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s ease',
          padding: { xs: '20px', sm: '32px' },
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
