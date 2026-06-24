import { useState } from 'react'
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Stack,
  InputAdornment,
  Alert,
} from '@mui/material'
import GrassIcon from '@mui/icons-material/Grass'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

const CROP_TYPES = [
  'Tomatoes',
  'Peppers',
  'Collard Greens',
  'Kale',
  'Lettuce',
  'Cucumbers',
  'Squash',
  'Zucchini',
  'Beans',
  'Herbs',
  'Carrots',
  'Onions',
  'Garlic',
  'Potatoes',
  'Sweet Potatoes',
  'Corn',
  'Okra',
  'Eggplant',
  'Strawberries',
  'Other',
]

export default function HarvestLogForm({ loading, onSubmit }) {
  const [cropType, setCropType] = useState('')
  const [customCrop, setCustomCrop] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    const finalCrop = cropType === 'Other' ? customCrop.trim() : cropType
    if (!finalCrop) {
      setError('Please select or enter a crop type')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    onSubmit({
      type: 'harvest',
      cropType: finalCrop,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      date,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setCropType('')
    setCustomCrop('')
    setWeightKg('')
    setDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${colors.background.section}`,
        backgroundColor: colors.background.paper,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <GrassIcon sx={{ color: colors.primary.main }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Log Harvest
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
        Record what was harvested from the farm today.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Crop Type"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            required
            fullWidth
            size="small"
          >
            {CROP_TYPES.map((crop) => (
              <MenuItem key={crop} value={crop}>
                {crop}
              </MenuItem>
            ))}
          </TextField>

          {cropType === 'Other' && (
            <TextField
              label="Custom Crop Name"
              value={customCrop}
              onChange={(e) => setCustomCrop(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="Enter crop name"
            />
          )}

          <TextField
            label="Weight"
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: <InputAdornment position="end">lb</InputAdornment>,
              inputProps: { min: 0, step: 0.1 },
            }}
          />

          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Any additional notes about this harvest..."
          />

          <MuiButton
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              backgroundColor: colors.primary.main,
              '&:hover': { backgroundColor: colors.primary.dark },
              borderRadius: '10px',
              py: 1.2,
            }}
          >
            {loading ? 'Saving...' : 'Log Harvest'}
          </MuiButton>
        </Stack>
      </Box>
    </Paper>
  )
}
