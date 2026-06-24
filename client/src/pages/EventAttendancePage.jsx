import { Container } from "@mui/material"
import EventAttendancePanel from "../components/EventAttendancePanel.jsx"

/** Optional direct URL for any signed-in user (e.g. staff); volunteers use Volunteer Dashboard + QR. */
export default function EventAttendancePage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <EventAttendancePanel />
    </Container>
  )
}
