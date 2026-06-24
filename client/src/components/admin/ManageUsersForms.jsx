import {
  Grid,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Paper,
  Divider,
} from '@mui/material'
import { colors } from '../../theme/colors'
import Button from '../Button'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import EditIcon from '@mui/icons-material/Edit'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

export default function ManageUsersForms({
  loading,
  deleteUserId,
  onDeleteUserIdChange,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) {
  return (
    <Stack spacing={4}>
      {/* Create User Section */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${colors.secondary.light}`,
          backgroundColor: colors.background.paper,
          p: 3,
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddCircleIcon sx={{ color: colors.primary.main, fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Create New User
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                Add a new user account to the system
              </Typography>
            </Box>
          </Box>

          <Divider />

          <form onSubmit={onCreateUser}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    mb: 2,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                  }}
                >
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email *"
                      name="email"
                      type="email"
                      required
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required size="small">
                      <InputLabel>Role *</InputLabel>
                      <Select
                        name="role"
                        label="Role *"
                        defaultValue="user"
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="staff">Staff</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name *"
                      name="firstName"
                      required
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name *"
                      name="lastName"
                      required
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      name="phone"
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Password Hash"
                      name="passwordHash"
                      type="password"
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Volunteer Profile */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    mb: 2,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                  }}
                >
                  Volunteer Profile (Optional)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Skills (comma-separated)"
                      name="skills"
                      placeholder="gardening, harvesting, etc."
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Total Hours"
                      name="totalHours"
                      type="number"
                      defaultValue={0}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Donor Profile */}
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                    mb: 2,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                  }}
                >
                  Donor Profile (Optional)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Total Amount Donated"
                      name="totalAmount"
                      type="number"
                      defaultValue={0}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Recurring Donations Count"
                      name="recurringCount"
                      type="number"
                      defaultValue={0}
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Button
                type="submit"
                disabled={loading}
                sx={{
                  background: colors.primary.main,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': { background: colors.primary.dark },
                }}
              >
                Create User
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>

      {/* Update & Delete Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${colors.secondary.light}`,
              backgroundColor: colors.background.paper,
              p: 3,
            }}
          >
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon sx={{ color: colors.primary.main, fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Update User
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    Modify user account details
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <form onSubmit={onUpdateUser}>
                <Stack spacing={2}>
                  <TextField
                    label="User Email *"
                    name="email"
                    type="email"
                    required
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    label="First Name"
                    name="firstName"
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                  <TextField
                    label="Last Name"
                    name="lastName"
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select name="role" label="Role">
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="staff">Staff</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                    </Select>
                  </FormControl>
                  <Divider />
                  <Button
                    type="submit"
                    disabled={loading}
                    sx={{
                      background: colors.primary.main,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5,
                      '&:hover': { background: colors.primary.dark },
                    }}
                  >
                    Update User
                  </Button>
                </Stack>
              </form>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${colors.error.light}`,
              backgroundColor: colors.background.paper,
              p: 3,
            }}
          >
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteForeverIcon
                  sx={{ color: colors.error.main, fontSize: 28 }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Delete User
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                    Permanently remove a user account
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <TextField
                label="User ID to Delete *"
                value={deleteUserId}
                onChange={(e) => onDeleteUserIdChange(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
              />
              <Button
                onClick={onDeleteUser}
                disabled={loading || !deleteUserId}
                sx={{
                  background: colors.error.main,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': { background: colors.error.dark },
                }}
              >
                Delete User
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  )
}
