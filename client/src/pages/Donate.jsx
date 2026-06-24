import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  Paper,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { colors } from '../theme/colors'
import { getProject } from '../api/project'
import { useAuth } from '../context/AuthContext'
import DonationTypeSelector from '../components/donations/DonationTypeSelector'
import RecurringIntervalSelector from '../components/donations/RecurringIntervalSelector'
import DonationAmountSelector from '../components/donations/DonationAmountSelector'
import DonationMessageSection from '../components/donations/DonationMessageSection'
import DonorInfoSection from '../components/donations/DonorInfoSection'
import PayPalButton from '../components/donations/PayPalButton'
import RecurringPayPalButton from '../components/donations/RecurringPayPalButton'

/**
 * Donate Page
 * Complete donation flow for one-time and recurring donations
 */
export default function Donate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, checkAuth } = useAuth()

  // Project state
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(null)

  // Donation form state
  const [donationType, setDonationType] = useState('once')
  const [interval, setInterval] = useState('monthly')
  const [amount, setAmount] = useState(25)
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Donor info state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [createAccount, setCreateAccount] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validation errors
  const [amountError, setAmountError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Payment processing state
  const [processing, setProcessing] = useState(false)
  const [donationSuccess, setDonationSuccess] = useState(false)

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getProject({ id })
        setProject(response.data.project)
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id])

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
  const getProgress = () => {
    if (!project || project.goalAmount <= 0) return 0
    return Math.min(((project.currentAmount || 0) / project.goalAmount) * 100, 100)
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#F0FDF4'
      case 'completed':
        return '#F0FDF4'
      case 'proposed':
        return '#F0FDF4'
      default:
        return colors.background.section
    }
  }

  // Get status badge text color
  const getStatusTextColor = (status) => {
    switch (status) {
      case 'active':
        return '#166534'
      case 'completed':
        return '#166534'
      case 'proposed':
        return '#166534'
      default:
        return colors.text.secondary
    }
  }

  // Get status label
  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Truncate description
  const truncateDescription = (text, maxLength = 200) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // Validate form
  const validateForm = () => {
    const errors = {}

    // Amount validation
    if (!amount || amount < 1) {
      setAmountError('Please enter a donation amount of at least $1.00')
      return false
    }
    setAmountError('')

    // Donor info validation
    if (!firstName || firstName.trim() === '') {
      errors.firstName = 'First name is required'
    }
    if (!lastName || lastName.trim() === '') {
      errors.lastName = 'Last name is required'
    }
    if (!email || email.trim() === '') {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    // Password validation if creating account
    if (createAccount) {
      if (!password || password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
      }
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle PayPal success
  const handlePayPalSuccess = async (data) => {
    setProcessing(false)
    setDonationSuccess(true)
    
    // If account was created or updated, refresh auth state to get updated user info
    if ((data.accountCreated && data.user) || (isAuthenticated && data.accountUpdated)) {
      await checkAuth()
    }
    
    // Reset form fields
    setAmount(25)
    setMessage('')
    setIsAnonymous(false)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setCreateAccount(true)

    // Redirect to success page after 2 seconds
    setTimeout(() => {
      navigate(`/donate/success?donationId=${data.donation?._id || ''}&txnId=${data.paypalTransactionId || ''}&projectId=${id}&amount=${encodeURIComponent(amount || '')}&currency=USD&projectName=${encodeURIComponent(project?.name || '')}`)
    }, 2000)
  }

  // Handle PayPal error
  const handlePayPalError = (error) => {
    setProcessing(false)
    setError(error || 'An error occurred during payment')
  }

  // Get donor name for preview
  // Prioritize form state values so preview updates in real-time as user edits
  const getDonorName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (isAuthenticated && user) {
      return `${user.firstName} ${user.lastName}`
    }
    return 'Donor'
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (id && (error || !project)) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ marginBottom: '24px' }}>
          {error || 'Project not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/donation-campaigns')}
          sx={{
            textTransform: 'none',
            color: colors.primary.main,
          }}
        >
          Back to Projects
        </Button>
      </Container>
    )
  }

  const progress = project ? getProgress() : 0
  const currentAmount = project?.currentAmount || 0
  const goalAmount = project?.goalAmount || 0

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(id ? `/donation-campaigns/${id}` : '/donation-campaigns')}
        sx={{
          textTransform: 'none',
          color: colors.text.secondary,
          marginBottom: '24px',
          '&:hover': {
            backgroundColor: colors.background.section,
          },
        }}
      >
        {id ? 'Back to Project' : 'Back to Campaigns'}
      </Button>

      {/* General Donation Header (no specific project) */}
      {!project && (
        <Paper
          elevation={0}
          sx={{
            padding: '24px',
            backgroundColor: colors.background.paper,
            border: `1px solid ${colors.background.section}`,
            borderRadius: '12px',
            marginBottom: '32px',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1 }}>
            Support Mill Creek Farm
          </Typography>
          <Typography sx={{ color: colors.text.secondary }}>
            Your donation supports Mill Creek United Foundation's urban farming programs and community initiatives.
          </Typography>
        </Paper>
      )}

      {/* Project Summary Section */}
      {project && <Paper
        elevation={0}
        sx={{
          padding: '24px',
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.background.section}`,
          borderRadius: '12px',
          marginBottom: '32px',
        }}
      >
        {/* Project Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '24px', md: '28px' },
                fontWeight: 700,
                color: colors.text.primary,
                lineHeight: 1.2,
              }}
            >
              {project.name}
            </Typography>
            {(project.priority === 1 || project.priority === 2) && (
              <StarIcon
                sx={{
                  color: '#EAB308',
                  fontSize: { xs: '24px', md: '28px' },
                }}
              />
            )}
          </Box>
          <Chip
            label={getStatusLabel(project.status)}
            size="small"
            sx={{
              backgroundColor: getStatusColor(project.status),
              color: getStatusTextColor(project.status),
              fontWeight: 500,
              fontSize: '12px',
              height: '28px',
            }}
          />
        </Box>

        {/* Progress Section */}
        <Box sx={{ marginBottom: '16px' }}>
          <Box sx={{ marginBottom: '12px' }}>
            <Typography
              component="span"
              sx={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.text.primary,
              }}
            >
              {formatCurrency(currentAmount)}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                color: colors.text.secondary,
                marginLeft: '8px',
              }}
            >
              raised of {formatCurrency(goalAmount)} goal
            </Typography>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ position: 'relative', marginBottom: '12px' }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 20,
                borderRadius: 10,
                backgroundColor: '#EDF7F1',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(to right, #166534, #4ADE80)',
                  borderRadius: 10,
                },
              }}
            />
            {/* Milestone vertical bars at 25%, 50%, 75% */}
            {[25, 50, 75].map((milestone) => (
              <Box
                key={milestone}
                sx={{
                  position: 'absolute',
                  left: `${milestone}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#166534',
                  opacity: 0.4,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
            ))}
          </Box>

          <Typography
            sx={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.primary.main,
            }}
          >
            {progress.toFixed(1)}% Complete
          </Typography>
        </Box>

        {/* Description */}
        {project.description && (
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 400,
              color: colors.text.primary,
              lineHeight: 1.6,
              marginTop: '16px',
            }}
          >
            {truncateDescription(project.description, 300)}
          </Typography>
        )}
      </Paper>}

      {/* Donation Form */}
      <Paper
        elevation={0}
        sx={{
          padding: '24px',
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.background.section}`,
          borderRadius: '12px',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontSize: '24px',
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: '24px',
          }}
        >
          Make a Donation
        </Typography>

        {/* Donation Type Selector */}
        <DonationTypeSelector value={donationType} onChange={setDonationType} />

        {/* Recurring Interval Selector */}
        {donationType === 'recurring' && (
          <RecurringIntervalSelector
            value={interval}
            onChange={setInterval}
            amount={amount}
          />
        )}

        {/* Amount Selector */}
        <DonationAmountSelector
          value={amount}
          onChange={setAmount}
          error={amountError}
        />

        {/* Message Section */}
        <DonationMessageSection
          message={message}
          onMessageChange={setMessage}
          isAnonymous={isAnonymous}
          onAnonymousChange={setIsAnonymous}
          donorName={getDonorName()}
          amount={amount}
          donationType={donationType}
          interval={interval}
        />

        {/* Donor Info Section */}
        <DonorInfoSection
          firstName={firstName}
          lastName={lastName}
          email={email}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onEmailChange={setEmail}
          createAccount={createAccount}
          onCreateAccountChange={setCreateAccount}
          password={password}
          onPasswordChange={setPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setConfirmPassword}
          errors={formErrors}
        />

        {/* Form Errors */}
        {Object.keys(formErrors).length > 0 && (
          <Alert severity="error" sx={{ marginBottom: '16px' }}>
            Please fix the errors above before continuing.
          </Alert>
        )}

        {/* PayPal Button - One-time donations */}
        {donationType === 'once' && (
          <PayPalButton
            amount={amount}
            projectId={id}
            message={message || null}
            isAnonymous={isAnonymous}
            onSuccess={handlePayPalSuccess}
            onError={handlePayPalError}
            disabled={processing || Object.keys(formErrors).length > 0 || amountError}
            createAccount={!isAuthenticated && createAccount}
            accountData={
              !isAuthenticated && createAccount
                ? {
                    firstName,
                    lastName,
                    email,
                    password,
                  }
                : null
            }
            updateAccountInfo={
              isAuthenticated && user &&
              (firstName !== user.firstName || 
               lastName !== user.lastName ||
               email !== user.email)
                ? {
                    firstName,
                    lastName,
                    email,
                  }
                : null
            }
            email={
              // Use logged-in user's email, or form email if guest
              isAuthenticated && user?.email 
                ? user.email 
                : email || undefined
            }
          />
        )}

        {/* Recurring donations button */}
        {donationType === 'recurring' && (
          <>
            {!isAuthenticated && (
              <Alert severity="warning" sx={{ marginBottom: '16px' }}>
                You must be logged in to set up a recurring donation. Please sign up or log in first.
              </Alert>
            )}
            <RecurringPayPalButton
              amount={amount}
              projectId={id}
              interval={interval}
              message={message || null}
              onSuccess={handlePayPalSuccess}
              onError={handlePayPalError}
              disabled={processing || Object.keys(formErrors).length > 0 || amountError || !isAuthenticated}
            />
          </>
        )}
      </Paper>
    </Container>
  )
}
