import { Link, useLocation } from 'react-router-dom'
import { Tooltip, Box, Badge } from '@mui/material'
import { colors } from '../theme/colors'

/**
 * Reusable navigation item component for sidebar.
 * Active state: pill-shaped background with primary-colored text and icon.
 * Hover state: subtle tonal background shift (no borders).
 */
export default function NavItem({
  icon: Icon,
  label,
  to,
  badge,
  isExpanded,
}) {
  const location = useLocation()
  const isActive = location.pathname === to

  const navItemContent = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: isExpanded ? 1.75 : 0,
        justifyContent: isExpanded ? 'flex-start' : 'center',
        padding: isExpanded ? '12px 14px' : '12px',
        borderRadius: isExpanded ? '18px' : '16px',
        background: isActive
          ? 'linear-gradient(135deg, rgba(27, 94, 32, 0.16) 0%, rgba(172, 244, 164, 0.34) 100%)'
          : 'transparent',
        color: isActive ? colors.primary.dark : colors.text.secondary,
        fontWeight: isActive ? 800 : 600,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? 'inset 0 0 0 1px rgba(27, 94, 32, 0.08)' : 'none',
        '&:hover': {
          background: isActive
            ? 'linear-gradient(135deg, rgba(27, 94, 32, 0.18) 0%, rgba(172, 244, 164, 0.38) 100%)'
            : 'rgba(27, 94, 32, 0.06)',
          color: colors.primary.main,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: isExpanded ? '34px' : '24px',
          width: isExpanded ? '34px' : '24px',
          height: isExpanded ? '34px' : '24px',
          borderRadius: '12px',
          color: 'inherit',
          backgroundColor: isActive ? 'rgba(255,255,255,0.72)' : 'transparent',
        }}
      >
        {Icon && <Icon sx={{ fontSize: 22, color: 'inherit' }} />}
        {badge && (
          <Badge
            badgeContent={badge}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                fontSize: '10px',
                minWidth: '18px',
                height: '18px',
              },
            }}
          />
        )}
      </Box>
      {isExpanded && (
        <Box
          component="span"
          sx={{
            fontSize: '14px',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 'inherit',
            whiteSpace: 'nowrap',
            letterSpacing: '0.005em',
          }}
        >
          {label}
        </Box>
      )}
    </Box>
  )

  if (!isExpanded) {
    return (
      <Tooltip title={label} placement="right" arrow>
        <Link
          to={to}
          style={{
            textDecoration: 'none',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          {navItemContent}
        </Link>
      </Tooltip>
    )
  }

  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        display: 'block',
        marginBottom: '4px',
      }}
    >
      {navItemContent}
    </Link>
  )
}
