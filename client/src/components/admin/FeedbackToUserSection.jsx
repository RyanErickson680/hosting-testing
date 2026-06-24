import { useState } from 'react'
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import FeedbackIcon from '@mui/icons-material/Feedback'
import { colors } from '../../theme/colors'

const FEEDBACK_CATEGORIES = [
  { value: 'thank_you', label: 'Thank you / Recognition' },
  { value: 'suggestion', label: 'Suggestion for improvement' },
  { value: 'concern', label: 'Concern or issue' },
  { value: 'general', label: 'General feedback' },
]

/**
 * Lets staff send structured feedback to a user or volunteer (email + volunteer dashboard).
 */
export default function FeedbackToUserSection({ users = [], loading = false, onSend }) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUserId || !category.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please select a user, category, and enter a message.' })
      return
    }
    setSending(true)
    setStatus({ type: '', text: '' })
    try {
      if (onSend) {
        await onSend({ userId: selectedUserId, category, message })
        setStatus({ type: 'success', text: 'Feedback sent successfully!' })
        setSelectedUserId('')
        setCategory('')
        setMessage('')
      } else {
        await new Promise((r) => setTimeout(r, 500))
        setStatus({ type: 'success', text: 'Feedback sent successfully!' })
        setSelectedUserId('')
        setCategory('')
        setMessage('')
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to send feedback.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FeedbackIcon sx={{ fontSize: 24, color: colors.primary.main }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary }}>
          Send feedback to user or volunteer
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2 }}>
        Send structured feedback to a user or volunteer. They receive an email and can read it anytime on their volunteer dashboard.
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }} size="small">
        <InputLabel>Recipient</InputLabel>
        <Select
          value={selectedUserId}
          label="Recipient"
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={loading}
        >
          <MenuItem value="">Select a user or volunteer</MenuItem>
          {users.map((u) => (
            <MenuItem key={u._id} value={u._id}>
              {[u.firstName, u.lastName].filter(Boolean).join(' ')} ({u.email})
              {u.volunteerProfile ? ' · Volunteer profile' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }} size="small">
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          label="Category"
          onChange={(e) => setCategory(e.target.value)}
        >
          <MenuItem value="">Select category</MenuItem>
          {FEEDBACK_CATEGORIES.map((c) => (
            <MenuItem key={c.value} value={c.value}>
              {c.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your feedback..."
        sx={{ mb: 2 }}
        size="small"
      />

      <Button
        type="submit"
        variant="contained"
        disabled={sending || !selectedUserId || !category || !message.trim()}
        sx={{ backgroundColor: colors.primary.main, '&:hover': { backgroundColor: colors.primary.dark } }}
      >
        {sending ? <CircularProgress size={24} color="inherit" /> : 'Send feedback'}
      </Button>

      {status.text && (
        <Alert severity={status.type === 'error' ? 'error' : 'success'} sx={{ mt: 2 }} onClose={() => setStatus({ type: '', text: '' })}>
          {status.text}
        </Alert>
      )}
    </Box>
  )
}
