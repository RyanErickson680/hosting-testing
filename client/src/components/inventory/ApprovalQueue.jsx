import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RefreshIcon from '@mui/icons-material/Refresh'
import GrassIcon from '@mui/icons-material/Grass'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import RecyclingIcon from '@mui/icons-material/Recycling'
import InventoryIcon from '@mui/icons-material/Inventory'
import SpaIcon from '@mui/icons-material/Spa'
import MuiButton from '@mui/material/Button'
import { colors } from '../../theme/colors'

const typeConfig = {
  harvest: { icon: GrassIcon, label: 'Harvest', bg: colors.secondary.light },
  compost: { icon: RecyclingIcon, label: 'Compost', bg: '#6B8E2330' },
  distribution: { icon: LocalShippingIcon, label: 'Distribution', bg: colors.accent.light },
  supplies: { icon: InventoryIcon, label: 'Supplies', bg: '#5C6BC020' },
  seed: { icon: SpaIcon, label: 'Seed', bg: '#8D6E6320' },
}

export default function ApprovalQueue({
  requests,
  loading,
  onApprove,
  onReject,
  onRefresh,
}) {
  const [rejectDialog, setRejectDialog] = useState({ open: false, request: null })
  const [rejectNotes, setRejectNotes] = useState('')

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getRequesterName = (request) => {
    const user = request.requestedByUserId
    if (!user) return 'Unknown'
    if (typeof user === 'string') return user
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown'
  }

  const handleRejectClick = (request) => {
    setRejectDialog({ open: true, request })
    setRejectNotes('')
  }

  const handleRejectConfirm = () => {
    if (rejectDialog.request) {
      onReject(rejectDialog.request._id, rejectNotes)
    }
    setRejectDialog({ open: false, request: null })
    setRejectNotes('')
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${colors.background.section}`,
        backgroundColor: colors.background.paper,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Pending Approval Requests
        </Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={onRefresh} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : requests.length === 0 ? (
        <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{ color: colors.text.secondary, py: 4 }}
          >
            No pending requests.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.background.section }}>
                <TableCell sx={{ fontWeight: 600 }}>Requester</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Crop/Item</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Weight (lb)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => {
                const payload = request.payload || {}
                const config = typeConfig[payload.type] || typeConfig.harvest
                const TypeIcon = config.icon

                return (
                  <TableRow
                    key={request._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: colors.background.section,
                      },
                    }}
                  >
                    <TableCell>{getRequesterName(request)}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.action}
                        size="small"
                        sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<TypeIcon sx={{ fontSize: 16 }} />}
                        label={config.label}
                        size="small"
                        sx={{
                          backgroundColor: config.bg,
                          color: colors.text.primary,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{payload.cropType || '-'}</TableCell>
                    <TableCell>
                      {payload.weightKg != null ? Number(payload.weightKg).toFixed(1) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(payload.date)}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            onClick={() => onApprove(request._id)}
                            sx={{
                              color: colors.primary.main,
                              '&:hover': {
                                backgroundColor: colors.primary.main + '20',
                              },
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            size="small"
                            onClick={() => handleRejectClick(request)}
                            sx={{
                              color: colors.error.main,
                              '&:hover': {
                                backgroundColor: colors.error.main + '20',
                              },
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, request: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: colors.text.secondary }}>
            Optionally add a note explaining why this request is being rejected.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Rejection Notes (optional)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setRejectDialog({ open: false, request: null })}>
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleRejectConfirm}
            sx={{ color: colors.error.main }}
          >
            Reject
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
