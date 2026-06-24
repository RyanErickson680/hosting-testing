import { useState } from 'react'
import {
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button as MuiButton,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import Button from '../Button'
import AddCircleIcon from '@mui/icons-material/AddCircle'

const formatDateTimeLocal = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const formatTimeValue = (event) => {
  if (event?.endTime) return event.endTime
  if (!event?.endDate) return ''
  const d = new Date(event.endDate)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}


export default function CreateEventForm({ event, loading, onSubmit, onCancel, onCreateEvent }) {
  const isEditMode = !!event
  const submitHandler = onSubmit || onCreateEvent
  const [eventType, setEventType] = useState(event?.eventType || 'volunteering')

  const handleSubmit = (e) => {
    e.preventDefault() // Prevent default form submission
    
    if (!submitHandler) return
    submitHandler(e)
  }

  return (
    <Card sx={{ boxShadow: 'none', maxWidth: '100%', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0, maxWidth: '100%' }}>
        {!isEditMode && (
          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <AddCircleIcon />
            <Typography variant="h6">Create Event</Typography>
          </Stack>
        )}
        <form onSubmit={handleSubmit}>
          {isEditMode && <input type="hidden" name="id" value={event._id} />}
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Event Name *"
                  name="name"
                  required
                  fullWidth
                  placeholder="Community Harvest Day"
                  defaultValue={event?.name || ''}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Help harvest vegetables for distribution"
                  defaultValue={event?.description || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Start Date & Time *"
                  name="date"
                  type="datetime-local"
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  defaultValue={event?.date ? formatDateTimeLocal(event.date) : ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="End Time *"
                  name="endTime"
                  type="time"
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  defaultValue={formatTimeValue(event)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth required>
                  <InputLabel>Event Type *</InputLabel>
                  <Select
                    name="eventType"
                    label="Event Type *"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <MenuItem value="volunteering">Volunteering</MenuItem>
                    <MenuItem value="regular">Regular Event</MenuItem>
                    <MenuItem value="paid">Paid Event</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {eventType === 'paid' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Ticket Price (USD) *"
                    name="cost"
                    type="number"
                    required
                    fullWidth
                    inputProps={{ min: 1, step: '0.01' }}
                    placeholder="25.00"
                    defaultValue={event?.cost || ''}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Location"
                  name="location"
                  fullWidth
                  placeholder="Main Garden"
                  defaultValue={event?.location || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Status *</InputLabel>
                  <Select name="status" label="Status *" defaultValue={event?.status || 'open'}>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="full">Full</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Volunteers Needed"
                  name="volunteersNeeded"
                  type="number"
                  fullWidth
                  placeholder="10"
                  defaultValue={event?.volunteersNeeded || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Priority"
                  name="priority"
                  type="number"
                  fullWidth
                  placeholder="1"
                  helperText="1 = highest"
                  defaultValue={event?.priority || ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Current Volunteers"
                  name="currentVolunteerCount"
                  type="number"
                  defaultValue={event?.currentVolunteerCount || 0}
                  fullWidth
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Skills Needed (comma-separated)"
                  name="skillsNeeded"
                  fullWidth
                  placeholder="gardening, harvesting, heavy lifting"
                  helperText="Enter skills separated by commas"
                  defaultValue={event?.skillsNeeded ? event.skillsNeeded.join(', ') : ''}
                />
              </Grid>
              <Grid size={12}>
                <FormControlLabel
                  control={<Checkbox name="waiverRequired" defaultChecked={event?.waiverRequired || false} />}
                  label="Waiver Required"
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {onCancel && (
                <MuiButton onClick={onCancel} disabled={loading}>
                  Cancel
                </MuiButton>
              )}
              <Button type="submit" disabled={loading}>
                {isEditMode ? 'Update Event' : 'Create Event'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}