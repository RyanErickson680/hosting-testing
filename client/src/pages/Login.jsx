import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../context/AuthContext'

// Validate that a redirect URL is a safe internal path
function isSafeRedirect(url) {
  if (!url || typeof url !== 'string') return false
  // Must start with / but not // (protocol-relative URLs)
  return url.startsWith('/') && !url.startsWith('//')
}

// Flat-top hex point generator
function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i)
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`
  }).join(' ')
}

// Earthy palette: terracotta, ochre, sage, soil, moss
const HEX_COLORS = ['#C4522A', '#D4943A', '#6B8C4A', '#8B5030', '#3D5A2A']
const HEX_OPACITIES = [0.55, 0.42, 0.60, 0.48, 0.65]

// Build hex grid data once — flat-top hexagons, circumradius 34
const HEX_R = 34
const HEX_DX = HEX_R * 1.5          // horizontal step between column centers
const HEX_DY = HEX_R * Math.sqrt(3) // vertical step between row centers
const HEX_COLS = 11
const HEX_ROWS = 17

const hexGridData = (() => {
  const cells = []
  for (let col = 0; col < HEX_COLS; col++) {
    for (let row = 0; row < HEX_ROWS; row++) {
      const cx = col * HEX_DX * 2 + HEX_R
      const cy = row * HEX_DY + (col % 2 === 1 ? HEX_DY / 2 : 0)
      const colorIdx = (col * 3 + row * 2) % HEX_COLORS.length
      const isStrokeOnly = (col + row) % 4 === 0
      const animClass = (col + row) % 5 === 0 ? 'hex-pulse-slow' : (col + row) % 3 === 0 ? 'hex-pulse-fast' : null
      cells.push({ cx, cy, colorIdx, isStrokeOnly, animClass, id: `${col}-${row}` })
    }
  }
  return cells
})()

const HexMosaic = () => (
  <>
    <style>{`
      @keyframes hexPulse {
        0%, 100% { opacity: var(--ho) }
        50% { opacity: calc(var(--ho) * 0.45) }
      }
      .hex-pulse-fast { animation: hexPulse 3.8s ease-in-out infinite }
      .hex-pulse-slow { animation: hexPulse 6.2s ease-in-out 1.4s infinite }
    `}</style>
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 500 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="hexGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise"/>
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
          <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>
          <feComposite in="blended" in2="SourceGraphic" operator="in"/>
        </filter>
        <clipPath id="panelClip">
          <rect x="0" y="0" width="500" height="900"/>
        </clipPath>
      </defs>
      <g clipPath="url(#panelClip)" filter="url(#hexGrain)">
        {hexGridData.map(({ cx, cy, colorIdx, isStrokeOnly, animClass, id }) => {
          const color = HEX_COLORS[colorIdx]
          const baseOpacity = isStrokeOnly ? HEX_OPACITIES[colorIdx] * 0.5 : HEX_OPACITIES[colorIdx]
          return (
            <polygon
              key={id}
              points={hexPoints(cx, cy, HEX_R - 2)}
              fill={isStrokeOnly ? 'none' : color}
              stroke={color}
              strokeWidth={isStrokeOnly ? 1.5 : 0.8}
              opacity={baseOpacity}
              className={animClass || undefined}
              style={animClass ? { '--ho': baseOpacity } : undefined}
            />
          )
        })}
      </g>
    </svg>
  </>
)

export default function Login() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const qsReturn = new URLSearchParams(location.search).get('returnUrl')
      const returnUrl = location.state?.returnUrl
        || (isSafeRedirect(qsReturn) ? qsReturn : null)
        || '/'
      navigate(returnUrl, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    const result = await login(email, password, rememberMe)

    if (result.success) {
      const qsReturn = new URLSearchParams(location.search).get('returnUrl')
      const returnUrl = location.state?.returnUrl
        || (isSafeRedirect(qsReturn) ? qsReturn : null)
        || '/'
      navigate(returnUrl, { replace: true })
    } else {
      setError(result.error || 'Login failed. Please try again.')
    }

    setIsSubmitting(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        backgroundColor: theme.palette.background.default,
        '@keyframes fadeSlideIn': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Left panel — brand identity */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #1C1008 0%, #2E1A0A 40%, #1A2810 80%, #0E1C0A 100%)',
          p: 6,
        }}
      >
        <HexMosaic />

        {/* Logo / wordmark */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1C9 1 2 6 2 11.5C2 14.538 5.134 17 9 17C12.866 17 16 14.538 16 11.5C16 6 9 1 9 1Z" fill="white" />
              <path d="M9 5C9 5 9 10 9 14" stroke="rgba(27,94,32,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9 9C9 9 6 7.5 5 5" stroke="rgba(27,94,32,0.5)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M9 11C9 11 12 9.5 13 7" stroke="rgba(27,94,32,0.5)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </Box>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'rgba(255, 240, 215, 0.95)',
              letterSpacing: '0.02em',
            }}
          >
            Mill Creek Urban Farm
          </Typography>
        </Box>

        {/* Main copy */}
        <Box sx={{ zIndex: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: { md: '2.5rem', lg: '3rem' },
              lineHeight: 1.1,
              color: '#ffffff',
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Grow with your community.
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '1rem',
              color: 'rgba(255, 235, 200, 0.72)',
              lineHeight: 1.6,
              maxWidth: 320,
            }}
          >
            Supporting local food access, one harvest at a time. Your generosity fuels the farm.
          </Typography>
        </Box>

        {/* Bottom stats */}
        <Box sx={{ display: 'flex', gap: 4, zIndex: 1 }}>
          {[
            { value: '500+', label: 'Community members' },
            { value: '3', label: 'Active campaigns' },
          ].map(({ value, label }) => (
            <Box key={label}>
              <Typography
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  color: '#D4943A',
                  lineHeight: 1,
                }}
              >
                {value}
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 230, 190, 0.58)',
                  mt: 0.5,
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 6, md: 7, lg: 9 },
          py: { xs: 6, md: 8 },
          position: 'relative',
          animation: 'fadeSlideIn 0.4s ease both',
        }}
      >
        {/* Back to home — top of form panel */}
        <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MuiLink
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: theme.palette.text.secondary,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 500,
              transition: 'color 0.15s',
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            Back to Home
          </MuiLink>
        </Box>

        <Box sx={{ maxWidth: 400, width: '100%' }}>
          {/* Overline + heading */}
          <Typography
            variant="overline"
            sx={{ color: theme.palette.primary.main, letterSpacing: '0.1em', mb: 1, display: 'block' }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            sx={{ mb: 1, color: theme.palette.text.primary }}
          >
            Log in to your account
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, mb: 4 }}
          >
            Don&apos;t have an account?{' '}
            <MuiLink
              component={Link}
              to="/signup"
              sx={{
                color: theme.palette.primary.main,
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign up
            </MuiLink>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              disabled={isSubmitting}
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    size="small"
                    sx={{ color: theme.palette.primary.main }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Remember me for 30 days
                  </Typography>
                }
              />
              <MuiLink
                component={Link}
                to="/forgot-password"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting || isLoading}
              sx={{ py: 1.5, mt: 0.5, fontSize: '0.9375rem' }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Log In'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
