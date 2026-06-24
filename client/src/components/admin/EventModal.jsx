import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CreateEventForm from './CreateEventForm'

export default function EventModal({
  open,
  onClose,
  event,
  loading,
  onSubmit,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {event ? 'Edit Event' : 'Create Event'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <CreateEventForm
          event={event}
          loading={loading}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
