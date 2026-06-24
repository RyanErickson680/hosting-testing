import { Box, Typography, Paper, Button, LinearProgress } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { colors } from '../theme/colors'

/**
 * Reusable card for opportunities and campaigns
 * Used for both volunteer opportunities and donation campaigns
 */
export default function OpportunityCard({
  title,
  description,
  date,
  progress,
  onViewDetails,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: '20px',
        borderRadius: '1.25rem',
        backgroundColor: colors.background.paper,
        marginBottom: '12px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: colors.text.primary,
            flex: 1,
          }}
        >
          {title}
        </Typography>
        {date && (
          <Typography
            variant="caption"
            sx={{
              color: colors.text.secondary,
              marginLeft: '12px',
            }}
          >
            {date}
          </Typography>
        )}
      </Box>

      {description && (
        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            marginBottom: '12px',
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}

      {progress !== undefined && (
        <Box sx={{ marginBottom: '12px' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: colors.text.secondary,
                fontWeight: 500,
              }}
            >
              Progress
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: colors.primary.main,
                fontWeight: 600,
              }}
            >
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: '999px',
              backgroundColor: colors.background.section,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${colors.primary.dark}, ${colors.primary.main})`,
                borderRadius: '999px',
              },
            }}
          />
        </Box>
      )}

      <Button
        onClick={onViewDetails}
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
        View Details
      </Button>
    </Paper>
  )
}
