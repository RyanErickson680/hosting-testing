import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material'
import Button from '../Button'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import RefreshIcon from '@mui/icons-material/Refresh'

export default function EventFilters({
  filterStatus,
  filterStartDate,
  filterEndDate,
  loading,
  onStatusChange,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
  onResetFilters,
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Filters
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ rowGap: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="full">Full</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={filterStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />
        <TextField
          label="End Date"
          type="date"
          value={filterEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 180 }}
        />
        <Button
          onClick={onApplyFilters}
          disabled={loading}
          leftIcon={<FilterAltIcon />}
        >
          Apply
        </Button>
        <Button
          onClick={onResetFilters}
          disabled={loading}
          leftIcon={<RefreshIcon />}
        >
          Reset
        </Button>
      </Stack>
    </Box>
  )
}
