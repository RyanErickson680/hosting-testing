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
import RecyclingIcon from '@mui/icons-material/Recycling'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

const MATERIAL_TYPES = [
  'Food Scraps',
  'Yard Waste',
  'Leaves',
  'Grass Clippings',
  'Crop Residue',
  'Manure',
  'Wood Chips',
  'Straw',
  'Mixed Organic',
  'Other',
]

const COMPOST_METHODS = [
  'Hot Composting',
  'Cold Composting',
  'Vermicomposting',
  'Bokashi',
  'Tumbler',
  'Windrow',
  'Static Pile',
  'Other',
]

export default function CompostLogForm({ loading, onSubmit }) {
  const [materialType, setMaterialType] = useState('')
  const [customMaterial, setCustomMaterial] = useState('')
  const [compostMethod, setCompostMethod] = useState('')
  const [customMethod, setCustomMethod] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [volumeLiters, setVolumeLiters] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    const finalMaterial = materialType === 'Other' ? customMaterial.trim() : materialType
    if (!finalMaterial) {
      setError('Please select or enter a material type')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    const finalMethod = compostMethod === 'Other' ? customMethod.trim() : compostMethod

    onSubmit({
      type: 'compost',
      cropType: finalMaterial,
      compostMethod: finalMethod || undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      volumeLiters: volumeLiters ? parseFloat(volumeLiters) : undefined,
      date,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setMaterialType('')
    setCustomMaterial('')
    setCompostMethod('')
    setCustomMethod('')
    setWeightKg('')
    setVolumeLiters('')
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
        <RecyclingIcon sx={{ color: '#6B8E23' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Log Compost
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
        Record compost material added or compost produced.
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
            label="Material Type"
            value={materialType}
            onChange={(e) => setMaterialType(e.target.value)}
            required
            fullWidth
            size="small"
          >
            {MATERIAL_TYPES.map((mat) => (
              <MenuItem key={mat} value={mat}>
                {mat}
              </MenuItem>
            ))}
          </TextField>

          {materialType === 'Other' && (
            <TextField
              label="Custom Material Name"
              value={customMaterial}
              onChange={(e) => setCustomMaterial(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="Enter material name"
            />
          )}

          <TextField
            select
            label="Compost Method"
            value={compostMethod}
            onChange={(e) => setCompostMethod(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">None</MenuItem>
            {COMPOST_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>

          {compostMethod === 'Other' && (
            <TextField
              label="Custom Method"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
              required
              fullWidth
              size="small"
              placeholder="Enter compost method"
            />
          )}

          <Stack direction="row" spacing={2}>
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
              label="Volume"
              type="number"
              value={volumeLiters}
              onChange={(e) => setVolumeLiters(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                endAdornment: <InputAdornment position="end">L</InputAdornment>,
                inputProps: { min: 0, step: 0.1 },
              }}
            />
          </Stack>

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
            placeholder="Any additional notes about this compost entry..."
          />

          <MuiButton
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              backgroundColor: '#6B8E23',
              '&:hover': { backgroundColor: '#556B2F' },
              borderRadius: '10px',
              py: 1.2,
            }}
          >
            {loading ? 'Saving...' : 'Log Compost'}
          </MuiButton>
        </Stack>
      </Box>
    </Paper>
  )
}
