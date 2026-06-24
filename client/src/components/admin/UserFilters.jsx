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

export default function UserFilters({
  filterRole,
  filterEmail,
  filterWaiver,
  loading,
  onRoleChange,
  onEmailChange,
  onWaiverChange,
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
          <InputLabel>Role</InputLabel>
          <Select
            value={filterRole}
            label="Role"
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Email"
          value={filterEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          sx={{ width: 250 }}
        />
        <FormControl sx={{ minWidth: 170 }}>
          <InputLabel>Waiver</InputLabel>
          <Select
            value={filterWaiver}
            label="Waiver"
            onChange={(e) => onWaiverChange(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Signed</MenuItem>
            <MenuItem value="false">Not signed</MenuItem>
          </Select>
        </FormControl>
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
