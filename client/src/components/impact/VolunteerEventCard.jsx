import { Box, Typography, Paper, Chip } from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { colors } from '../../theme/colors'

/**
 * Card component for displaying a volunteer event
 */
export default function VolunteerEventCard({ registration }) {
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    const eventDate = new Date(date)
    return eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusInfo = () => {
    const now = new Date()
    const eventDate = registration.eventDate ? new Date(registration.eventDate) : null

    if (registration.attended === true) {
      return { label: 'Attended', color: colors.success.main, bgColor: colors.success.light }
    }
    if (eventDate && eventDate > now) {
      return { label: 'Upcoming', color: colors.info.main, bgColor: colors.info.light }
    }
    if (eventDate && eventDate <= now) {
      return { label: 'Past', color: colors.text.secondary, bgColor: colors.background.section }
    }
    return { label: 'Registered', color: colors.info.main, bgColor: colors.info.light }
  }

  const statusInfo = getStatusInfo()

  return (
    <Paper
      elevation={0}
      sx={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: colors.background.paper,
        border: `1px solid ${colors.background.section}`,
        marginBottom: '16px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: '4px' }}>
            <EventIcon
              sx={{
                fontSize: 20,
                color: colors.secondary.main,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              {registration.eventName || 'Unknown Event'}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              marginLeft: '28px',
            }}
          >
            {formatDateTime(registration.eventDate)}
          </Typography>
        </Box>
        <Chip
          label={statusInfo.label}
          size="small"
          sx={{
            backgroundColor: statusInfo.bgColor,
            color: statusInfo.color,
            fontWeight: 500,
            fontSize: '12px',
          }}
        />
      </Box>

      <Box
        sx={{
          marginLeft: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {registration.eventLocation && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon
              sx={{
                fontSize: 16,
                color: colors.text.secondary,
              }}
            />
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              {registration.eventLocation}
            </Typography>
          </Box>
        )}
        {registration.hoursCredited && registration.hoursCredited > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon
              sx={{
                fontSize: 16,
                color: colors.secondary.main,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: colors.secondary.main,
                fontWeight: 500,
              }}
            >
              {registration.hoursCredited} {registration.hoursCredited === 1 ? 'hour' : 'hours'} credited
            </Typography>
          </Box>
        )}
        {registration.eventSkillsNeeded && registration.eventSkillsNeeded.length > 0 && (
          <Box sx={{ marginTop: '4px' }}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Skills: {registration.eventSkillsNeeded.join(', ')}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  )
}
