import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { colors } from '../theme/colors'
import { activateSubscription } from '../api/donation'

/**
 * Subscription Success Page
 * Shown after successful subscription approval.
 * Calls the activation endpoint to create the initial donation,
 * update project totals, and send the receipt email.
 */
export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const subscriptionId = searchParams.get('subscription_id')
  const projectId = searchParams.get('projectId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [donationData, setDonationData] = useState(null)
  const activatedRef = useRef(false)

  useEffect(() => {
    if (!subscriptionId || activatedRef.current) return
    activatedRef.current = true

    const activate = async () => {
      try {
        const response = await activateSubscription(subscriptionId)
        setDonationData(response.data)
      } catch (err) {
        console.error('Subscription activation error:', err)
        const msg =
          err.response?.data?.error ||
          err.message ||
          'Failed to activate subscription'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    activate()
  }, [subscriptionId])

  // Format currency for display
  const formatCurrency = (amount, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

  // ── Loading state ──
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: colors.background.paper,
            border: `1px solid ${colors.background.section}`,
            borderRadius: '12px',
          }}
        >
          <CircularProgress sx={{ color: colors.primary.main, marginBottom: '24px' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Activating your subscription...
          </Typography>
          <Typography variant="body1" sx={{ marginTop: '8px', color: colors.text.secondary }}>
            Please wait while we confirm your recurring donation with PayPal.
          </Typography>
        </Paper>
      </Container>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: colors.background.paper,
            border: `1px solid ${colors.background.section}`,
            borderRadius: '12px',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: '80px', color: '#EF4444', marginBottom: '24px' }} />
          <Typography variant="h5" sx={{ marginBottom: '16px', fontWeight: 600 }}>
            Something went wrong
          </Typography>
          <Alert severity="error" sx={{ marginBottom: '24px', textAlign: 'left' }}>
            {error}
          </Alert>
          <Typography variant="body2" sx={{ marginBottom: '32px', color: colors.text.secondary }}>
            Your subscription may still have been created with PayPal. Please check your impact page or try again.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/impact')}
              sx={{ backgroundColor: colors.primary.main, textTransform: 'none' }}
            >
              View Impact
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/donate')}
              sx={{ textTransform: 'none' }}
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      </Container>
    )
  }

  // ── Success state ──
  const donation = donationData?.donation
  const interval = donationData?.interval

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.background.section}`,
          borderRadius: '12px',
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: '80px',
            color: '#4ADE80',
            marginBottom: '24px',
          }}
        />
        <Typography variant="h4" sx={{ marginBottom: '16px', fontWeight: 700 }}>
          Subscription Activated!
        </Typography>

        {donation && (
          <Typography variant="body1" sx={{ marginBottom: '8px', color: colors.text.primary }}>
            Your {interval} donation of{' '}
            <strong>{formatCurrency(donation.amount, donation.currency)}</strong> to{' '}
            <strong>{donation.projectName}</strong> is now active.
          </Typography>
        )}

        <Typography variant="body1" sx={{ marginBottom: '32px', color: colors.text.secondary }}>
          {donationData?.alreadyActivated
            ? 'This subscription was already activated. No duplicate charge was created.'
            : "You'll receive email confirmations for each donation."}
        </Typography>

        {donation?.message && (
          <Paper
            elevation={0}
            sx={{
              padding: '12px 16px',
              marginBottom: '24px',
              backgroundColor: colors.background.section,
              borderLeft: `4px solid ${colors.primary.main}`,
              borderRadius: '4px',
              textAlign: 'left',
            }}
          >
            <Typography variant="body2" sx={{ color: colors.text.secondary, fontStyle: 'italic' }}>
              "{donation.message}"
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {projectId && (
            <Button
              variant="contained"
              onClick={() => navigate(`/donation-campaigns/${projectId}`)}
              sx={{
                backgroundColor: colors.primary.main,
                textTransform: 'none',
              }}
            >
              View Project
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => navigate('/impact')}
            sx={{
              backgroundColor: colors.primary.main,
              textTransform: 'none',
            }}
          >
            Impact
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/profile')}
            sx={{
              textTransform: 'none',
            }}
          >
            Manage Subscriptions
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
