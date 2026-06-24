import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material"
import EventAvailableIcon from "@mui/icons-material/EventAvailable"
import LoginIcon from "@mui/icons-material/Login"
import LogoutIcon from "@mui/icons-material/Logout"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { colors } from "../theme/colors"
import {
  getUserEventRegistrations,
  resolveAttendanceToken,
} from "../api/event"

function formatWhen(d) {
  if (!d) return "—"
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * @param {object} props
 * @param {boolean} [props.embedded] - When true, omit outer Container and use compact spacing (e.g. volunteer dashboard).
 * @param {() => void} [props.onAttendanceChange] - Called after successful sign-in/out so parent can refresh its data.
 * @param {Array} [props.registrationsProp] - When set (e.g. from VolunteerDashboard), skip duplicate fetch and use parent data.
 * @param {boolean} [props.parentLoading] - Loading state when using registrationsProp.
 */
export default function EventAttendancePanel({
  embedded = false,
  onAttendanceChange,
  registrationsProp,
  parentLoading,
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusEventId = searchParams.get("event") || searchParams.get("focus")
  const attendanceTokenFromUrl =
    searchParams.get("t") || searchParams.get("token") || ""

  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(() => registrationsProp === undefined)
  const [error, setError] = useState(null)
  const [notesByEvent, setNotesByEvent] = useState({})
  const [resolvedTokenSummary, setResolvedTokenSummary] = useState(null)
  const [tokenResolveError, setTokenResolveError] = useState(null)
  const [tokenResolveLoading, setTokenResolveLoading] = useState(false)

  const controlled = registrationsProp !== undefined

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getUserEventRegistrations({ limit: 200 })
      setRegistrations(res.data?.registrations || [])
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load your events")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (controlled) return
    load()
  }, [controlled, load])

  const effectiveRegistrations = controlled ? registrationsProp : registrations
  const effectiveLoading = controlled ? Boolean(parentLoading) : loading

  useEffect(() => {
    if (!attendanceTokenFromUrl) {
      setResolvedTokenSummary(null)
      setTokenResolveError(null)
      setTokenResolveLoading(false)
      return
    }
    let cancelled = false
    setTokenResolveLoading(true)
    setTokenResolveError(null)
    resolveAttendanceToken(attendanceTokenFromUrl)
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setResolvedTokenSummary(data)
        if (data.status === "cancelled") {
          setTokenResolveError("This event was cancelled.")
        }
      })
      .catch((err) => {
        if (cancelled) return
        setResolvedTokenSummary(null)
        setTokenResolveError(err.response?.data?.error || "Invalid attendance link")
      })
      .finally(() => {
        if (!cancelled) setTokenResolveLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attendanceTokenFromUrl])

  /** QR on `/event-attendance?t=` opens here — registered users go straight to the check-in form. */
  useEffect(() => {
    const raw = attendanceTokenFromUrl?.trim()
    if (!raw || tokenResolveLoading || !resolvedTokenSummary || resolvedTokenSummary.status === "cancelled") return
    const eventId = resolvedTokenSummary.eventId
    if (!eventId) return
    const registered = effectiveRegistrations.some((r) => String(r.eventId) === String(eventId))
    if (!registered) return
    navigate(
      `/event-attendance/check-in/${encodeURIComponent(String(eventId))}?t=${encodeURIComponent(raw)}`,
      { replace: true }
    )
  }, [
    attendanceTokenFromUrl,
    tokenResolveLoading,
    resolvedTokenSummary,
    effectiveRegistrations,
    navigate,
  ])

  const actionableRaw = useMemo(() => {
    const now = new Date()
    return effectiveRegistrations.filter((r) => {
      if (!r.eventId || r.signedOutAt) return false
      if (r.signedInAt) return true
      if (!r.eventDate) return false
      const eventStart = new Date(r.eventDate)
      if (Number.isNaN(eventStart.getTime())) return false
      // Keep attendance available once the event start time has passed.
      return eventStart <= now
    })
  }, [effectiveRegistrations])

  const needsScanQr = !attendanceTokenFromUrl && actionableRaw.length > 0

  const notRegisteredForResolved =
    resolvedTokenSummary &&
    !tokenResolveError &&
    !effectiveRegistrations.some((r) => String(r.eventId) === String(resolvedTokenSummary.eventId))

  const actionable = useMemo(() => {
    if (needsScanQr) return []
    if (!attendanceTokenFromUrl) return actionableRaw
    if (tokenResolveLoading || !resolvedTokenSummary) return []
    if (resolvedTokenSummary.status === "cancelled") return []
    return actionableRaw.filter((r) => String(r.eventId) === String(resolvedTokenSummary.eventId))
  }, [actionableRaw, attendanceTokenFromUrl, needsScanQr, tokenResolveLoading, resolvedTokenSummary])

  const completed = useMemo(() => {
    return effectiveRegistrations.filter((r) => r.signedOutAt)
  }, [effectiveRegistrations])

  useEffect(() => {
    if (!focusEventId || effectiveLoading) return
    const id = String(focusEventId)
    requestAnimationFrame(() => {
      document.querySelector(`[data-event-card="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    })
  }, [focusEventId, effectiveLoading, actionable])

  const handleCheckIn = async (eventId) => {
    const notes = notesByEvent[eventId] || ""
    const query = new URLSearchParams()
    if (attendanceTokenFromUrl) query.set("t", attendanceTokenFromUrl)
    if (notes) query.set("notes", notes)
    navigate(`/event-attendance/check-in/${encodeURIComponent(String(eventId))}?${query.toString()}`)
  }

  const handleCheckOut = async (eventId) => {
    const query = new URLSearchParams()
    if (attendanceTokenFromUrl) query.set("t", attendanceTokenFromUrl)
    navigate(`/event-attendance/check-in/${encodeURIComponent(String(eventId))}?${query.toString()}`)
  }

  if (effectiveLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: embedded ? 3 : 8 }}>
        <CircularProgress sx={{ color: colors.primary.main }} />
      </Box>
    )
  }

  return (
    <Box id={embedded ? "volunteer-attendance" : undefined}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "rgba(27, 94, 32, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EventAvailableIcon sx={{ color: colors.primary.main }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: "1.5rem",
                color: colors.text.primary,
              }}
            >
              Event attendance
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              Scan the on-site QR code to open your event attendance form (with the link already filled in).
              Sign in when you arrive and sign out when you leave — volunteer hours are credited when you sign out.
              Staff receive an email after sign-out with your times.
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tokenResolveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTokenResolveError(null)}>
          {tokenResolveError}
        </Alert>
      )}

      {needsScanQr && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Scan the QR code at the event. It opens the attendance form for that event so you can sign in and later sign out.
        </Alert>
      )}

      {notRegisteredForResolved && !tokenResolveError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This attendance link is for &quot;{resolvedTokenSummary?.name || "an event"}&quot;, but you
          are not registered for it.
        </Alert>
      )}

      {attendanceTokenFromUrl && tokenResolveLoading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CircularProgress size={22} sx={{ color: colors.primary.main }} />
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Verifying attendance link…
          </Typography>
        </Box>
      )}

      <Typography sx={{ fontWeight: 700, mb: 1.5, color: colors.text.primary }}>
        Your registered events
      </Typography>

      {effectiveRegistrations.length === 0 && (
        <Card elevation={0} sx={{ borderRadius: "1rem", backgroundColor: colors.background.paper, p: 3 }}>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            You do not have any event registrations yet. Browse volunteer opportunities and register
            first, then return here on the day of the event.
          </Typography>
          <Button
            sx={{ mt: 2, textTransform: "none", fontWeight: 600 }}
            variant="contained"
            onClick={() => navigate("/volunteer-opportunities")}
          >
            Browse opportunities
          </Button>
        </Card>
      )}

      {effectiveRegistrations.length > 0 &&
        actionable.length === 0 &&
        completed.length === 0 &&
        !needsScanQr &&
        !notRegisteredForResolved &&
        !tokenResolveLoading &&
        !tokenResolveError && (
          <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
            Nothing to show right now. After the event start time, registered events appear here; use the venue QR code to open the attendance form, or open your next commitment card and tap Sign in / Sign out.
          </Typography>
        )}

      <Stack spacing={2}>
        {actionable.map((r) => {
          const eventId = r.eventId
          const isFocused = focusEventId && String(eventId) === String(focusEventId)
          const checkedIn = Boolean(r.signedInAt)

          return (
            <Card
              key={r._id}
              data-event-card={String(eventId)}
              elevation={0}
              sx={{
                borderRadius: "1rem",
                border: isFocused ? `2px solid ${colors.primary.main}` : "1px solid transparent",
                backgroundColor: colors.background.paper,
                boxShadow: isFocused ? "0 8px 28px rgba(27, 94, 32, 0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                        {r.eventName || "Event"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {r.eventDate ? formatWhen(r.eventDate) : ""}
                        {r.eventLocation ? ` · ${r.eventLocation}` : ""}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={checkedIn ? "On site" : "Not signed in"}
                      color={checkedIn ? "success" : "default"}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {!checkedIn && (
                    <>
                      <TextField
                        label="Optional note for staff (e.g. accessibility, parking)"
                        multiline
                        minRows={2}
                        fullWidth
                        value={notesByEvent[eventId] || ""}
                        onChange={(e) =>
                          setNotesByEvent((prev) => ({ ...prev, [eventId]: e.target.value }))
                        }
                        inputProps={{ maxLength: 2000 }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<LoginIcon />}
                        onClick={() => handleCheckIn(eventId)}
                        sx={{
                          alignSelf: "flex-start",
                          textTransform: "none",
                          fontWeight: 600,
                          borderRadius: "0.5rem",
                          background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
                          boxShadow: "none",
                        }}
                      >
                        Sign in (I have arrived)
                      </Button>
                    </>
                  )}

                  {checkedIn && !r.signedOutAt && (
                    <>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        Signed in at {formatWhen(r.signedInAt)}
                        {r.attendanceNotes ? (
                          <>
                            <br />
                            <strong>Your note:</strong> {r.attendanceNotes}
                          </>
                        ) : null}
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<LogoutIcon />}
                        onClick={() => handleCheckOut(eventId)}
                        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600, borderRadius: "0.5rem" }}
                      >
                        Sign out (I am leaving)
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Stack>

      {completed.length > 0 && (
        <>
          <Typography sx={{ fontWeight: 700, mt: 4, mb: 1.5, color: colors.text.primary }}>
            Completed attendance
          </Typography>
          <Stack spacing={1.5}>
            {completed.slice(0, 15).map((r) => (
              <Card
                key={`done-${r._id}`}
                elevation={0}
                sx={{ borderRadius: "1rem", backgroundColor: colors.background.section, p: 2 }}
              >
                <Typography sx={{ fontWeight: 600 }}>{r.eventName}</Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary, display: "block" }}>
                  In: {formatWhen(r.signedInAt)} · Out: {formatWhen(r.signedOutAt)}
                  {typeof r.hoursCredited === "number" && r.hoursCredited > 0
                    ? ` · ${r.hoursCredited} hr${r.hoursCredited !== 1 ? "s" : ""} credited`
                    : ""}
                </Typography>
              </Card>
            ))}
          </Stack>
        </>
      )}
    </Box>
  )
}
