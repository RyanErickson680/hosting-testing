import { Box, Typography, Paper } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { colors } from '../../theme/colors'
import { useNavigate } from 'react-router-dom'

/**
 * Card component for displaying a single donation in history
 */
export default function DonationHistoryItem({ donation }) {
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
    const donationDate = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now - donationDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`

    return donationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleViewProject = () => {
    if (donation.projectId) {
      navigate(`/donation-campaigns/${donation.projectId}`)
    }
  }

  return (
    <Paper
      elevation={0}
      onClick={handleViewProject}
      sx={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: colors.background.paper,
        border: `1px solid ${colors.background.section}`,
        marginBottom: '12px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
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
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              marginBottom: '4px',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              {donation.projectName || 'Unknown Project'}
            </Typography>
            {donation.paymentStatus === 'pending' && (
              <Typography
                variant="caption"
                sx={{
                  color: colors.warning.main,
                  fontWeight: 500,
                }}
              >
                (Pending)
              </Typography>
            )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              marginBottom: donation.message ? '4px' : 0,
            }}
          >
            {formatDate(donation.donatedAt)}
          </Typography>
          {donation.message && (
            <Typography
              variant="body2"
              sx={{
                color: colors.text.secondary,
                fontStyle: 'italic',
                marginTop: '4px',
              }}
            >
              "{donation.message}"
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: colors.primary.main,
            }}
          >
            {formatCurrency(donation.amount)}
          </Typography>
          <ArrowForwardIcon
            sx={{
              fontSize: 20,
              color: colors.text.secondary,
            }}
          />
        </Box>
      </Box>
    </Paper>
  )
}
