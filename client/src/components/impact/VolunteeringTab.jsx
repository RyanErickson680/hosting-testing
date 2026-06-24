import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import { colors } from '../../theme/colors'
import { getUserEventRegistrations } from '../../api/event'
import VolunteerEventCard from './VolunteerEventCard'
import EmptyStateCard from './EmptyStateCard'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'

/**
 * Volunteering tab content component
 */
export default function VolunteeringTab() {
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchVolunteerData()
  }, [])

  const fetchVolunteerData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getUserEventRegistrations({ limit: 50 })
      setRegistrations(response.data?.registrations || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load volunteer history')
    } finally {
      setLoading(false)
    }
  }

  const handleFindOpportunities = () => {
    navigate('/volunteer-opportunities')
  }

  const hasNoData = registrations.length === 0

  // Calculate statistics
  const totalHours = registrations.reduce(
    (sum, reg) => sum + (reg.hoursCredited || 0),
    0
  )
  const eventsAttended = registrations.filter((reg) => reg.attended === true).length
  const upcomingEvents = registrations.filter((reg) => reg.isUpcoming === true).length

  if (loading) {
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

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ marginBottom: '24px' }}
        action={
          <button
            onClick={fetchVolunteerData}
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
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              marginBottom: '8px',
            }}
          >
            Your Volunteer Impact
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
            }}
          >
            Giving your time to grow our community
          </Typography>
        </Box>
      </Box>

      {hasNoData ? (
        <EmptyStateCard
          icon={VolunteerActivismIcon}
          title="Join Our Volunteer Community"
          message="Your time helps us grow, harvest, and distribute fresh food. Join us in making a hands-on impact in our community."
          ctaLabel="Find Volunteer Opportunities"
          ctaAction={handleFindOpportunities}
          variant="volunteering"
        />
      ) : (
        <>
          {/* Statistics Summary */}
          <Paper
            elevation={0}
            sx={{
              padding: '24px',
              backgroundColor: colors.background.section,
              borderRadius: '12px',
              marginBottom: '32px',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
                marginBottom: '16px',
              }}
            >
              Your Volunteer Statistics
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: 3,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: colors.secondary.main,
                  }}
                >
                  {totalHours.toFixed(1)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                  }}
                >
                  Total Hours
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: colors.secondary.main,
                  }}
                >
                  {eventsAttended}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                  }}
                >
                  Events Attended
                </Typography>
              </Box>
              {upcomingEvents > 0 && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: colors.info.main,
                    }}
                  >
                    {upcomingEvents}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                    }}
                  >
                    Upcoming Events
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Events List */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
                marginBottom: '16px',
              }}
            >
              Event History
            </Typography>
            {registrations.map((registration) => (
              <VolunteerEventCard
                key={registration._id}
                registration={registration}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}
