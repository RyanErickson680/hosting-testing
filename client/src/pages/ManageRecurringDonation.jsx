import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { colors } from '../theme/colors'
import {
  getRecurringDonationDetails,
  updateSubscription,
  cancelSubscription,
  suspendRecurringSubscription,
  resumeRecurringSubscription,
} from '../api/donation'
import { getProjects } from '../api/project'

const CANCEL_REASONS = [
  'No longer able to give',
  'Switching to one-time donations',
  'Supporting a different project',
  'Other',
]

const INTERVAL_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)
}

function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getIntervalLabel(interval) {
  return INTERVAL_LABELS[interval] || interval
}

export default function ManageRecurringDonation() {
  const { recurringDonationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [projects, setProjects] = useState([])

  const [switchProjectId, setSwitchProjectId] = useState('')
  const [switchLoading, setSwitchLoading] = useState(false)
  const [switchError, setSwitchError] = useState(null)
  const [switchSuccessSnackbar, setSwitchSuccessSnackbar] = useState(null)
  const hasShownSwitchSuccess = useRef(false)

  const [pauseLoading, setPauseLoading] = useState(false)
  const [pauseError, setPauseError] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState(null)

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  const [paypalMeta, setPaypalMeta] = useState(null)

  useEffect(() => {
    if (!recurringDonationId) return
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getRecurringDonationDetails(recurringDonationId)
        setSubscription(res.data?.subscription)
        setPaypalMeta({
          reachable: res.data?.paypalReachable === true,
          errorCode: res.data?.paypalErrorCode ?? null,
          subscriptionStatus: res.data?.paypalSubscriptionStatus ?? null,
        })
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load subscription')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [recurringDonationId])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await getProjects({ status: 'active' })
        setProjects(res.data?.projects || [])
      } catch {
        setProjects([])
      }
    }
    fetchProjects()
  }, [])

  const projectName = subscription?.projectId?.name || 'Unknown Project'
  const currentProjectId = subscription?.projectId?._id ?? subscription?.projectId
  const paypalSubscriptionId = subscription?.paypalSubscriptionId
  const isActive = subscription?.status === 'active'
  const isPaused = subscription?.status === 'paused'

  const handleSwitchProject = async () => {
    if (!paypalSubscriptionId || !switchProjectId) return
    setSwitchLoading(true)
    setSwitchError(null)
    try {
      const res = await updateSubscription(paypalSubscriptionId, { projectId: switchProjectId })
      const data = res.data
      if (data?.success && data?.subscription?._id) {
        const projectNameNext = data.subscription.projectName || 'the selected project'
        navigate(`/subscription/${data.subscription._id}/manage`, {
          replace: true,
          state: { switchProjectSuccess: true, projectName: projectNameNext },
        })
        return
      }
    } catch (err) {
      setSwitchError(err.response?.data?.error || err.message || 'Failed to switch project')
    } finally {
      setSwitchLoading(false)
    }
  }

  const handlePause = async () => {
    if (!paypalSubscriptionId || !recurringDonationId) return
    setPauseLoading(true)
    setPauseError(null)
    try {
      await suspendRecurringSubscription(paypalSubscriptionId)
      const res = await getRecurringDonationDetails(recurringDonationId)
      setSubscription(res.data?.subscription)
      setPaypalMeta({
        reachable: res.data?.paypalReachable === true,
        errorCode: res.data?.paypalErrorCode ?? null,
        subscriptionStatus: res.data?.paypalSubscriptionStatus ?? null,
      })
    } catch (err) {
      setPauseError(err.response?.data?.error || err.message || 'Failed to pause')
    } finally {
      setPauseLoading(false)
    }
  }

  const handleResume = async () => {
    if (!paypalSubscriptionId || !recurringDonationId) return
    setResumeLoading(true)
    setResumeError(null)
    try {
      await resumeRecurringSubscription(paypalSubscriptionId)
      const res = await getRecurringDonationDetails(recurringDonationId)
      setSubscription(res.data?.subscription)
    } catch (err) {
      setResumeError(err.response?.data?.error || err.message || 'Failed to resume')
    } finally {
      setResumeLoading(false)
    }
  }

  const handleCancelClick = () => {
    setCancelError(null)
    setCancelDialogOpen(true)
  }
  const handleCancelDialogClose = () => {
    if (!cancelLoading) {
      setCancelDialogOpen(false)
    }
  }
  const handleCancelConfirm = async () => {
    if (!paypalSubscriptionId) return
    setCancelLoading(true)
    try {
      await cancelSubscription(paypalSubscriptionId, cancelReason || undefined)
      setCancelDialogOpen(false)
      navigate('/impact')
    } catch (err) {
      setCancelError(err.response?.data?.error || err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  useEffect(() => {
    if (cancelDialogOpen) setCancelError(null)
  }, [cancelDialogOpen])

  useEffect(() => {
    hasShownSwitchSuccess.current = false
  }, [recurringDonationId])

  useEffect(() => {
    if (!subscription || !location.state?.switchProjectSuccess || hasShownSwitchSuccess.current) return
    hasShownSwitchSuccess.current = true
    const name = location.state.projectName || subscription?.projectId?.name || 'the selected project'
    setSwitchSuccessSnackbar(`Your recurring donation is now going to ${name}.`)
  }, [subscription, location.state])

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: colors.primary.main }} />
        </Box>
      </Container>
    )
  }

  if (error || !subscription) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error || 'Subscription not found'}
        </Alert>
        <Button
          onClick={() => navigate('/impact')}
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: 'none' }}
        >
          Back to Impact
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Snackbar
        open={Boolean(switchSuccessSnackbar)}
        autoHideDuration={6000}
        onClose={() => setSwitchSuccessSnackbar(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSwitchSuccessSnackbar(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {switchSuccessSnackbar}
        </Alert>
      </Snackbar>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/impact')}
        sx={{ marginBottom: 2, textTransform: 'none', color: colors.text.secondary }}
      >
        Back to Impact
      </Button>

      {paypalMeta?.reachable && paypalMeta.subscriptionStatus === 'APPROVAL_PENDING' && (
        <Alert severity="info" sx={{ marginBottom: 2 }}>
          PayPal still shows this subscription as approval pending. Finish or cancel the subscription in PayPal before
          pause or delete will work there; you can still use &quot;Mark paused/cancelled in app only&quot; if needed.
        </Alert>
      )}

      {paypalMeta && !paypalMeta.reachable && (
        <Alert severity="warning" sx={{ marginBottom: 2 }}>
          {paypalMeta.errorCode === 'PAYPAL_SUBSCRIPTION_NOT_FOUND' && (
            <>
              PayPal does not recognize this subscription with the server&apos;s API credentials. Pause, resume, and
              delete may fail until you use the same PayPal Developer app (Client ID and Secret) that created this
              subscription. You can still update the status in this app only using the options below if PayPal keeps
              failing.
            </>
          )}
          {paypalMeta.errorCode === 'PAYPAL_REQUEST_FAILED' && (
            <>Could not load this subscription from PayPal. Try again later or check server configuration.</>
          )}
          {paypalMeta.errorCode === 'NO_PAYPAL_SUBSCRIPTION_ID' && (
            <>This recurring donation has no PayPal subscription id on file.</>
          )}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: `1px solid ${colors.background.section}`,
          marginBottom: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2 }}>
          <AutorenewIcon sx={{ color: colors.primary.main }} />
          <Typography variant="h5" fontWeight={600}>
            Manage recurring donation
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ color: colors.text.secondary, marginBottom: 2 }}>
          <strong>{projectName}</strong> — {formatCurrency(subscription.amount, subscription.currency)} per{' '}
          {getIntervalLabel(subscription.interval)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginBottom: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Started:</strong> {formatDate(subscription.startDate)}
          </Typography>
          {isActive && subscription.nextChargeDate && (
            <Typography variant="body2" color="text.secondary">
              <strong>Next charge:</strong> {formatDate(subscription.nextChargeDate)}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            <strong>Status:</strong> {subscription.status}
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={() => currentProjectId && navigate(`/donation-campaigns/${currentProjectId}`)}
          sx={{ textTransform: 'none', color: colors.primary.main }}
        >
          View project
        </Button>
      </Paper>

      {isActive && (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${colors.background.section}`,
              marginBottom: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ marginBottom: 2 }}>
              Switch project
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
              Point this subscription at a different campaign. Billing continues on the same schedule with PayPal.
            </Typography>
            {switchError && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {switchError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
              <TextField
                select
                label="Select project"
                value={switchProjectId}
                onChange={(e) => setSwitchProjectId(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">— Select —</MenuItem>
                {projects
                  .filter((p) => String(p._id) !== String(currentProjectId))
                  .map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
              </TextField>
              <Button
                variant="outlined"
                disabled={!switchProjectId || switchLoading}
                onClick={handleSwitchProject}
                sx={{ textTransform: 'none' }}
              >
                {switchLoading ? 'Switching…' : 'Switch to this project'}
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${colors.background.section}`,
              marginBottom: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ marginBottom: 2 }}>
              Pause donation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
              Temporarily stop future charges in PayPal. You can resume anytime. Past donations stay on your impact
              history.
            </Typography>
            {pauseError && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {pauseError}
              </Alert>
            )}
            <Button
              variant="outlined"
              disabled={pauseLoading}
              onClick={handlePause}
              sx={{ textTransform: 'none' }}
            >
              {pauseLoading ? 'Pausing…' : 'Pause donation'}
            </Button>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${colors.background.section}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ marginBottom: 2 }}>
              Delete donation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
              Stop this recurring donation permanently. You will not be charged again. Your past contributions are
              unchanged.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelClick}
              sx={{ textTransform: 'none' }}
            >
              Delete donation
            </Button>
          </Paper>
        </>
      )}

      {isPaused && (
        <>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${colors.background.section}`,
              marginBottom: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ marginBottom: 2 }}>
              Resume donation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
              Turn billing back on in PayPal. Charges will follow PayPal&apos;s schedule for this subscription.
            </Typography>
            {resumeError && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {resumeError}
              </Alert>
            )}
            <Button
              variant="contained"
              disabled={resumeLoading}
              onClick={handleResume}
              sx={{ backgroundColor: colors.primary.main, textTransform: 'none' }}
            >
              {resumeLoading ? 'Resuming…' : 'Resume donation'}
            </Button>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${colors.background.section}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ marginBottom: 2 }}>
              Delete donation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 2 }}>
              Stop this recurring donation permanently. You will not be charged again. Your past contributions are
              unchanged.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelClick}
              sx={{ textTransform: 'none' }}
            >
              Delete donation
            </Button>
          </Paper>
        </>
      )}

      {!isActive && !isPaused && (
        <Alert severity="info">
          This subscription is no longer active. You can view the details above or start a new recurring donation from a
          project page.
        </Alert>
      )}

      <Dialog open={cancelDialogOpen} onClose={handleCancelDialogClose}>
        <DialogTitle>Delete recurring donation?</DialogTitle>
        <DialogContent>
          {cancelError && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {cancelError}
            </Alert>
          )}
          <DialogContentText>
            Your recurring donation to {projectName} will end. You will not be charged again. Your past donations remain
            in your history.
          </DialogContentText>
          <TextField
            select
            fullWidth
            label="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ marginTop: 2 }}
            size="small"
          >
            <MenuItem value="">— Optional —</MenuItem>
            {CANCEL_REASONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} disabled={cancelLoading}>
            Keep donation
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelConfirm}
            disabled={cancelLoading}
          >
            {cancelLoading ? 'Deleting…' : 'Yes, delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
