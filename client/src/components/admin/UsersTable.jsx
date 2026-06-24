import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material'
import Button from '../Button'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EmailIcon from '@mui/icons-material/Email'
import DrawIcon from '@mui/icons-material/Draw'

const roleChipColor = (role) => {
  switch (role) {
    case 'admin':
      return 'secondary'
    case 'staff':
      return 'info'
    case 'volunteer':
      return 'success'
    case 'donor':
      return 'warning'
    case 'user':
      return 'success'
    default:
      return 'default'
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const formatShortDate = (date) => {
  if (!date) return null
  return new Date(date).toLocaleDateString()
}

const displayRole = (role) => (['donor', 'volunteer'].includes(role) ? 'user' : role)

export default function UsersTable({
  users,
  selectedUser,
  loading,
  onRefresh,
  onDeleteUser,
  onResendWaiver,
  onOverrideWaiver,
}) {
  return (
    <Box my={2}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h6">
          Results ({users.length} {users.length === 1 ? 'user' : 'users'})
        </Typography>
        <Button
          onClick={onRefresh}
          disabled={loading}
          leftIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Stack>

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography>Loading...</Typography>
        </Stack>
      )}

      {selectedUser && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Selected User
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Volunteer</TableCell>
                  <TableCell>Donor</TableCell>
                  <TableCell align="right">Created</TableCell>
                  <TableCell align="right">Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {selectedUser.firstName?.[0]}
                      </Avatar>
                      <Typography>
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={displayRole(selectedUser.role)}
                      color={roleChipColor(displayRole(selectedUser.role))}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{selectedUser.email}</TableCell>
                  <TableCell>{selectedUser._id}</TableCell>
                  <TableCell>
                    {selectedUser.volunteerProfile ? (
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          Waiver:{' '}
                          {selectedUser.volunteerProfile.waiverSigned
                            ? 'Signed'
                            : 'Not signed'}
                        </Typography>
                        <Typography variant="caption">
                          Hours:{' '}
                          {selectedUser.volunteerProfile
                            .totalHoursVolunteered || 0}
                        </Typography>
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {selectedUser.donorProfile ? (
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          Total: $
                          {selectedUser.donorProfile.totalAmountDonated || 0}
                        </Typography>
                        <Typography variant="caption">
                          Recurring:{' '}
                          {selectedUser.donorProfile.recurringDonationCount ||
                            0}
                        </Typography>
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatDate(selectedUser.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    {formatDate(selectedUser.updatedAt)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {users.length > 0 ? (
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 600,
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          <Table size="small" sx={{ minWidth: 1280 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Volunteer</TableCell>
                <TableCell>Donor</TableCell>
                <TableCell align="right">Created</TableCell>
                <TableCell align="right">Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {u.firstName?.[0]}
                      </Avatar>
                      <Typography>
                        {u.firstName} {u.lastName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={displayRole(u.role)}
                      color={roleChipColor(displayRole(u.role))}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u._id}</TableCell>
                  <TableCell>
                    {u.volunteerProfile ? (
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          Skills:{' '}
                          {u.volunteerProfile.skills?.join(', ') || 'None'}
                        </Typography>
                        <Typography variant="caption">
                          Hours: {u.volunteerProfile.totalHoursVolunteered || 0}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={u.volunteerProfile.waiverSigned ? 'Waiver signed' : 'Waiver unsigned'}
                            color={u.volunteerProfile.waiverSigned ? 'success' : 'warning'}
                            variant="outlined"
                          />
                          {u.volunteerProfile.waiverSignedAt && (
                            <Typography variant="caption" color="text.secondary">
                              {formatShortDate(u.volunteerProfile.waiverSignedAt)}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {u.donorProfile ? (
                      <Stack spacing={0.5}>
                        <Typography variant="caption">
                          Total: ${u.donorProfile.totalAmountDonated || 0}
                        </Typography>
                        <Typography variant="caption">
                          Recurring:{' '}
                          {u.donorProfile.recurringDonationCount || 0}
                        </Typography>
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right">{formatDate(u.createdAt)}</TableCell>
                  <TableCell align="right">{formatDate(u.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0} justifyContent="flex-end">
                      {onResendWaiver &&
                        u.volunteerProfile &&
                        !u.volunteerProfile.waiverSigned && (
                          <Tooltip title="Resend waiver email">
                            <span>
                              <IconButton
                                onClick={() => onResendWaiver(u._id)}
                                disabled={loading}
                                sx={{ color: 'info.main' }}
                              >
                                <EmailIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      {onOverrideWaiver &&
                        u.volunteerProfile && (
                          <Tooltip
                            title={
                              u.volunteerProfile.waiverSigned
                                ? 'Revoke waiver'
                                : 'Mark waiver as signed'
                            }
                          >
                            <span>
                              <IconButton
                                onClick={() =>
                                  onOverrideWaiver(u, !u.volunteerProfile.waiverSigned)
                                }
                                disabled={loading}
                                sx={{ color: 'primary.main' }}
                              >
                                <DrawIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      {onDeleteUser && (
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              onClick={() => onDeleteUser(u._id)}
                              disabled={loading}
                            >
                              <DeleteForeverIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !loading && (
          <Typography variant="body1" color="text.secondary">
            No users found. Try adjusting your filters or create a new user.
          </Typography>
        )
      )}
    </Box>
  )
}
