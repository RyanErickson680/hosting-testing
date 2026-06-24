import { Button, Tooltip } from '@mui/material'
import { colors } from '../theme/colors'
import FavoriteIcon from '@mui/icons-material/Favorite'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import GroupsIcon from '@mui/icons-material/Groups'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'

/**
 * Reusable CTA card/button component
 * Supports both primary (Donate) and secondary (Volunteer) variants
 * Can be used as full-width cards (hero) or compact buttons (sidebar)
 */
export default function CTACard({
  title,
  onClick,
  variant = 'primary',
  isExpanded = true,
  className = '',
  size = 'medium', // 'medium' for sidebar, 'large' for hero
}) {
  const isPrimary = variant === 'primary'

  // Icon selection
  const getIcon = () => {
    if (isPrimary) {
      return <FavoriteIcon sx={{ fontSize: size === 'large' ? 28 : 20 }} />
    }
    return <GroupsIcon sx={{ fontSize: size === 'large' ? 28 : 20 }} />
  }

  const buttonStyles = {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
      color: '#ffffff',
      fontWeight: 600,
      boxShadow: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
        boxShadow: '0px 8px 24px rgba(27, 94, 32, 0.25)',
      },
    },
    secondary: {
      backgroundColor: '#e4ebe5',
      color: '#ffffff',
      fontWeight: 600,
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: '#d9e4da',
        boxShadow: 'none',
      },
    },
  }

  const paddingStyles = {
    large: { padding: '16px 32px' },
    medium: { padding: '10px 20px' },
  }

  const buttonContent = (
    <Button
      onClick={onClick}
      variant="contained"
      startIcon={isExpanded ? getIcon() : null}
      sx={{
        ...buttonStyles[isPrimary ? 'primary' : 'secondary'],
        ...paddingStyles[size],
        borderRadius: '8px', // Medium border radius, not pill
        textTransform: 'none',
        fontSize: size === 'large' ? '16px' : '14px',
        width: isExpanded ? '100%' : 'auto',
        minWidth: isExpanded ? 'auto' : '48px',
        justifyContent: isExpanded ? (size === 'large' ? 'center' : 'flex-start') : 'center',
        ...(size === 'large' && {
          minHeight: '60px',
        }),
      }}
      className={className}
    >
      {isExpanded ? title : getIcon()}
    </Button>
  )

  if (!isExpanded) {
    return (
      <Tooltip title={title} placement="right" arrow>
        {buttonContent}
      </Tooltip>
    )
  }

  return buttonContent
}
