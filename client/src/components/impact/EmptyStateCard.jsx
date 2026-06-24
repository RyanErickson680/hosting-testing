import { Box, Typography, Paper } from '@mui/material'
import { colors } from '../../theme/colors'
import CTACard from '../CTACard'

/**
 * Reusable empty state component for Impact page tabs
 */
export default function EmptyStateCard({
  icon: Icon,
  title,
  message,
  ctaLabel,
  ctaAction,
  variant = 'donations', // 'donations' or 'volunteering'
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: '48px 24px',
        backgroundColor: colors.background.section,
        borderRadius: '12px',
        textAlign: 'center',
      }}
    >
      {Icon && (
        <Box
          sx={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Icon
            sx={{
              fontSize: 64,
              color:
                variant === 'donations'
                  ? colors.primary.main
                  : colors.secondary.main,
            }}
          />
        </Box>
      )}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: colors.text.primary,
          marginBottom: '8px',
        }}
      >
        {title}
      </Typography>
      {message && (
        <Typography
          variant="body1"
          sx={{
            color: colors.text.secondary,
            marginBottom: '24px',
            maxWidth: '500px',
            margin: '0 auto 24px auto',
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>
      )}
      {ctaLabel && ctaAction && (
        <Box sx={{ maxWidth: '300px', margin: '0 auto' }}>
          <CTACard
            title={ctaLabel}
            onClick={ctaAction}
            variant={variant === 'donations' ? 'primary' : 'secondary'}
            size="large"
          />
        </Box>
      )}
    </Paper>
  )
}
