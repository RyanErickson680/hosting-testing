import { Box, Typography, Paper, Button, LinearProgress, Chip } from '@mui/material'
import { colors } from '../../theme/colors'

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

function getCategoryLabel(project) {
  if (project.category) return project.category.toUpperCase()
  if (project.priority === 1) return 'URGENT'
  if (project.priority === 2) return 'PRIORITY'
  if (project.tags?.[0]) return project.tags[0].toUpperCase()
  return project.status === 'active' ? 'ACTIVE' : (project.status || '').toUpperCase()
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

/**
 * Project Card — grid variant matching the "Support Our Roots" design.
 * Compact card with image gradient, category badge, slim progress bar, and action buttons.
 */
export default function ProjectCard({ project, onViewDetails, onDonate, isPast = false }) {
  const currentAmount = project.currentAmount || 0
  const goalAmount = project.goalAmount || 0
  const progress = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0

  const truncate = (text, max = 100) => {
    if (!text) return ''
    return text.length <= max ? text : text.substring(0, max).trimEnd() + '...'
  }

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return
    onViewDetails?.(project)
  }

  const handleLearnMore = (e) => {
    e.stopPropagation()
    onViewDetails?.(project)
  }

  const handleDonate = (e) => {
    e.stopPropagation()
    onDonate?.(project)
  }

  return (
    <Paper
      elevation={0}
      onClick={handleCardClick}
      sx={{
        borderRadius: '1.25rem',
        backgroundColor: colors.background.paper,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
      }}
    >
      {/* Image area with category badge */}
      <Box
        sx={{
          width: '100%',
          height: 160,
          background: project.images?.[0]?.url
            ? `url(${project.images[0].url}) center/cover no-repeat`
            : getGradient(project.name),
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <Chip
          label={getCategoryLabel(project)}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            color: colors.text.primary,
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.07em',
            height: 22,
            borderRadius: '999px',
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            color: colors.text.primary,
            mb: 0.75,
            lineHeight: 1.3,
          }}
        >
          {project.name}
        </Typography>

        {project.description && (
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              mb: 2,
              lineHeight: 1.6,
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {truncate(project.description, 110)}
          </Typography>
        )}

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              mb: 0.75,
            }}
          >
            <Typography sx={{ fontSize: '0.78rem', color: colors.text.secondary, fontFamily: 'Manrope, sans-serif' }}>
              {formatCurrency(currentAmount)} raised of {formatCurrency(goalAmount)}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: colors.text.primary, fontFamily: 'Manrope, sans-serif' }}>
              {Math.round(progress)}%
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

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
          <Button
            variant="text"
            onClick={handleLearnMore}
            sx={{
              flex: 1,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: colors.text.secondary,
              borderRadius: '0.5rem',
              fontFamily: 'Manrope, sans-serif',
              '&:hover': {
                backgroundColor: colors.background.section,
                color: colors.text.primary,
              },
            }}
          >
            Learn More
          </Button>
          {!isPast && (
            <Button
              variant="contained"
              onClick={handleDonate}
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                fontFamily: 'Manrope, sans-serif',
                background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
                color: '#ffffff',
                borderRadius: '0.5rem',
                boxShadow: 'none',
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
                  boxShadow: '0px 6px 20px rgba(27, 94, 32, 0.25)',
                },
              }}
            >
              Donate Now
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  )
}
