import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  IconButton,
  Divider,
  Tooltip,
  Button,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import CampaignIcon from '@mui/icons-material/Campaign'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import StorageIcon from '@mui/icons-material/Storage'
import InventoryIcon from '@mui/icons-material/Inventory2'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LogoutIcon from '@mui/icons-material/Logout'
import { colors } from '../theme/colors'
import NavItem from './NavItem'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ isExpanded = true, onToggle }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)

  const toggleSidebar = () => {
    if (onToggle) {
      onToggle()
    }
  }

  const sidebarWidth = isExpanded ? 288 : 76

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleUserMenuClose()
    await logout()
    navigate('/')
  }

  const getUserInitials = () => {
    if (!user) return ''
    const first = user.firstName?.[0] || ''
    const last = user.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }

  const getUserName = () => {
    if (!user) return ''
    return `${user.firstName} ${user.lastName}`
  }

  const getDisplayRole = () => {
    if (!user?.role) return 'User'
    return ['donor', 'volunteer'].includes(user.role) ? 'user' : user.role
  }

  return (
    <Box
      sx={{
        width: sidebarWidth,
        height: '100vh',
        background: 'linear-gradient(180deg, #f8fbf8 0%, #eef4ef 100%)',
        borderRight: '1px solid rgba(24, 29, 27, 0.06)',
        boxShadow: '10px 0 32px rgba(24, 29, 27, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          padding: isExpanded ? '16px 14px 6px' : '18px 10px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isExpanded ? 'space-between' : 'center',
          minHeight: isExpanded ? '108px' : '78px',
          position: 'relative',
        }}
      >
        {isExpanded ? (
          <>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: colors.text.primary,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  width: 74,
                  minWidth: 74,
                  height: 74,
                  borderRadius: '22px',
                  background: 'linear-gradient(145deg, #ffffff 0%, #eef3ef 100%)',
                  boxShadow: '0 16px 32px rgba(24, 29, 27, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/mill-creek-logo.png"
                  alt="Mill Creek Urban Farm logo"
                  sx={{
                    width: 58,
                    height: 58,
                    objectFit: 'contain',
                  }}
                />
              </Box>
              <Box
                sx={{
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '23px',
                    fontWeight: 900,
                    letterSpacing: '-0.06em',
                    lineHeight: 0.94,
                    color: '#111827',
                  }}
                >
                  Mill Creek
                </Typography>
                <Typography
                  sx={{
                    fontSize: '23px',
                    fontWeight: 900,
                    letterSpacing: '-0.06em',
                    lineHeight: 0.94,
                    color: colors.primary.main,
                  }}
                >
                  Urban Farm
                </Typography>
              </Box>
            </Link>
            <IconButton
              onClick={toggleSidebar}
              size="small"
              sx={{
                width: 38,
                height: 38,
                backgroundColor: 'rgba(255,255,255,0.82)',
                boxShadow: '0 10px 24px rgba(24, 29, 27, 0.08)',
                '&:hover': {
                  backgroundColor: '#ffffff',
                },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
            </IconButton>
          </>
        ) : (
          <>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 12px 28px rgba(24, 29, 27, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/mill-creek-logo.png"
                  alt="Mill Creek Urban Farm logo"
                  sx={{
                    width: 40,
                    height: 40,
                    objectFit: 'contain',
                  }}
                />
              </Box>
            </Link>
            <IconButton
              onClick={toggleSidebar}
              size="small"
              sx={{
                position: 'absolute',
                top: 18,
                right: -16,
                width: 32,
                height: 32,
                backgroundColor: '#ffffff',
                boxShadow: '0 12px 32px rgba(24, 29, 27, 0.08)',
                '&:hover': {
                  backgroundColor: '#f3f7f3',
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 20, color: colors.text.secondary }} />
            </IconButton>
          </>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          px: isExpanded ? 1.75 : 1,
          pt: isExpanded ? 0.25 : 0,
          pb: 1.5,
          overflowY: 'auto',
        }}
      >
        {isExpanded && (
          <Typography
            sx={{
              px: 1.25,
              pb: 0.75,
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: colors.text.disabled,
            }}
          >
            Navigation
          </Typography>
        )}

        <Box
          sx={{
            p: isExpanded ? 1 : 0.5,
            borderRadius: isExpanded ? '28px' : '22px',
            backgroundColor: 'rgba(255,255,255,0.76)',
            boxShadow: isExpanded ? '0 18px 32px rgba(24, 29, 27, 0.05)' : 'none',
            backdropFilter: isExpanded ? 'blur(10px)' : 'none',
          }}
        >
          {user?.volunteerProfile && (
            <NavItem
              icon={DashboardIcon}
              label="Volunteer Dashboard"
              to="/volunteer-dashboard"
              isExpanded={isExpanded}
            />
          )}
          <NavItem
            icon={VolunteerActivismIcon}
            label="Volunteer Opportunities"
            to="/volunteer-opportunities"
            isExpanded={isExpanded}
          />
          <NavItem
            icon={CampaignIcon}
            label="Donation Campaigns"
            to="/donation-campaigns"
            isExpanded={isExpanded}
          />
          {user?.volunteerProfile && (
            <NavItem
              icon={TrendingUpIcon}
              label="Impact"
              to="/impact"
              isExpanded={isExpanded}
            />
          )}
          {['admin', 'staff'].includes(user?.role) && (
            <NavItem
              icon={InventoryIcon}
              label="Inventory"
              to="/inventory"
              isExpanded={isExpanded}
            />
          )}
          {user?.role === 'admin' && (
            <NavItem
              icon={StorageIcon}
              label="Admin Dashboard"
              to="/admin-dashboard"
              isExpanded={isExpanded}
            />
          )}
        </Box>
      </Box>

      <Box
        sx={{
          px: isExpanded ? 1.75 : 1,
          pb: 1.75,
        }}
      >
        {isAuthenticated ? (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isExpanded ? 1.75 : 1,
                p: isExpanded ? 1.5 : 1,
                borderRadius: isExpanded ? '24px' : '18px',
                cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.88)',
                boxShadow: '0 14px 26px rgba(24, 29, 27, 0.05)',
                '&:hover': {
                  backgroundColor: '#ffffff',
                },
              }}
              onClick={handleUserMenuOpen}
            >
              <Avatar
                sx={{
                  width: isExpanded ? 44 : 30,
                  height: isExpanded ? 44 : 30,
                  backgroundColor: colors.primary.main,
                  fontSize: isExpanded ? '16px' : '12px',
                  fontWeight: 800,
                }}
              >
                {getUserInitials()}
              </Avatar>
              {isExpanded && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: colors.text.primary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {getUserName()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.text.secondary,
                      textTransform: 'capitalize',
                      fontSize: '0.74rem',
                    }}
                  >
                    {getDisplayRole()}
                  </Typography>
                </Box>
              )}
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
            >
              <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                Profile
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={handleUserMenuClose}>
                <SettingsIcon sx={{ mr: 1, fontSize: 20 }} />
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                Log Out
              </MenuItem>
            </Menu>

            {!isExpanded && (
              <Box sx={{ mt: 1 }}>
                <NavItem
                  icon={PersonIcon}
                  label="Profile"
                  to="/profile"
                  isExpanded={false}
                />
                <NavItem
                  icon={SettingsIcon}
                  label="Settings"
                  to="/settings"
                  isExpanded={false}
                />
              </Box>
            )}
          </>
        ) : (
          <>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              startIcon={<LoginIcon />}
              fullWidth
              sx={{
                mb: 1,
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                borderColor: 'rgba(27, 94, 32, 0.16)',
                color: colors.primary.main,
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  borderColor: colors.primary.dark,
                  backgroundColor: '#ffffff',
                },
                display: isExpanded ? 'flex' : 'none',
              }}
            >
              Log In
            </Button>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              startIcon={<PersonAddIcon />}
              fullWidth
              sx={{
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: colors.primary.main,
                boxShadow: '0 14px 24px rgba(27, 94, 32, 0.24)',
                '&:hover': {
                  backgroundColor: colors.primary.dark,
                },
                display: isExpanded ? 'flex' : 'none',
              }}
            >
              Sign Up
            </Button>
            {!isExpanded && (
              <>
                <Tooltip title="Log In" placement="right" arrow>
                  <IconButton
                    component={Link}
                    to="/login"
                    sx={{
                      width: '100%',
                      color: colors.text.secondary,
                      borderRadius: '16px',
                      '&:hover': {
                        color: colors.primary.main,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                  >
                    <LoginIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sign Up" placement="right" arrow>
                  <IconButton
                    component={Link}
                    to="/signup"
                    sx={{
                      width: '100%',
                      color: colors.text.secondary,
                      borderRadius: '16px',
                      '&:hover': {
                        color: colors.primary.main,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
