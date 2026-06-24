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

export default function ProjectFilters({
  filterStatus,
  filterPriority,
  filterSearch,
  loading,
  onStatusChange,
  onPriorityChange,
  onSearchChange,
  onApplyFilters,
  onResetFilters,
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Filters
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="proposed">Proposed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Priority"
          type="number"
          value={filterPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          sx={{ width: 130 }}
          inputProps={{ step: 1, min: 0 }}
        />
        <TextField
          label="Search"
          type="text"
          value={filterSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Project name or description"
          sx={{ width: 250 }}
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
