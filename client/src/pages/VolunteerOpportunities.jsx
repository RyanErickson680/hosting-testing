import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
} from '@mui/material'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import { colors } from '../theme/colors'
import {
  getEvents,
  registerForEvent,
  getUserEventRegistrations,
  createPaidEventOrder,
  capturePaidEventOrder,
} from '../api/event'
import { useAuth } from '../context/AuthContext'
import { requestAccountWaiverEmail } from '../api/auth'
import EventCard from '../components/EventCard'

const PAGE_SIZE = 9

export default function VolunteerOpportunities() {
  const navigate = useNavigate()
  const { isAuthenticated, user, checkAuth } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set())
  const [registeringEventId, setRegisteringEventId] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [paidCheckoutEvent, setPaidCheckoutEvent] = useState(null)
  const [paidCheckoutError, setPaidCheckoutError] = useState('')
  const [paidCheckoutProcessing, setPaidCheckoutProcessing] = useState(false)
  const [subtab, setSubtab] = useState('volunteering') // volunteering | regular | paid | past
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [searchInput, setSearchInput] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [waiverDialogEvent, setWaiverDialogEvent] = useState(null)
  const [waiverEmailSending, setWaiverEmailSending] = useState(false)
  const searchTimeoutRef = useRef(null)
  const [{ isPending: isPayPalLoading }] = usePayPalScriptReducer()

  const SUBTAB_LABELS = {
    volunteering: 'Volunteering',
    regular: 'Regular Events',
    paid: 'Paid Events',
    past: 'Past Events',
  }

  const getEventEndDateTime = (event) => {
    if (!event?.date) return null
    const start = new Date(event.date)
    if (event?.endTime) {
      const [hours, minutes] = String(event.endTime).split(':').map((v) => parseInt(v, 10))
      if (Number.isInteger(hours) && Number.isInteger(minutes)) {
        const end = new Date(start)
        end.setHours(hours, minutes, 0, 0)
        return end
      }
    }
    if (event?.endDate) return new Date(event.endDate)
    return start
  }

  const isPastEvent = (event) => {
    if (event.status === 'completed' || event.status === 'cancelled') return true
    const end = getEventEndDateTime(event)
    return !!end && end <= new Date()
  }

  const isRegistrationClosed = (event) => {
    if (!event?.date) return false
    const start = new Date(event.date)
    if (Number.isNaN(start.getTime())) return false
    const cutoff = new Date(start.getTime() + 15 * 60 * 1000)
    return new Date() >= cutoff
  }

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (subtab !== 'past') {
        params.eventType = subtab
      }

      const response = await getEvents(params)
      let fetchedEvents = response.data.events || []

      const eventTypeMap = { volunteering: 'volunteering', regular: 'regular', paid: 'paid' }
      if (subtab === 'past') {
        fetchedEvents = fetchedEvents.filter((event) => isPastEvent(event))
      } else {
        fetchedEvents = fetchedEvents.filter((event) => {
          const type = event.eventType || 'volunteering'
          if (isPastEvent(event)) return false
          return type === eventTypeMap[subtab]
        })
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        fetchedEvents = fetchedEvents.filter(
          (event) =>
            event.name?.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower) ||
            event.location?.toLowerCase().includes(searchLower) ||
            event.skillsNeeded?.some((s) => s.toLowerCase().includes(searchLower))
        )
      }

      setEvents(fetchedEvents)
      setVisibleCount(PAGE_SIZE)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRegistrations = async () => {
    if (!isAuthenticated) return
    try {
      const response = await getUserEventRegistrations({ limit: 100 })
      const registrations = response.data.registrations || []
      const ids = new Set(registrations.map((r) => r.eventId))
      setRegisteredEventIds(ids)
    } catch {
      // Non-critical — don't block the page
    }
  }

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 250)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [searchInput])

  // Fetch events when filters or subtab change
  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.search, subtab])

  // Refresh auth user data on mount so role and waiverSigned are always current
  // (handles the case where the waiver was signed externally).
  useEffect(() => {
    if (isAuthenticated) checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch user registrations on mount / auth change
  useEffect(() => {
    fetchUserRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const handleSignUp = async (event) => {
    if (!isAuthenticated) { navigate('/login'); return }

    if (!user?.volunteerProfile) {
      setSnackbar({ open: true, message: 'Only users with a volunteer profile can sign up for events.', severity: 'error' })
      return
    }

    if (event.waiverRequired && !user?.volunteerProfile?.waiverSigned) {
      setWaiverDialogEvent(event)
      return
    }

    if (event.eventType === 'paid') {
      setPaidCheckoutEvent(event)
      setPaidCheckoutError('')
      return
    }

    setRegisteringEventId(event._id)
    try {
      await registerForEvent({ id: event._id })
      setRegisteredEventIds((prev) => new Set([...prev, event._id]))
      setSnackbar({
        open: true,
        message: `You're signed up for "${event.name}"!`,
        severity: 'success',
      })
      fetchEvents()
    } catch (err) {
      const code = err.response?.data?.code
      const message =
        code === 'ACCOUNT_WAIVER_REQUIRED'
          ? err.response?.data?.error ||
            'Sign the volunteer waiver first, then try signing up again. You can request a signing link from the waiver prompt on this page.'
          : err.response?.data?.error || 'Failed to sign up. Please try again.'
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setRegisteringEventId(null)
    }
  }

  const handleClosePaidCheckout = () => {
    if (paidCheckoutProcessing) return
    setPaidCheckoutEvent(null)
    setPaidCheckoutError('')
  }

  const createPaidOrder = async () => {
    if (!paidCheckoutEvent?._id) throw new Error('No event selected for checkout')
    try {
      const response = await createPaidEventOrder({ id: paidCheckoutEvent._id })
      return response.data.orderId
    } catch (err) {
      const code = err.response?.data?.code
      const msg =
        code === 'ACCOUNT_WAIVER_REQUIRED'
          ? err.response?.data?.error ||
            'Sign the volunteer waiver first. Request a signing link from the waiver prompt when you try to register for a waiver-required event.'
          : err.response?.data?.error || 'Could not start payment.'
      setPaidCheckoutError(msg)
      setSnackbar({ open: true, message: msg, severity: 'error' })
      throw err
    }
  }

  const onApprovePaidOrder = async (data) => {
    if (!paidCheckoutEvent?._id) throw new Error('No event selected for checkout')
    setPaidCheckoutProcessing(true)
    setPaidCheckoutError('')
    try {
      await capturePaidEventOrder({
        id: paidCheckoutEvent._id,
        orderId: data.orderID,
        payerId: data.payerID,
      })
      setRegisteredEventIds((prev) => new Set([...prev, paidCheckoutEvent._id]))
      setSnackbar({
        open: true,
        message: `Payment completed. You're signed up for "${paidCheckoutEvent.name}"!`,
        severity: 'success',
      })
      setPaidCheckoutEvent(null)
      fetchEvents()
    } catch (err) {
      const code = err.response?.data?.code
      const message =
        code === 'ACCOUNT_WAIVER_REQUIRED'
          ? err.response?.data?.error ||
            'Sign the volunteer waiver first, then complete payment again. You can request a signing link from the waiver prompt on this page.'
          : err.response?.data?.error || 'Failed to complete paid event signup.'
      setPaidCheckoutError(message)
      setSnackbar({ open: true, message, severity: 'error' })
    } finally {
      setPaidCheckoutProcessing(false)
    }
  }

  const onPaidCheckoutError = (err) => {
    setPaidCheckoutError(err?.message || 'PayPal checkout failed. Please try again.')
  }

  const handleSendWaiverEmail = async () => {
    setWaiverEmailSending(true)
    try {
      await requestAccountWaiverEmail()
      setSnackbar({
        open: true,
        message:
          'Check your email for the waiver link. After you sign, try signing up for the event again.',
        severity: 'success',
      })
      setWaiverDialogEvent(null)
      await checkAuth()
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to send waiver email. Please try again.',
        severity: 'error',
      })
    } finally {
      setWaiverEmailSending(false)
    }
  }

  const visibleEvents = events.slice(0, visibleCount)
  const hasMore = visibleCount < events.length

  return (
    <Box sx={{ pb: 8 }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Box sx={{ mb: 6, maxWidth: 600 }}>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: { xs: '2.25rem', md: '3rem' },
            color: colors.primary.dark,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            mb: 2,
          }}
        >
          Volunteer Opportunities
        </Typography>
        <Typography sx={{ fontSize: '1.05rem', color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', lineHeight: 1.7 }}>
          Join our community in nurturing the land. From harvest mornings to tool workshops, find a way to root yourself in our urban oasis.
        </Typography>
      </Box>

      {/* ── Category Tabs ────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          p: 0.75,
          backgroundColor: colors.background.section,
          borderRadius: '1.25rem',
          width: 'fit-content',
          mb: 3,
        }}
      >
        {Object.entries(SUBTAB_LABELS).map(([value, label]) => (
          <Box
            key={value}
            onClick={() => setSubtab(value)}
            sx={{
              px: 3,
              py: 1.25,
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              fontWeight: subtab === value ? 700 : 500,
              color: subtab === value ? '#ffffff' : colors.text.secondary,
              backgroundColor: subtab === value ? colors.primary.dark : 'transparent',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              boxShadow: subtab === value ? '0 2px 8px rgba(0,69,13,0.2)' : 'none',
              '&:hover': {
                backgroundColor: subtab === value ? colors.primary.dark : colors.background.paper,
                color: subtab === value ? '#ffffff' : colors.text.primary,
              },
            }}
          >
            {label}
          </Box>
        ))}
      </Box>

      {/* ── Search Bar ───────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 5,
          p: 3,
          backgroundColor: colors.background.paper,
          borderRadius: '1.25rem',
          boxShadow: '0px 12px 32px rgba(24, 29, 27, 0.04)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextField
          placeholder="Search events by name or activity..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.text.secondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            maxWidth: { sm: '100%', md: 520 },
            '& .MuiOutlinedInput-root': {
              borderRadius: '0.75rem',
              backgroundColor: colors.background.section,
              fontFamily: 'Manrope, sans-serif',
              '& fieldset': { border: 'none' },
            },
            '& input': { fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem' },
          }}
        />
        {!loading && (
          <Typography sx={{ color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 500, flexShrink: 0 }}>
            Showing {Math.min(visibleCount, events.length)} of {events.length} opportunit{events.length !== 1 ? 'ies' : 'y'}
          </Typography>
        )}
      </Box>

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress sx={{ color: colors.primary.main }} />
        </Box>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: '0.75rem' }}>
          {error}
        </Alert>
      )}

      {/* ── Events Grid ──────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, color: colors.text.secondary }}>
              <VolunteerActivismIcon sx={{ fontSize: 56, color: colors.background.section, mb: 2 }} />
              <Typography variant="h6" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, mb: 1 }}>
                No events found
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Manrope, sans-serif' }}>
                {Object.values(filters).some((f) => f)
                  ? 'Try adjusting your search to see more events.'
                  : subtab === 'past'
                    ? 'No past events found yet. Completed events will appear here.'
                    : subtab !== 'volunteering'
                      ? `No ${SUBTAB_LABELS[subtab].toLowerCase()} yet. Check back soon.`
                      : 'No volunteer events are currently available. Check back soon!'}
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 4,
                }}
              >
                {visibleEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    isRegistered={registeredEventIds.has(event._id)}
                    registering={registeringEventId === event._id}
                    onSignUp={handleSignUp}
                    canCurrentUserSignUp={!user || Boolean(user.volunteerProfile)}
                    isPast={subtab === 'past'}
                    registrationClosed={isRegistrationClosed(event)}
                  />
                ))}
              </Box>

              {/* ── Show more ──────────────────────────────────────── */}
              {hasMore && (
                <Box sx={{ mt: 10, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                      color: colors.primary.dark,
                      border: `2px solid rgba(0,69,13,0.12)`,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontFamily: 'Manrope, sans-serif',
                      px: 4,
                      py: 1.5,
                      borderRadius: '0.75rem',
                      '&:hover': { backgroundColor: colors.background.section, borderColor: 'rgba(0,69,13,0.2)' },
                    }}
                  >
                    Show more opportunities
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* ── Snackbar ─────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Paid checkout dialog ─────────────────────────────────── */}
      <Dialog
        open={!!waiverDialogEvent}
        onClose={() => !waiverEmailSending && setWaiverDialogEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 }}>
          Waiver required
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: 'Manrope, sans-serif', color: colors.text.primary, mb: 1.5 }}>
            This event requires a signed volunteer liability waiver before you can register
            {waiverDialogEvent?.name ? ` for “${waiverDialogEvent.name}”` : ''}.
          </Typography>
          <Typography sx={{ fontFamily: 'Manrope, sans-serif', color: colors.text.secondary, fontSize: '0.95rem' }}>
            We can email you a secure link to review and sign the waiver. After you sign, come back here and try signing up again.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setWaiverDialogEvent(null)}
            disabled={waiverEmailSending}
            sx={{ textTransform: 'none', fontFamily: 'Manrope, sans-serif' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendWaiverEmail}
            disabled={waiverEmailSending}
            sx={{
              textTransform: 'none',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 700,
              backgroundColor: colors.primary.dark,
              '&:hover': { backgroundColor: colors.primary.main },
            }}
          >
            {waiverEmailSending ? 'Sending…' : 'Send waiver email'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!paidCheckoutEvent} onClose={handleClosePaidCheckout} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogContent>
          {paidCheckoutEvent && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {paidCheckoutEvent.name}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
                Ticket Price: ${Number(paidCheckoutEvent.cost || 0).toFixed(2)}
              </Typography>
              {paidCheckoutError && <Alert severity="error" sx={{ mb: 2 }}>{paidCheckoutError}</Alert>}
              {(isPayPalLoading || paidCheckoutProcessing) && (
                <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
                  Processing payment...
                </Typography>
              )}
              <PayPalButtons
                forceReRender={[paidCheckoutEvent._id, paidCheckoutEvent.cost]}
                createOrder={createPaidOrder}
                onApprove={onApprovePaidOrder}
                onError={onPaidCheckoutError}
                disabled={paidCheckoutProcessing}
                style={{ layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaidCheckout} disabled={paidCheckoutProcessing}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
