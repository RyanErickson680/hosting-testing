import { useState } from 'react'
import {
  Box,
  TextField,
  Typography,
  Paper,
  Stack,
  InputAdornment,
  Alert,
} from '@mui/material'
import InventoryIcon from '@mui/icons-material/Inventory'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

export default function SuppliesLogForm({ loading, onSubmit }) {
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (!itemName.trim()) {
      setError('Please enter an item name')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    onSubmit({
      type: 'supplies',
      cropType: itemName.trim(),
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      date,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setItemName('')
    setQuantity('')
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
        <InventoryIcon sx={{ color: colors.primary.main }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Log Supplies
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
        Record tools, equipment, or other non-produce items.
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
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            fullWidth
            size="small"
            placeholder="e.g. Shovel, Fertilizer, Hose, Gloves..."
          />

          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              inputProps: { min: 0, step: 1 },
            }}
          />

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
            placeholder="Any additional details..."
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
            {loading ? 'Saving...' : 'Log Item'}
          </MuiButton>
        </Stack>
      </Box>
    </Paper>
  )
}
