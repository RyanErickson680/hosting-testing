import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import EventIcon from '@mui/icons-material/Event'
import { colors } from '../../theme/colors'

/**
 * Hero summary section showing key impact metrics
 */
export default function ImpactSummary({ stats, loading, activeTab }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatHours = (hours) => {
    if (!hours || hours === 0) return '0'
    return hours.toFixed(1)
  }

  const statCards = [
    {
      id: 'totalDonated',
      label: 'Total Donated',
      value: stats?.totalDonated || 0,
      formattedValue: formatCurrency(stats?.totalDonated || 0),
      icon: AttachMoneyIcon,
      color: colors.primary.main,
      highlight: activeTab === 'donations' || !activeTab,
    },
    {
      id: 'activeRecurring',
      label: 'Active Recurring',
      value: stats?.activeRecurringCount || 0,
      formattedValue: (stats?.activeRecurringCount || 0).toString(),
      icon: AutorenewIcon,
      color: colors.primary.main,
      highlight: activeTab === 'donations' || !activeTab,
    },
    {
      id: 'volunteerHours',
      label: 'Volunteer Hours',
      value: stats?.totalVolunteerHours || 0,
      formattedValue: formatHours(stats?.totalVolunteerHours || 0),
      icon: VolunteerActivismIcon,
      color: colors.secondary.main,
      highlight: activeTab === 'volunteering' || !activeTab,
    },
    {
      id: 'eventsParticipated',
      label: 'Events Participated',
      value: stats?.eventsParticipated || 0,
      formattedValue: (stats?.eventsParticipated || 0).toString(),
      icon: EventIcon,
      color: colors.secondary.main,
      highlight: activeTab === 'volunteering' || !activeTab,
    },
  ]

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          marginBottom: '48px',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  const hasNoData =
    !stats ||
    (stats.totalDonated === 0 &&
      stats.activeRecurringCount === 0 &&
      stats.totalVolunteerHours === 0 &&
      stats.eventsParticipated === 0)

  return (
    <Box sx={{ marginBottom: '48px' }}>
      {hasNoData && (
        <Box
          sx={{
            textAlign: 'center',
            marginBottom: '32px',
            padding: '24px',
            backgroundColor: colors.background.section,
            borderRadius: '12px',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: colors.text.primary,
              marginBottom: '8px',
            }}
          >
            Start Your Impact Journey
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.text.secondary,
            }}
          >
            Your contributions help us grow fresh produce for our community
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Grid item xs={6} sm={6} md={3} key={card.id}>
              <Paper
                elevation={0}
                sx={{
                  padding: '24px',
                  backgroundColor: colors.background.section,
                  borderRadius: '12px',
                  border: card.highlight
                    ? `2px solid ${card.color}`
                    : `1px solid ${colors.background.section}`,
                  transition: 'all 0.2s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <Icon
                  sx={{
                    fontSize: 32,
                    color: card.color,
                    marginBottom: '12px',
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: card.highlight ? colors.primary.light : colors.text.primary,
                    marginBottom: '4px',
                  }}
                >
                  {card.formattedValue}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                    fontSize: '14px',
                  }}
                >
                  {card.label}
                </Typography>
              </Paper>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
