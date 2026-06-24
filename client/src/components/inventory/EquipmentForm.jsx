import { useState } from 'react'
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Stack,
  Alert,
} from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

const CATEGORIES = [
  { value: 'tools', label: 'Tools' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' },
]

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'needs repair', label: 'Needs Repair' },
]

const LOCATIONS = [
  'Tool Shed',
  'Greenhouse',
  'Main Barn',
  'Field Storage',
  'Office',
  'Other',
]

export default function EquipmentForm({ loading, onSubmit }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [condition, setCondition] = useState('good')
  const [location, setLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter an item name')
      return
    }

    if (!category) {
      setError('Please select a category')
      return
    }

    const finalLocation = location === 'Other' ? customLocation.trim() : location

    onSubmit({
      name: name.trim(),
      category,
      quantity: quantity ? parseInt(quantity, 10) : 1,
      condition,
      location: finalLocation || undefined,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setName('')
    setCategory('')
    setQuantity('1')
    setCondition('good')
    setLocation('')
    setCustomLocation('')
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
        <BuildIcon sx={{ color: colors.text.secondary }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Add Item
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
        Add tools, equipment, or supplies to the inventory.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <TextField
            label="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="e.g. Wheelbarrow, Shovel, Hose"
          />

          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            fullWidth
            size="small"
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                inputProps: { min: 1 },
              }}
            />

            <TextField
              select
              label="Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              fullWidth
              size="small"
            >
              {CONDITIONS.map((cond) => (
                <MenuItem key={cond.value} value={cond.value}>
                  {cond.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            select
            label="Storage Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">None</MenuItem>
            {LOCATIONS.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </TextField>

          {location === 'Other' && (
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
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Any additional notes..."
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
            {loading ? 'Saving...' : 'Add Item'}
          </MuiButton>
        </Stack>
      </Box>
    </Paper>
  )
}
