import { Box, Typography, Paper, Button, LinearProgress } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/colors'
import SocialShare from './SocialShare'

/**
 * Sticky Donation Card Component
 * Displays a sticky donation CTA on the right side of the screen (desktop only)
 * Inspired by GoFundMe's donation card design
 */
export default function StickyDonationCard({ project }) {
  const navigate = useNavigate()

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  // Calculate progress percentage
  const progress = project.goalAmount > 0
    ? Math.min(((project.currentAmount || 0) / project.goalAmount) * 100, 100)
    : 0

  const currentAmount = project.currentAmount || 0
  const goalAmount = project.goalAmount || 0

  const handleDonate = () => {
    navigate(`/donate/${project._id}`)
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'sticky',
        top: 24,
        width: '100%',
        maxWidth: 360,
        padding: '24px',
        borderRadius: '12px',
        backgroundColor: colors.background.paper,
        border: `1px solid ${colors.background.section}`,
        display: { xs: 'none', md: 'block' }, // Hidden on mobile, visible on desktop
      }}
    >
      {/* Progress Summary */}
      <Box sx={{ marginBottom: '20px' }}>
        <Typography
          sx={{
            fontSize: '28px',
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: '4px',
          }}
        >
          {formatCurrency(currentAmount)}
        </Typography>
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            color: colors.text.secondary,
            marginBottom: '12px',
          }}
        >
          raised of {formatCurrency(goalAmount)} goal
        </Typography>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: '#EDF7F1',
            marginBottom: '12px',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(to right, #166534, #4ADE80)',
              borderRadius: 6,
            },
          }}
        />

        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            color: colors.text.secondary,
            textAlign: 'center',
          }}
        >
          {progress.toFixed(1)}% complete
        </Typography>
      </Box>

      {/* Donate Button */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleDonate}
        sx={{
          backgroundColor: '#22C55E',
          color: '#FFFFFF',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '16px',
          padding: '12px 24px',
          borderRadius: '8px',
          marginBottom: '12px',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#16A34A',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
          },
        }}
      >
        Donate Now
      </Button>

      {/* Share Button */}
      <SocialShare project={project} buttonVariant="outlined" fullWidth />
    </Paper>
  )
}
