import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { colors } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import { getUserImpactStats } from '../api/user'
import ImpactSummary from '../components/impact/ImpactSummary'
import DonationsTab from '../components/impact/DonationsTab'
import VolunteeringTab from '../components/impact/VolunteeringTab'

export default function Impact() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get active tab from URL, default to 'donations'
  const activeTab = searchParams.get('tab') || 'donations'
  const validTabs = ['donations', 'volunteering']
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'donations'

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getUserImpactStats()
      setStats(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load impact data')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    // Update URL with new tab
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('tab', newValue)
    setSearchParams(newSearchParams, { replace: true })
    
    // Scroll to top when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          py: 6,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
        }}
      >
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Page Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '32px',
        }}
      >
        Your Impact
      </Typography>

      {/* Hero Summary Section */}
      <ImpactSummary stats={stats} loading={loading} activeTab={currentTab} />

      {/* Error State */}
      {error && !loading && (
        <Alert
          severity="error"
          sx={{ marginBottom: '24px' }}
          action={
            <button
              onClick={fetchStats}
              style={{
                background: 'none',
                border: 'none',
                color: colors.error.main,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Tab Selector */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '32px',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="impact tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '16px',
              minHeight: '48px',
              padding: '12px 24px',
            },
            '& .Mui-selected': {
              color:
                currentTab === 'donations'
                  ? colors.primary.main
                  : colors.secondary.main,
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              backgroundColor:
                currentTab === 'donations'
                  ? colors.primary.main
                  : colors.secondary.main,
              height: 3,
            },
          }}
        >
          <Tab
            icon={<AttachMoneyIcon />}
            iconPosition="start"
            label="Donations"
            value="donations"
            sx={{
              '&.Mui-selected': {
                color: colors.primary.main,
              },
            }}
          />
          <Tab
            icon={<VolunteerActivismIcon />}
            iconPosition="start"
            label="Volunteering"
            value="volunteering"
            sx={{
              '&.Mui-selected': {
                color: colors.secondary.main,
              },
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box
        sx={{
          minHeight: '400px',
        }}
      >
        {currentTab === 'donations' && <DonationsTab />}
        {currentTab === 'volunteering' && <VolunteeringTab />}
      </Box>
    </Container>
  )
}
