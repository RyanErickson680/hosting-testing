import { Box, Typography, Chip, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import GroupIcon from '@mui/icons-material/Group'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { colors } from '../theme/colors'

const CARD_GRADIENTS = [
  'linear-gradient(145deg, #1b4332 0%, #2d6a4f 100%)',
  'linear-gradient(145deg, #3a5a40 0%, #588157 100%)',
  'linear-gradient(145deg, #344e41 0%, #3a5a40 100%)',
  'linear-gradient(145deg, #2c5f2e 0%, #4a7c3f 100%)',
  'linear-gradient(145deg, #4a5568 0%, #718096 100%)',
  'linear-gradient(145deg, #5c3d2e 0%, #7a5649 100%)',
]

function getGradient(name = '') {
  return CARD_GRADIENTS[(name.charCodeAt(0) || 0) % CARD_GRADIENTS.length]
}

function formatDate(start, endTime, fallbackEndDate) {
  if (!start) return 'Date TBD'
  const startDate = new Date(start)
  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (endTime) return `${dateStr} • ${timeStr}`
  if (fallbackEndDate) {
    const endStr = new Date(fallbackEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${dateStr} – ${endStr} • ${timeStr}`
  }
  return `${dateStr} • ${timeStr}`
}

function getStatusBadge(status, isPast) {
  if (isPast || status === 'completed') return { label: 'Completed', bg: '#e5e9e6', color: '#41493e' }
  if (status === 'cancelled') return { label: 'Cancelled', bg: '#ffdad6', color: '#93000a' }
  if (status === 'full') return { label: 'Full', bg: '#ffdbcf', color: '#2e150b' }
  return { label: 'Open', bg: '#acf4a4', color: '#0c5216' }
}

export default function EventCard({
  event,
  onSignUp,
  isRegistered,
  registering,
  canCurrentUserSignUp = true,
  isPast = false,
  registrationClosed = false,
}) {
  const navigate = useNavigate()

  const getEventEndDateTime = () => {
    if (!event?.date) return null
    const startDate = new Date(event.date)
    if (event?.endTime) {
      const [hours, minutes] = String(event.endTime).split(':').map((v) => parseInt(v, 10))
      if (Number.isInteger(hours) && Number.isInteger(minutes)) {
        const end = new Date(startDate)
        end.setHours(hours, minutes, 0, 0)
        return end
      }
    }
    if (event?.endDate) return new Date(event.endDate)
    return startDate
  }

  const eventEndDateTime = getEventEndDateTime()
  const now = new Date()
  const isUpcoming = eventEndDateTime && eventEndDateTime > now
  const registrationCutoff = event?.date ? new Date(new Date(event.date).getTime() + 15 * 60 * 1000) : null
  const registrationWindowOpen = !registrationClosed && (registrationCutoff ? now < registrationCutoff : true)
  const canSignUp = !isPast && canCurrentUserSignUp && event.status === 'open' && isUpcoming && registrationWindowOpen && !isRegistered
  const isFull = event.status === 'full'
  const badge = getStatusBadge(event.status, isPast)

  const spotsLabel = (() => {
    const current = event.currentVolunteerCount || 0
    if (event.maxVolunteers) return `${current} of ${event.maxVolunteers} spots filled`
    return `${current} volunteer${current !== 1 ? 's' : ''} signed up`
  })()

  const actionButton = (() => {
    if (isRegistered) {
      return (
        <Box sx={{ pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="text"
            onClick={() => navigate(`/event/${event._id}`)}
            sx={{ color: colors.primary.dark, textTransform: 'none', fontWeight: 700, fontFamily: 'Manrope, sans-serif', p: 0, fontSize: '0.875rem', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
          >
            View Details
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.primary.main }}>
            <CheckCircleIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Manrope, sans-serif', color: 'inherit' }}>
              You're signed up
            </Typography>
          </Box>
        </Box>
      )
    }
    if (canSignUp) {
      const label = registering ? 'Processing...' : event.eventType === 'paid' ? `Pay & Sign Up — $${Number(event.cost || 0).toFixed(2)}` : 'Sign Up Now'
      return (
        <Button
          fullWidth
          disabled={registering}
          onClick={(e) => { e.stopPropagation(); onSignUp(event) }}
          sx={{
            mt: 2,
            backgroundColor: colors.primary.dark,
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.9rem',
            py: 1.5,
            borderRadius: '0.75rem',
            boxShadow: 'none',
            '&:hover': { backgroundColor: colors.primary.main, boxShadow: 'none' },
          }}
        >
          {label}
        </Button>
      )
    }
    if (isFull) {
      return (
        <Button
          fullWidth
          disabled
          sx={{
            mt: 2,
            backgroundColor: '#e5e9e6',
            color: '#717a6d',
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.9rem',
            py: 1.5,
            borderRadius: '0.75rem',
            boxShadow: 'none',
            '&.Mui-disabled': { backgroundColor: '#e5e9e6', color: '#717a6d' },
          }}
        >
          Waitlist Full
        </Button>
      )
    }
    if (registrationClosed && !isRegistered && !isPast) {
      return (
        <Button
          fullWidth
          disabled
          sx={{
            mt: 2,
            backgroundColor: '#f1f3f2',
            color: '#66706a',
            textTransform: 'none',
            fontWeight: 700,
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.9rem',
            py: 1.5,
            borderRadius: '0.75rem',
            boxShadow: 'none',
            '&.Mui-disabled': { backgroundColor: '#f1f3f2', color: '#66706a' },
          }}
        >
          Registration closed (15-min cutoff)
        </Button>
      )
    }
    if (!canCurrentUserSignUp && !isPast) {
      return (
        <Typography variant="body2" sx={{ mt: 2, color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontStyle: 'italic', fontSize: '0.8rem' }}>
          Only volunteer accounts can sign up
        </Typography>
      )
    }
    if (isPast) {
      return (
        <Button
          variant="text"
          sx={{ mt: 2, color: colors.text.secondary, textTransform: 'none', fontWeight: 700, fontFamily: 'Manrope, sans-serif', p: 0, fontSize: '0.875rem', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
        >
          View Details
        </Button>
      )
    }
    return null
  })()

  return (
    <Box
      sx={{
        backgroundColor: colors.background.paper,
        borderRadius: '1.5rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0px 12px 32px rgba(24, 29, 27, 0.04)',
        transition: 'transform 0.25s ease',
        '&:hover': { transform: 'translateY(-4px)' },
        height: '100%',
      }}
    >
      {/* Image / gradient placeholder */}
      <Box
        sx={{
          position: 'relative',
          height: 200,
          flexShrink: 0,
          background: getGradient(event.name),
          overflow: 'hidden',
        }}
      >
        {/* Subtle logo watermark */}
        <Box
          component="img"
          src="/mill-creek-logo.png"
          alt=""
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            height: 64,
            width: 'auto',
            objectFit: 'contain',
            opacity: 0.18,
            filter: 'brightness(0) invert(1)',
          }}
        />
        {/* Status badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
            px: 1.5,
            py: 0.5,
            borderRadius: '999px',
            backgroundColor: badge.bg,
            color: badge.color,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {badge.label}
        </Box>
      </Box>

      {/* Card body */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: colors.primary.dark,
            mb: 2.5,
            lineHeight: 1.3,
          }}
        >
          {event.name}
        </Typography>

        {/* Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 17, color: colors.primary.main }} />
            <Typography sx={{ fontSize: '0.82rem', color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
              {formatDate(event.date, event.endTime, event.endDate)}
            </Typography>
          </Box>
          {event.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ fontSize: 17, color: colors.primary.main }} />
              <Typography sx={{ fontSize: '0.82rem', color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                {event.location}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon sx={{ fontSize: 17, color: colors.primary.main }} />
            <Typography sx={{ fontSize: '0.82rem', color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
              {spotsLabel}
            </Typography>
          </Box>
        </Box>

        {/* Skills / tags */}
        {event.skillsNeeded && event.skillsNeeded.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {event.skillsNeeded.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                sx={{
                  backgroundColor: '#e5e9e6',
                  color: colors.text.secondary,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  borderRadius: '999px',
                  height: 24,
                }}
              />
            ))}
          </Box>
        )}

        {/* Waiver / cost notice */}
        {event.waiverRequired && (
          <Typography variant="caption" sx={{ display: 'block', color: '#7a5649', fontFamily: 'Manrope, sans-serif', mb: 1 }}>
            Volunteer waiver required (same waiver as account signup)
          </Typography>
        )}
        {registrationClosed && !isRegistered && !isPast && (
          <Typography variant="caption" sx={{ display: 'block', color: '#7c5f00', fontFamily: 'Manrope, sans-serif', mb: 1 }}>
            Registration closed 15 minutes after start time.
          </Typography>
        )}

        {/* Push action to bottom */}
        <Box sx={{ mt: 'auto' }}>
          {actionButton}
        </Box>
      </Box>
    </Box>
  )
}
