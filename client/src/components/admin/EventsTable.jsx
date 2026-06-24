import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  ButtonBase,
} from '@mui/material'
import Button from '../Button'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import PeopleIcon from '@mui/icons-material/People'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import QrCode2Icon from '@mui/icons-material/QrCode2'

const statusChipColor = (status) => {
  switch (status) {
    case 'open':
      return 'success'
    case 'full':
      return 'warning'
    case 'completed':
      return 'default'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatEventTimeRange = (date, endTime) => {
  if (!date) return 'N/A'
  const start = new Date(date)
  const startTime = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!endTime) return startTime
  return `${startTime} to ${endTime}`
}

export default function EventsTable({
  events,
  loading,
  onRefresh,
  onDeleteEvent,
  onViewEvent,
  onViewAttendance,
  onViewAttendanceQr,
}) {
  return (
    <Box my={2}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h6">
          Events ({events.length} {events.length === 1 ? 'event' : 'events'})
        </Typography>
        <Button
          onClick={onRefresh}
          disabled={loading}
          leftIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Stack>

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Loading...</Typography>
        </Stack>
      )}

      {events.length > 0 ? (
        <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Volunteers</TableCell>
                <TableCell>Skills Needed</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Waiver</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {event.name}
                    </Typography>
                    {event.description && (
                      <Typography variant="caption" color="text.secondary">
                        {event.description.substring(0, 50)}
                        {event.description.length > 50 ? '...' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2">
                        {formatDate(event.date)}
                      </Typography>
                      {(event.date || event.endTime) && (
                        <Typography variant="caption" color="text.secondary">
                          {formatEventTimeRange(event.date, event.endTime)}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      color={statusChipColor(event.status)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{event.location || '—'}</TableCell>
                  <TableCell>
                    {onViewAttendance ? (
                      <Tooltip title="View who signed up">
                        <span>
                          <ButtonBase
                            onClick={() => onViewAttendance(event._id)}
                            disabled={loading}
                            focusRipple
                            sx={{
                              borderRadius: 1,
                              px: 0.75,
                              py: 0.5,
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              width: '100%',
                              '&:hover:not(:disabled)': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                            aria-label={`View volunteer sign-ups for ${event.name || 'this event'} (${event.currentVolunteerCount || 0} registered)`}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <PeopleIcon fontSize="small" color="action" />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {event.currentVolunteerCount || 0}
                                {event.volunteersNeeded
                                  ? ` / ${event.volunteersNeeded}`
                                  : ''}
                              </Typography>
                            </Stack>
                          </ButtonBase>
                        </span>
                      </Tooltip>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {event.currentVolunteerCount || 0}
                          {event.volunteersNeeded
                            ? ` / ${event.volunteersNeeded}`
                            : ''}
                        </Typography>
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    {event.skillsNeeded && event.skillsNeeded.length > 0 ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {event.skillsNeeded.slice(0, 2).map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {event.skillsNeeded.length > 2 && (
                          <Chip
                            label={`+${event.skillsNeeded.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{event.priority || '—'}</TableCell>
                  <TableCell>
                    {event.waiverRequired ? (
                      <Chip label="Required" size="small" color="warning" />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {onViewAttendance && (
                      <Tooltip title="Who signed up & attendance">
                        <span>
                          <IconButton
                            onClick={() => onViewAttendance(event._id)}
                            disabled={loading}
                            size="small"
                            aria-label="View volunteer sign-ups for this event"
                          >
                            <FactCheckIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {onViewAttendanceQr && event.status !== 'cancelled' && (
                      <Tooltip title="Attendance QR code for volunteers">
                        <span>
                          <IconButton
                            onClick={() => onViewAttendanceQr(event._id)}
                            disabled={loading}
                            size="small"
                            aria-label="Show attendance QR code"
                          >
                            <QrCode2Icon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {onViewEvent && (
                      <Tooltip title="View/Edit">
                        <span>
                          <IconButton
                            onClick={() => onViewEvent(event._id)}
                            disabled={loading}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {onDeleteEvent && (
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            onClick={() => onDeleteEvent(event._id)}
                            disabled={loading}
                            size="small"
                          >
                            <DeleteForeverIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !loading && (
          <Typography variant="body1" color="text.secondary">
            No events found. Create a new event to get started.
          </Typography>
        )
      )}
    </Box>
  )
}
