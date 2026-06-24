import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { WAIVER_TEXT } from '../constants/waiverText'

export default function WaiverModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Volunteer Release Waiver of Liability</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {WAIVER_TEXT}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  )
}
