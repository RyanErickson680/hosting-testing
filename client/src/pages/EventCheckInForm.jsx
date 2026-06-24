import { useEffect, useMemo, useRef, useState } from "react"
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material"
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import { colors } from "../theme/colors"
import {
  checkInToEvent,
  checkOutOfEvent,
  getEvent,
  getUserEventRegistrations,
  resolveAttendanceToken,
} from "../api/event"
import { useAuth } from "../context/AuthContext"

function parseAttendanceTokenFromInput(input) {
  const raw = String(input || "").trim()
  if (!raw) return ""

  try {
    const url = new URL(raw)
    return (url.searchParams.get("t") || url.searchParams.get("token") || "").trim()
  } catch {
    return raw
  }
}

function normalizeName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

const STEPS = ["Confirm identity & QR", "Signed in at event", "Signed out — hours credited"]

export default function EventCheckInForm() {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [nameInput, setNameInput] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  const [attendanceNotes, setAttendanceNotes] = useState("")
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingRegistration, setLoadingRegistration] = useState(true)
  const [registration, setRegistration] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [scannerActive, setScannerActive] = useState(false)
  const [verifyingToken, setVerifyingToken] = useState(false)
  const redirectTimerRef = useRef(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanTimerRef = useRef(null)

  const expectedName = useMemo(() => {
    return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
  }, [user])

  const cameraScanningSupported = typeof window !== "undefined" && "BarcodeDetector" in window

  useEffect(() => {
    const t = searchParams.get("t") || searchParams.get("token") || ""
    const notes = searchParams.get("notes") || ""
    if (t) setTokenInput(t)
    if (notes) setAttendanceNotes(notes)
  }, [searchParams])

  useEffect(() => {
    setNameInput(expectedName || "")
  }, [expectedName])

  useEffect(() => {
    let cancelled = false
    async function loadEventDetails() {
      if (!eventId) return
      try {
        setLoadingEvent(true)
        const res = await getEvent({ id: eventId })
        if (!cancelled) setEvent(res.data?.event || null)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || "Failed to load event")
        }
      } finally {
        if (!cancelled) setLoadingEvent(false)
      }
    }
    loadEventDetails()
    return () => {
      cancelled = true
    }
  }, [eventId])

  async function refreshRegistration() {
    if (!eventId) return
    const res = await getUserEventRegistrations({ limit: 200 })
    const match = (res.data?.registrations || []).find((r) => String(r.eventId) === String(eventId))
    setRegistration(match || null)
  }

  useEffect(() => {
    let cancelled = false
    async function loadRegistration() {
      if (!eventId) return
      try {
        setLoadingRegistration(true)
        const res = await getUserEventRegistrations({ limit: 200 })
        if (cancelled) return
        const match = (res.data?.registrations || []).find((r) => String(r.eventId) === String(eventId))
        setRegistration(match || null)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || "Failed to load your registration for this event")
        }
      } finally {
        if (!cancelled) setLoadingRegistration(false)
      }
    }
    loadRegistration()
    return () => {
      cancelled = true
    }
  }, [eventId])

  const stopScanner = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current)
      scanTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setScannerActive(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  const startScanner = async () => {
    if (!cameraScanningSupported) {
      setCameraError("Camera QR scanning is not supported on this browser. Paste the QR link/token instead.")
      return
    }

    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      })

      streamRef.current = stream
      setScannerActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] })
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return

        try {
          const codes = await detector.detect(videoRef.current)
          if (!codes?.length) return
          const rawValue = codes[0]?.rawValue || ""
          const parsed = parseAttendanceTokenFromInput(rawValue)
          if (parsed) {
            setTokenInput(parsed)
            stopScanner()
          }
        } catch {
          // Ignore frame-level scan failures while stream is active.
        }
      }, 500)
    } catch (err) {
      setCameraError(err?.message || "Unable to access camera for QR scanning")
      stopScanner()
    }
  }

  const verifyTokenMatchesEvent = async (token, expectedEventId) => {
    setVerifyingToken(true)
    try {
      const res = await resolveAttendanceToken(token)
      return String(res.data?.eventId || "") === String(expectedEventId || "")
    } catch {
      return false
    } finally {
      setVerifyingToken(false)
    }
  }

  const scheduleReturnToDashboard = () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    redirectTimerRef.current = window.setTimeout(() => {
      navigate("/volunteer-dashboard")
    }, 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedTypedName = normalizeName(nameInput)
    const normalizedExpectedName = normalizeName(expectedName)
    if (!normalizedTypedName) {
      setError("Please enter your full name to confirm attendance.")
      return
    }
    if (!normalizedExpectedName || normalizedTypedName !== normalizedExpectedName) {
      setError("Name does not match your account profile. Please use your account full name.")
      return
    }

    if (!registration) {
      setError("You are not registered for this event.")
      return
    }
    if (registration.signedOutAt) {
      setError("Attendance for this event is already complete.")
      return
    }

    const parsedToken = parseAttendanceTokenFromInput(tokenInput)
    if (!parsedToken) {
      setError("Scan the event QR code (or paste the QR link/token) before continuing.")
      return
    }

    const matchesEvent = await verifyTokenMatchesEvent(parsedToken, eventId)
    if (!matchesEvent) {
      setError("That QR code does not match this event. Please scan the on-site event QR code.")
      return
    }

    try {
      setSubmitting(true)
      if (registration.signedInAt) {
        const res = await checkOutOfEvent({
          id: eventId,
          attendanceToken: parsedToken,
        })
        const updated = res.data?.registration || {}
        await refreshRegistration()
        const outTime = new Date(updated.signedOutAt || new Date()).toLocaleString()
        const hrs = updated.hoursCredited ?? 0
        setSuccess(`Signed out at ${outTime}. Volunteer hours credited: ${hrs}.`)
        scheduleReturnToDashboard()
      } else {
        const res = await checkInToEvent({
          id: eventId,
          attendanceNotes,
          attendanceToken: parsedToken,
        })
        const updated = res.data?.registration || {}
        await refreshRegistration()
        setSuccess(`Signed in at ${new Date(updated.signedInAt || new Date()).toLocaleString()}. Sign out when you leave to record hours.`)
      }
    } catch (err) {
      setError(err.response?.data?.error || "Attendance update failed")
    } finally {
      setSubmitting(false)
    }
  }

  const activeStep = registration?.signedOutAt ? 2 : registration?.signedInAt ? 1 : 0

  const attendanceStepLabel = registration?.signedOutAt
    ? "Complete"
    : registration?.signedInAt
      ? "Signed in — sign out when leaving"
      : "Not signed in yet"

  const formDisabled =
    submitting || loadingEvent || loadingRegistration || Boolean(registration?.signedOutAt)

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        component={RouterLink}
        to="/volunteer-dashboard"
        sx={{ mb: 2, textTransform: "none", fontWeight: 600 }}
      >
        Back to dashboard
      </Button>

      <Paper elevation={0} sx={{ p: 3, borderRadius: "1rem", backgroundColor: colors.background.paper }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", mb: 0.5 }}>Event attendance</Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
          One form per event: confirm your identity, verify the venue QR code, then sign in and sign out to earn volunteer hours.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {loadingEvent ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress sx={{ color: colors.primary.main }} />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mb: 2, color: colors.text.secondary }}>
            Event: <strong>{event?.name || "Unknown event"}</strong>
          </Typography>
        )}
        {loadingRegistration ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={20} sx={{ color: colors.primary.main }} />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mb: 2, color: colors.text.secondary }}>
            Status: <strong>{attendanceStepLabel}</strong>
            {registration?.signedInAt && (
              <>
                {" "}
                · Signed in at {new Date(registration.signedInAt).toLocaleString()}
              </>
            )}
            {registration?.signedOutAt && (
              <>
                {" "}
                · Signed out at {new Date(registration.signedOutAt).toLocaleString()}
              </>
            )}
          </Typography>
        )}

        {!loadingRegistration && !registration && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are not registered for this event.{" "}
            <Button component={RouterLink} to="/volunteer-opportunities" size="small" sx={{ textTransform: "none" }}>
              Browse opportunities
            </Button>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert icon={<CheckCircleOutlineIcon fontSize="inherit" />} severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {cameraError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setCameraError(null)}>
            {cameraError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Full name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
              fullWidth
              disabled={formDisabled || Boolean(registration?.signedInAt)}
              helperText="Must match your account profile name."
            />

            <TextField
              label="QR token / QR link"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              required
              fullWidth
              disabled={formDisabled}
              helperText="From the posted QR code at the event (scan or paste)."
            />

            <TextField
              label="Optional note for staff"
              value={attendanceNotes}
              onChange={(e) => setAttendanceNotes(e.target.value)}
              multiline
              minRows={2}
              disabled={formDisabled || Boolean(registration?.signedInAt)}
              inputProps={{ maxLength: 2000 }}
              helperText={
                registration?.signedInAt ? "Notes were saved at sign-in." : "Only submitted when you sign in."
              }
            />

            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
              <Button
                type="button"
                variant="outlined"
                startIcon={<QrCodeScannerIcon />}
                onClick={scannerActive ? stopScanner : startScanner}
                disabled={formDisabled}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {scannerActive ? "Stop QR scanner" : "Scan QR code"}
              </Button>
              {verifyingToken && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} />
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                    Verifying QR token...
                  </Typography>
                </Box>
              )}
            </Stack>

            {scannerActive && (
              <Box
                sx={{
                  border: "1px solid #dbe7dc",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  backgroundColor: "#000",
                }}
              >
                <video ref={videoRef} style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} muted playsInline />
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={formDisabled || !registration}
              sx={{
                mt: 1,
                textTransform: "none",
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
              }}
            >
              {submitting
                ? registration?.signedInAt
                  ? "Signing out..."
                  : "Signing in..."
                : registration?.signedInAt
                  ? "Confirm sign out (record hours)"
                  : "Confirm sign in"}
            </Button>

            {registration?.signedOutAt && (
              <Stack spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  Returning to your dashboard in a few seconds…
                </Typography>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/volunteer-dashboard")}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Go to dashboard now
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>
      </Paper>
    </Container>
  )
}
