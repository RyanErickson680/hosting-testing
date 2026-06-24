import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Avatar,
  LinearProgress,
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SearchIcon from "@mui/icons-material/Search";
import YardIcon from "@mui/icons-material/Yard";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { getUserEventRegistrations, cancelEventRegistration, resolveAttendanceToken } from "../api/event";
import { getMyFeedback } from "../api/feedback";
import EventAttendancePanel from "../components/EventAttendancePanel.jsx";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CARD_GRADIENTS = [
  'linear-gradient(145deg, #1b4332 0%, #2d6a4f 100%)',
  'linear-gradient(145deg, #2c5f2e 0%, #4a7c3f 100%)',
  'linear-gradient(145deg, #344e41 0%, #3a5a40 100%)',
  'linear-gradient(145deg, #5c3d2e 0%, #7a5649 100%)',
]
const getGradient = (name = '') =>
  CARD_GRADIENTS[(name.charCodeAt(0) || 0) % CARD_GRADIENTS.length]

const generateCalendarDays = (month, year, eventDateSet) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === new Date().toDateString();
    const isPast = date < new Date() && !isToday;
    days.push({ day, date, isToday, isPast, hasEvent: eventDateSet.has(date.toDateString()) });
  }
  return days;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function VolunteerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFeedbackLoading(true);
        setError(null);
        const [regRes, fbRes] = await Promise.allSettled([
          getUserEventRegistrations({ limit: 200 }),
          getMyFeedback(),
        ]);
        setRegistrations(regRes.status === 'fulfilled' ? regRes.value.data?.registrations || [] : []);
        setFeedback(fbRes.status === 'fulfilled' ? fbRes.value.data?.feedback || [] : []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load volunteering data");
      } finally {
        setLoading(false);
        setFeedbackLoading(false);
      }
    };
    if (isAuthenticated && user?._id) fetchData();
    else { setLoading(false); setFeedbackLoading(false); }
  }, [isAuthenticated, user?._id]);

  /** Legacy QR links pointed here with ?t= — send volunteers straight to the event attendance form. */
  useEffect(() => {
    if (!isAuthenticated || isLoading || loading) return;
    const raw = searchParams.get("t") || searchParams.get("token");
    const t = raw?.trim();
    if (!t) return;
    let cancelled = false;
    resolveAttendanceToken(t)
      .then((res) => {
        if (cancelled) return;
        const id = res.data?.eventId;
        if (!id) return;
        navigate(
          `/event-attendance/check-in/${encodeURIComponent(String(id))}?t=${encodeURIComponent(t)}`,
          { replace: true }
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || "Could not open attendance link from QR code.");
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, loading, searchParams, navigate]);

  const refetchRegistrations = useCallback(async () => {
    try {
      const res = await getUserEventRegistrations({ limit: 200 });
      setRegistrations(res.data?.registrations || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isAuthenticated && user?._id) {
        refetchRegistrations();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAuthenticated, user?._id, refetchRegistrations]);

  const eventDateSet = new Set(
    registrations
      .map((r) => r.eventDate)
      .filter(Boolean)
      .map((d) => new Date(d).toDateString())
  );
  const calendarDays = generateCalendarDays(currentMonth, currentYear, eventDateSet);
  const now = new Date();
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingRegistrations = registrations.filter((r) => {
    if (r.signedOutAt) return false;
    if (!r.eventDate) return false;
    return new Date(r.eventDate).toISOString().slice(0, 10) >= todayStr;
  });
  const pastRegistrations = registrations.filter((r) => r.isPast);
  const sortedUpcoming = [...upcomingRegistrations].sort(
    (a, b) => new Date(a.eventDate) - new Date(b.eventDate)
  );

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
      else setCurrentMonth(currentMonth - 1);
    } else {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
      else setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCancel = async (eventId, registrationId) => {
    try {
      setCancellingId(registrationId);
      await cancelEventRegistration({ id: eventId });
      setRegistrations((current) =>
        current.filter((registration) => registration._id !== registrationId)
      );
      setError(null);
      try {
        const res = await getUserEventRegistrations({ limit: 200 });
        setRegistrations(res.data?.registrations || []);
      } catch (refreshErr) {
        setError(
          refreshErr.response?.data?.error ||
            "Registration cancelled, but failed to refresh your dashboard"
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel registration");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: colors.primary.main }} />
      </Container>
    );
  }

  if (!isAuthenticated || !user?.volunteerProfile) return <Navigate to="/" replace />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "0.75rem" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left main column ── */}
        <Grid item xs={12} lg={8}>
          {/* Hero banner */}
          <Box
            sx={{
              borderRadius: "1.5rem",
              backgroundColor: colors.primary.dark,
              p: { xs: 3, sm: 4 },
              mb: 3,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: 3,
              minHeight: 210,
            }}
          >
            {/* Content */}
            <Box sx={{ flex: 1, zIndex: 1 }}>
              <Chip
                label="VOLUNTEER PORTAL"
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.9)",
                  fontFamily: "Manrope, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  mb: 2,
                  borderRadius: "999px",
                  height: 22,
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.15,
                  mb: 1.5,
                }}
              >
                Welcome back, {user?.firstName || "Volunteer"}!
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "0.875rem",
                  mb: 3,
                  maxWidth: 360,
                  lineHeight: 1.6,
                }}
              >
                Your dedication helps power our urban farm. The community thanks you.
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/impact")}
                  sx={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.5)",
                    borderRadius: "0.5rem",
                    textTransform: "none",
                    fontWeight: 600,
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "0.875rem",
                    "&:hover": { borderColor: "#ffffff", backgroundColor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  View Impact Report
                </Button>
                <Button
                  onClick={() => navigate("/volunteer-opportunities")}
                  sx={{
                    backgroundColor: "rgba(0,0,0,0.28)",
                    color: "#ffffff",
                    borderRadius: "0.5rem",
                    textTransform: "none",
                    fontWeight: 600,
                    fontFamily: "Manrope, sans-serif",
                    fontSize: "0.875rem",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.4)" },
                  }}
                >
                  Explore Tasks
                </Button>
              </Box>
            </Box>

            {/* Farm image */}
            <Box
              sx={{
                width: { sm: 190, md: 220 },
                height: 170,
                borderRadius: "1rem",
                overflow: "hidden",
                flexShrink: 0,
                display: { xs: "none", sm: "block" },
                background: "url(https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=440&h=340&fit=crop) center/cover no-repeat",
              }}
            />
          </Box>

          {/* Stats row */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "1.25rem",
                  backgroundColor: colors.background.paper,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(27, 94, 32, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUpIcon sx={{ color: colors.primary.main, fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: colors.text.secondary,
                      textTransform: "uppercase",
                      mb: 0.25,
                    }}
                  >
                    Upcoming
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      color: colors.text.primary,
                    }}
                  >
                    {String(upcomingRegistrations.length).padStart(2, "0")}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "1.25rem",
                  backgroundColor: colors.background.paper,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "0.75rem",
                    backgroundColor: "#fce4ec",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <EmojiEventsIcon sx={{ color: "#c62828", fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: colors.text.secondary,
                      textTransform: "uppercase",
                      mb: 0.25,
                    }}
                  >
                    Completed
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      color: colors.text.primary,
                    }}
                  >
                    {String(pastRegistrations.length).padStart(2, "0")}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Event attendance (QR sign-in / sign-out) */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: "1.25rem",
              backgroundColor: colors.background.paper,
              p: { xs: 2.5, sm: 3 },
              mb: 3,
            }}
          >
            <EventAttendancePanel
              embedded
              registrationsProp={registrations}
              parentLoading={loading}
              onAttendanceChange={refetchRegistrations}
            />
          </Paper>

          {/* Upcoming commitments */}
          {sortedUpcoming.length > 0 && (
            <Stack spacing={2} sx={{ mb: 3 }}>
              {sortedUpcoming.map((r) => (
                <Paper
                  key={r._id}
                  elevation={0}
                  sx={{
                    borderRadius: "1.25rem",
                    backgroundColor: colors.background.paper,
                    p: 2.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "0.75rem",
                      background: getGradient(r.eventName || ""),
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: "0.95rem", color: colors.text.primary }}>
                      {r.eventName || "Event"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                      {new Date(r.eventDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {r.eventEndTime ? ` · ends ${r.eventEndTime}` : ""}
                      {r.eventLocation ? ` · ${r.eventLocation}` : ""}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    disabled={cancellingId === r._id}
                    onClick={() => handleCancel(r.eventId, r._id)}
                    sx={{
                      textTransform: "none",
                      color: colors.text.secondary,
                      fontSize: "0.78rem",
                      fontFamily: "Manrope, sans-serif",
                      borderRadius: "0.5rem",
                      flexShrink: 0,
                      "&:hover": { backgroundColor: colors.background.section },
                    }}
                  >
                    {cancellingId === r._id ? "Cancelling…" : "Cancel"}
                  </Button>
                </Paper>
              ))}
            </Stack>
          )}

          {/* "Grow your impact" empty state */}
          {upcomingRegistrations.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: "1.25rem",
                backgroundColor: colors.background.section,
                p: 5,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: colors.background.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 0.5,
                }}
              >
                <YardIcon sx={{ fontSize: 28, color: colors.primary.main }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: colors.text.primary,
                }}
              >
                Grow your impact
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.text.secondary, maxWidth: 300, lineHeight: 1.6 }}
              >
                You don't have any commitments scheduled yet. Every hour counts towards a greener neighborhood.
              </Typography>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => navigate("/volunteer-opportunities")}
                sx={{
                  mt: 1,
                  background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
                  borderRadius: "999px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontFamily: "Manrope, sans-serif",
                  boxShadow: "none",
                  "&:hover": {
                    background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
                    boxShadow: "0px 6px 20px rgba(27, 94, 32, 0.2)",
                  },
                }}
              >
                Browse New Opportunities
              </Button>
            </Paper>
          )}
          {/* Feedback from staff */}
          {!feedbackLoading && (
            <Paper
              elevation={0}
              sx={{ borderRadius: "1.25rem", backgroundColor: colors.background.paper, p: 3, mt: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(27, 94, 32, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FeedbackIcon sx={{ fontSize: 20, color: colors.primary.main }} />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: "1rem", color: colors.text.primary, lineHeight: 1.2 }}>
                    Feedback from Staff
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.text.secondary, fontFamily: "Manrope, sans-serif" }}>
                    Notes and recognition sent to you
                  </Typography>
                </Box>
              </Box>

              {feedback.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="body2" sx={{ color: colors.text.secondary, fontFamily: "Manrope, sans-serif" }}>
                    No feedback yet — check back after your first event!
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {feedback.map((item) => {
                    const categoryMap = {
                      thank_you: { label: "Thank You", bg: "#acf4a4", color: "#0c5216" },
                      suggestion: { label: "Suggestion", bg: "#fff3e0", color: "#e65100" },
                      concern: { label: "Concern", bg: "#ffdad6", color: "#93000a" },
                      general: { label: "General", bg: "#e5e9e6", color: "#41493e" },
                    };
                    const cat = categoryMap[item.category] || categoryMap.general;
                    const sender = item.senderUserId;
                    const senderName = sender
                      ? [sender.firstName, sender.lastName].filter(Boolean).join(" ")
                      : "Staff";
                    return (
                      <Box
                        key={item._id}
                        sx={{
                          p: 2.5,
                          borderRadius: "1rem",
                          backgroundColor: colors.background.section,
                          position: "relative",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Box
                            sx={{
                              px: 1.25,
                              py: 0.3,
                              borderRadius: "999px",
                              backgroundColor: cat.bg,
                              color: cat.color,
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              fontFamily: "Manrope, sans-serif",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                            }}
                          >
                            {cat.label}
                          </Box>
                          <Typography variant="caption" sx={{ color: colors.text.secondary, fontFamily: "Manrope, sans-serif" }}>
                            {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{ fontSize: "0.875rem", color: colors.text.primary, fontFamily: "Manrope, sans-serif", lineHeight: 1.6 }}
                        >
                          {item.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, fontFamily: "Manrope, sans-serif", mt: 1, display: "block" }}>
                          — {senderName}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          )}
        </Grid>

        {/* ── Right sidebar ── */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Calendar */}
            <Paper elevation={0} sx={{ borderRadius: "1.25rem", backgroundColor: colors.background.paper, p: 3 }}>
              {/* Month header */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: colors.text.primary,
                  }}
                >
                  {monthNames[currentMonth]} {currentYear}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <IconButton size="small" onClick={() => navigateMonth("prev")} sx={{ color: colors.text.secondary }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => navigateMonth("next")} sx={{ color: colors.text.secondary }}>
                    <ChevronRightIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Weekday labels */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
                {weekDays.map((d) => (
                  <Typography
                    key={d}
                    sx={{
                      textAlign: "center",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: colors.text.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      py: 0.5,
                    }}
                  >
                    {d.slice(0, 3)}
                  </Typography>
                ))}
              </Box>

              {/* Day grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                {calendarDays.map((day, i) => (
                  <Box
                    key={i}
                    onClick={() => day && setSelectedDate(day.date)}
                    sx={{
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: day?.isToday ? 700 : 500,
                      cursor: day && !day.isPast ? "pointer" : "default",
                      opacity: day?.isPast ? 0.4 : 1,
                      color: day?.isToday
                        ? "#ffffff"
                        : selectedDate?.toDateString() === day?.date?.toDateString()
                        ? colors.primary.main
                        : colors.text.primary,
                      backgroundColor: day?.isToday
                        ? colors.primary.main
                        : selectedDate?.toDateString() === day?.date?.toDateString()
                        ? "rgba(27, 94, 32, 0.1)"
                        : "transparent",
                      position: "relative",
                      "&:hover": {
                        backgroundColor: day && !day.isPast && !day.isToday
                          ? "rgba(27, 94, 32, 0.07)"
                          : undefined,
                      },
                    }}
                  >
                    {day?.day}
                    {day?.hasEvent && !day.isToday && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 3,
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          backgroundColor: colors.primary.main,
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>

              {/* Events for selected / upcoming */}
              <Box sx={{ mt: 2.5 }}>
                {(selectedDate
                  ? registrations.filter(
                      (r) => r.eventDate && new Date(r.eventDate).toDateString() === selectedDate.toDateString()
                    )
                  : sortedUpcoming.slice(0, 3)
                ).map((r) => (
                  <Box
                    key={r._id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      py: 0.75,
                    }}
                  >
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: colors.primary.main,
                        flexShrink: 0,
                        mt: "6px",
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: colors.text.primary, lineHeight: 1.3 }}>
                        {r.eventName || "Event"}
                      </Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: colors.text.secondary }}>
                        {new Date(r.eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {!selectedDate && sortedUpcoming.length === 0 && (
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                    No upcoming events
                  </Typography>
                )}
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
