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
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
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
  'Mixed Produce',
  'Other',
]

const DISTRIBUTION_LOCATIONS = [
  'Mill Creek Farm Stand',
  'Community Center',
  'Food Bank',
  'Local School',
  'Senior Center',
  'Church Partnership',
  'Farmers Market',
  'Neighborhood Pickup',
  'Other',
]

export default function DistributionLogForm({ loading, onSubmit }) {
  const [cropType, setCropType] = useState('')
  const [customCrop, setCustomCrop] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [distributionLocation, setDistributionLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [peopleServed, setPeopleServed] = useState('')
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

    const finalLocation = distributionLocation === 'Other'
      ? customLocation.trim()
      : distributionLocation

    if (!date) {
      setError('Please select a date')
      return
    }

    onSubmit({
      type: 'distribution',
      cropType: finalCrop,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      distributionLocation: finalLocation || undefined,
      peopleServed: peopleServed ? parseInt(peopleServed, 10) : undefined,
      date,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setCropType('')
    setCustomCrop('')
    setWeightKg('')
    setDistributionLocation('')
    setCustomLocation('')
    setPeopleServed('')
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
        <LocalShippingIcon sx={{ color: colors.accent.main }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Log Distribution
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
        Record produce distributed to the community.
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
            select
            label="Distribution Location"
            value={distributionLocation}
            onChange={(e) => setDistributionLocation(e.target.value)}
            fullWidth
            size="small"
          >
            {DISTRIBUTION_LOCATIONS.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </TextField>

          {distributionLocation === 'Other' && (
            <TextField
              label="Custom Location"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="Enter location name"
            />
          )}

          <TextField
            label="People Served"
            type="number"
            value={peopleServed}
            onChange={(e) => setPeopleServed(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              inputProps: { min: 0 },
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
            placeholder="Any additional notes about this distribution..."
          />

          <MuiButton
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              backgroundColor: colors.accent.main,
              color: colors.accent.contrastText,
              '&:hover': { backgroundColor: colors.accent.dark },
              borderRadius: '10px',
              py: 1.2,
            }}
          >
            {loading ? 'Saving...' : 'Log Distribution'}
          </MuiButton>
        </Stack>
      </Box>
    </Paper>
  )
}
