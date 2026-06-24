import { Box, Typography, Paper, Chip, Button } from '@mui/material'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { colors } from '../../theme/colors'
import { useNavigate } from 'react-router-dom'

/**
 * Card component for displaying a recurring donation
 */
export default function RecurringDonationCard({ recurringDonation }) {
  const navigate = useNavigate()

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return colors.primary.main
      case 'paused':
        return colors.text.secondary
      case 'cancelled':
        return colors.error.main
      default:
        return colors.text.secondary
    }
  }

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getIntervalLabel = (interval) => {
    switch (interval) {
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      case 'yearly':
        return 'Yearly'
      default:
        return interval
    }
  }

  const handleViewProject = () => {
    if (recurringDonation.projectId) {
      navigate(`/donation-campaigns/${recurringDonation.projectId}`)
    }
  }

  const handleManage = () => {
    if (recurringDonation._id) {
      navigate(`/subscription/${recurringDonation._id}/manage`)
    }
  }

  const canManage =
    recurringDonation.status === 'active' || recurringDonation.status === 'paused'

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
            <AutorenewIcon
              sx={{
                fontSize: 20,
                color: colors.primary.main,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              {recurringDonation.projectName || 'Unknown Project'}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              marginLeft: '28px',
            }}
          >
            {formatCurrency(recurringDonation.amount)} {getIntervalLabel(recurringDonation.interval)}
          </Typography>
        </Box>
        <Chip
          label={getStatusLabel(recurringDonation.status)}
          size="small"
          sx={{
            backgroundColor:
              recurringDonation.status === 'active'
                ? colors.primary.light
                : colors.background.section,
            color: getStatusColor(recurringDonation.status),
            fontWeight: 500,
            fontSize: '12px',
          }}
        />
      </Box>

      <Box
        sx={{
          marginLeft: '28px',
          marginBottom: '12px',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: '8px' }}>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            <strong>Started:</strong> {formatDate(recurringDonation.startDate)}
          </Typography>
          {recurringDonation.status === 'active' && recurringDonation.nextChargeDate && (
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              <strong>Next charge:</strong> {formatDate(recurringDonation.nextChargeDate)}
            </Typography>
          )}
        </Box>
        {recurringDonation.totalContributed > 0 && (
          <Typography variant="body2" sx={{ color: colors.primary.main, fontWeight: 500 }}>
            Total contributed: {formatCurrency(recurringDonation.totalContributed)}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginLeft: '28px', flexWrap: 'wrap' }}>
        {canManage && (
          <Button
            variant="contained"
            size="small"
            onClick={handleManage}
            sx={{
              backgroundColor: colors.primary.main,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Manage
          </Button>
        )}
        <Button
          onClick={handleViewProject}
          endIcon={<ArrowForwardIcon />}
          sx={{
            color: colors.primary.main,
            textTransform: 'none',
            fontWeight: 500,
            padding: 0,
            '&:hover': {
              backgroundColor: 'transparent',
              color: colors.primary.dark,
            },
          }}
        >
          View Project
        </Button>
      </Box>
    </Paper>
  )
}
