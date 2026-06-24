import {
  Box,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Button from '../Button'
import SearchIcon from '@mui/icons-material/Search'

export default function UserLookup({
  userId,
  userEmail,
  loading,
  onUserIdChange,
  onUserEmailChange,
  onFindById,
  onFindByEmail,
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Lookup
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <TextField
          label="User ID"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          sx={{ width: 300 }}
        />
        <Button
          onClick={onFindById}
          disabled={loading}
          leftIcon={<SearchIcon />}
        >
          By ID
        </Button>
        <TextField
          label="Email"
          value={userEmail}
          onChange={(e) => onUserEmailChange(e.target.value)}
          sx={{ width: 300 }}
        />
        <Button
          onClick={onFindByEmail}
          disabled={loading}
          leftIcon={<SearchIcon />}
        >
          By Email
        </Button>
      </Stack>
    </Box>
  )
}
