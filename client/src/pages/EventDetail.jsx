import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Divider,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { colors } from '../theme/colors'
import { getEvent, getUserEventRegistrations } from '../api/event'
import { useAuth } from '../context/AuthContext'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [registrations, setRegistrations] = useState([])

  console.log('EventDetail mounted, id:', id)

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getEvent({ id })
        console.log('Event loaded:', response.data.event)
        setEvent(response.data.event)
      } catch (err) {
        console.error('Error loading event:', err)
        setError(err.response?.data?.error || err.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id])

  // Fetch user registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!isAuthenticated) return
      try {
        const response = await getUserEventRegistrations({ limit: 100 })
        setRegistrations(response.data.registrations || [])
      } catch {
        // Non-critical
      }
    }

    fetchRegistrations()
  }, [isAuthenticated])

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.primary.main }} />
      </Container>
    )
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error || 'Event not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/volunteer-opportunities')}>
          Back to Opportunities
        </Button>
      </Container>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getEventEndDateTime = (event) => {
    if (!event?.date) return null
    const start = new Date(event.date)
    if (event?.endTime) {
      const [hours, minutes] = String(event.endTime).split(':').map((v) => parseInt(v, 10))
      if (Number.isInteger(hours) && Number.isInteger(minutes)) {
        const end = new Date(start)
        end.setHours(hours, minutes, 0, 0)
        return end
      }
    }
    return start
  }

  const isPastEvent = event.status === 'completed' || event.status === 'cancelled' || getEventEndDateTime(event) <= new Date()

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return { bg: '#F0FDF4', text: '#166534' }
      case 'full':
        return { bg: '#FEF3C7', text: '#92400E' }
      case 'completed':
        return { bg: '#E5E7EB', text: '#374151' }
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B' }
      default:
        return { bg: colors.background.section, text: colors.text.secondary }
    }
  }

  const statusColor = getStatusColor(event.status)

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/volunteer-opportunities')}
        sx={{
          mb: 3,
          textTransform: 'none',
          color: colors.primary.main,
          fontWeight: 600,
          '&:hover': { backgroundColor: 'rgba(27, 94, 32, 0.05)' },
        }}
      >
        Back to Opportunities
      </Button>

      {/* Event header */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: '1.5rem', backgroundColor: colors.background.paper, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Chip
              label={event.status.toUpperCase()}
              sx={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                fontWeight: 700,
                mb: 2,
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '2.5rem',
                fontWeight: 800,
                color: colors.text.primary,
                lineHeight: 1.1,
                mb: 1,
              }}
            >
              {event.name}
            </Typography>
          </Box>
          {event.eventType === 'paid' && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.85rem', color: colors.text.secondary, mb: 0.5 }}>
                Event Cost
              </Typography>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: colors.primary.main }}>
                ${Number(event.cost || 0).toFixed(2)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Event info grid */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
            <Box>
              <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                Date & Time
              </Typography>
              <Typography sx={{ color: colors.text.primary, fontWeight: 600 }}>
                {formatDate(event.date)}
                {event.endTime && ` • ${event.endTime}`}
              </Typography>
            </Box>
          </Box>

          {event.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  Location
                </Typography>
                <Typography sx={{ color: colors.text.primary, fontWeight: 600 }}>
                  {event.location}
                </Typography>
              </Box>
            </Box>
          )}

          {event.volunteersNeeded && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
              <Box>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  Volunteers
                </Typography>
                <Typography sx={{ color: colors.text.primary, fontWeight: 600 }}>
                  {event.currentVolunteerCount || 0} / {event.volunteersNeeded} signed up
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>

        {/* Description */}
        {event.description && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: colors.text.primary, mb: 1 }}>
                About This Event
              </Typography>
              <Typography sx={{ color: colors.text.secondary, lineHeight: 1.7 }}>
                {event.description}
              </Typography>
            </Box>
          </>
        )}

        {/* Skills needed */}
        {event.skillsNeeded && event.skillsNeeded.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                Skills Needed
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {event.skillsNeeded.map((skill) => (
                  <Chip key={skill} label={skill} variant="outlined" sx={{ borderColor: colors.primary.light }} />
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Waiver notice */}
        {event.waiverRequired && (
          <>
            <Divider sx={{ my: 3 }} />
            <Alert severity="info" sx={{ backgroundColor: 'rgba(27, 94, 32, 0.1)' }}>
              A volunteer waiver is required for this event.
            </Alert>
          </>
        )}
      </Paper>

      {/* Other signed-up opportunities */}
      {registrations.length > 0 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '1.5rem', backgroundColor: colors.background.paper, mb: 3 }}>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: colors.text.primary,
              mb: 3,
            }}
          >
            Your Other Upcoming Events
          </Typography>

          {registrations.filter((r) => r.eventId !== event._id && !r.isPast).length > 0 ? (
            <Stack spacing={2}>
              {registrations
                .filter((r) => r.eventId !== event._id && !r.isPast)
                .map((reg) => (
                  <Paper
                    key={reg._id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '1rem',
                      backgroundColor: colors.background.section,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
                        {reg.eventName || 'Event'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                        {formatDate(reg.eventDate)}
                        {reg.eventLocation && ` • ${reg.eventLocation}`}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => navigate(`/event/${reg.eventId}`)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontFamily: 'Manrope, sans-serif',
                      }}
                    >
                      View
                    </Button>
                  </Paper>
                ))}
            </Stack>
          ) : (
            <Typography sx={{ color: colors.text.secondary, fontStyle: 'italic' }}>
              No other upcoming events scheduled
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  )
}
