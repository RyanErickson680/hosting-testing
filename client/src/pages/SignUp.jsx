import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  Link as MuiLink,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { useAuth } from '../context/AuthContext'
import WaiverModal from '../components/WaiverModal'

export default function SignUp() {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, isAuthenticated, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    preferredContactMethod: 'email',
    isVolunteer: false,
    waiverName: '',
    waiverAccepted: false,
    emailSubscription: false,
  })

  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [waiverOpen, setWaiverOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const returnUrl = location.state?.returnUrl || '/'
      navigate(returnUrl, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, location])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required'
    }

    if (formData.isVolunteer) {
      if (!formData.waiverName.trim()) {
        newErrors.waiverName = 'Please type your full name to sign the waiver'
      }
      if (!formData.waiverAccepted) {
        newErrors.waiverAccepted = 'You must agree to the volunteer waiver'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const registrationData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      isVolunteer: formData.isVolunteer,
      waiverSigned: formData.isVolunteer && formData.waiverAccepted,
    }

    if (formData.phone) {
      registrationData.contactInfo = {
        phone: formData.phone,
        preferredContactMethod: formData.preferredContactMethod,
      }
    }

    const result = await register(registrationData)

    if (result.success) {
      const returnUrl = location.state?.returnUrl || '/'
      navigate(returnUrl, { replace: true })
    } else {
      setError(result.error || 'Registration failed. Please try again.')
    }

    setIsSubmitting(false)
  }

  const accountBenefits = [
    { text: 'View your full donation history', icon: <CheckCircleOutlineIcon fontSize="small" /> },
    { text: 'Track and manage recurring donations', icon: <CheckCircleOutlineIcon fontSize="small" /> },
    { text: 'Receive project updates from the farm', icon: <CheckCircleOutlineIcon fontSize="small" /> },
    { text: 'Faster checkout on future donations', icon: <CheckCircleOutlineIcon fontSize="small" /> },
  ]

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        py: { xs: 5, md: 7 },
        px: { xs: 2, sm: 4 },
        '@keyframes fadeSlideIn': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Back link */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', mb: 4 }}>
        <MuiLink
          component={Link}
          to="/"
          sx={{
            display: 'inline-flex',
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

      <Box
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          animation: 'fadeSlideIn 0.4s ease both',
        }}
      >
        <Grid container spacing={4} alignItems="flex-start">
          {/* Form panel */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={1}
              sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: 3,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              {/* Heading */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="overline"
                  sx={{ color: theme.palette.primary.main, letterSpacing: '0.1em', mb: 1, display: 'block' }}
                >
                  Join the community
                </Typography>
                <Typography variant="h3" component="h1" sx={{ mb: 1 }}>
                  Create your account
                </Typography>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <MuiLink
                    component={Link}
                    to="/login"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Log in
                  </MuiLink>
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Name row */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      disabled={isSubmitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={isSubmitting}
                />

                <TextField
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password || 'Must be at least 8 characters'}
                  disabled={isSubmitting}
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={isSubmitting}
                />

                <TextField
                  label="Phone"
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  disabled={isSubmitting}
                  error={!!errors.phone}
                  helperText={errors.phone}
                />

                <Divider sx={{ my: -0.5 }} />

                {/* Volunteer toggle card */}
                <Box
                  onClick={() => !isSubmitting && handleChange({ target: { name: 'isVolunteer', type: 'checkbox', checked: !formData.isVolunteer } })}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    border: `1.5px solid ${formData.isVolunteer ? theme.palette.primary.main : 'rgba(192,201,187,0.4)'}`,
                    backgroundColor: formData.isVolunteer ? theme.palette.background.section : 'transparent',
                    cursor: isSubmitting ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': !isSubmitting ? {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.background.section,
                    } : {},
                  }}
                >
                  <VolunteerActivismIcon
                    sx={{
                      color: formData.isVolunteer ? theme.palette.primary.main : theme.palette.text.disabled,
                      mt: 0.25,
                      transition: 'color 0.15s',
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, mb: 0.25 }}>
                      Sign up as a volunteer
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8125rem' }}>
                      Help at farm events and earn volunteer hours. A waiver is required.
                    </Typography>
                  </Box>
                  <Checkbox
                    name="isVolunteer"
                    checked={formData.isVolunteer}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    onClick={(e) => e.stopPropagation()}
                    sx={{ mt: -0.5, color: theme.palette.primary.main }}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      name="emailSubscription"
                      checked={formData.emailSubscription}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Subscribe to email updates from Mill Creek Urban Farm
                    </Typography>
                  }
                />

                {/* Volunteer waiver section */}
                {formData.isVolunteer && (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      backgroundColor: theme.palette.background.section,
                      border: `1px solid rgba(192,201,187,0.3)`,
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.primary }}>
                      Please read and sign the{' '}
                      <MuiLink
                        component="button"
                        type="button"
                        onClick={() => setWaiverOpen(true)}
                        sx={{
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          p: 0,
                          textDecoration: 'underline',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                        }}
                      >
                        Volunteer Waiver
                      </MuiLink>{' '}
                      before signing up as a volunteer.
                    </Typography>
                    <TextField
                      label="Full name (as signature)"
                      name="waiverName"
                      value={formData.waiverName}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      error={!!errors.waiverName}
                      helperText={errors.waiverName}
                      sx={{ mb: 1.5 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="waiverAccepted"
                          checked={formData.waiverAccepted}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I have read and agree to the Volunteer Waiver
                        </Typography>
                      }
                    />
                    {errors.waiverAccepted && (
                      <Typography variant="caption" color="error" sx={{ ml: 4, display: 'block' }}>
                        {errors.waiverAccepted}
                      </Typography>
                    )}
                  </Box>
                )}
                <WaiverModal open={waiverOpen} onClose={() => setWaiverOpen(false)} />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting || isLoading}
                  sx={{ py: 1.5, mt: 0.5, fontSize: '0.9375rem' }}
                >
                  {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Benefits panel */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 32 },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: 3,
                  background: `linear-gradient(145deg, ${theme.palette.background.default} 0%, #e8f5e9 100%)`,
                  border: `1px solid rgba(192,201,187,0.35)`,
                  overflow: 'hidden',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -40,
                    right: -40,
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'rgba(27,94,32,0.06)',
                    pointerEvents: 'none',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -30,
                    right: 20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(27,94,32,0.05)',
                    pointerEvents: 'none',
                  },
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: theme.palette.primary.main, letterSpacing: '0.1em', mb: 1, display: 'block' }}
                >
                  Member benefits
                </Typography>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ mb: 3, color: theme.palette.text.primary }}
                >
                  Why create an account?
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                  {accountBenefits.map(({ text, icon }) => (
                    <Box key={text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box
                        sx={{
                          mt: 0.1,
                          color: theme.palette.primary.main,
                          flexShrink: 0,
                        }}
                      >
                        {icon}
                      </Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.5 }}>
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Social proof stats */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {[
                    { value: '500+', label: 'Community members' },
                    { value: '3', label: 'Active campaigns' },
                    { value: '$12k+', label: 'Raised this year' },
                    { value: '40+', label: 'Volunteers' },
                  ].map(({ value, label }) => (
                    <Box
                      key={label}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontWeight: 800,
                          fontSize: '1.25rem',
                          color: theme.palette.primary.main,
                          lineHeight: 1,
                          mb: 0.5,
                        }}
                      >
                        {value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
