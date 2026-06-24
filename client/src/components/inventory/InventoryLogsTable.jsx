import React, { useState } from 'react'
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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Collapse,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import GrassIcon from '@mui/icons-material/Grass'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import RecyclingIcon from '@mui/icons-material/Recycling'
import InventoryIcon from '@mui/icons-material/Inventory'
import SpaIcon from '@mui/icons-material/Spa'
import RefreshIcon from '@mui/icons-material/Refresh'
import InboxIcon from '@mui/icons-material/Inbox'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

function DetailItem({ label, value }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: colors.text.disabled, fontWeight: 500, display: 'block', mb: 0.25 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: colors.text.primary }}>
        {value}
      </Typography>
    </Box>
  )
}

export default function InventoryLogsTable({
  title = 'Produce Logs',
  variant = 'produce',
  logs,
  total,
  page,
  rowsPerPage,
  loading,
  isAdmin,
  emptyMessage = 'No logs found.',
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  onDelete,
}) {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, log: null })
  const [expandedRows, setExpandedRows] = useState(new Set())
  const isSupplies = variant === 'supplies'
  const isSeed = variant === 'seed'

  // collapsed col count: data cols + 1 actions col
  const colCount = isSupplies || isSeed ? 4 : 5

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteClick = (log) => setDeleteDialog({ open: true, log })
  const handleDeleteConfirm = () => {
    if (deleteDialog.log) onDelete(deleteDialog.log._id)
    setDeleteDialog({ open: false, log: null })
  }
  const handleDeleteCancel = () => setDeleteDialog({ open: false, log: null })

  const getTypeChip = (log) => {
    const config = {
      harvest: { icon: <GrassIcon sx={{ fontSize: 16 }} />, label: 'Harvest', bg: colors.secondary.light },
      compost: { icon: <RecyclingIcon sx={{ fontSize: 16 }} />, label: 'Compost', bg: '#6B8E2330' },
      supplies: { icon: <InventoryIcon sx={{ fontSize: 16 }} />, label: 'Supplies', bg: '#5C6BC020' },
      seed: { icon: <SpaIcon sx={{ fontSize: 16 }} />, label: 'Seed', bg: '#8D6E6320' },
      distribution: { icon: <LocalShippingIcon sx={{ fontSize: 16 }} />, label: 'Distribution', bg: colors.accent.light },
    }
    const c = config[log.type] || config.distribution
    return (
      <Chip
        icon={c.icon}
        label={c.label}
        size="small"
        sx={{ backgroundColor: c.bg, color: colors.text.primary, fontWeight: 500 }}
      />
    )
  }

  const renderExpandedDetail = (log) => {
    const items = []

    if (isSeed) {
      if (log.weightKg != null) items.push({ label: 'Weight', value: `${log.weightKg.toFixed(1)} lb` })
      if (log.source) items.push({ label: 'Source', value: log.source })
    } else if (isSupplies) {
      if (log.weightKg != null) items.push({ label: 'Weight', value: `${log.weightKg.toFixed(1)} lb` })
    } else {
      if (log.volumeLiters != null) items.push({ label: 'Volume', value: `${log.volumeLiters.toFixed(1)} L` })
      if (log.distributionLocation) items.push({ label: 'Location', value: log.distributionLocation })
      if (log.peopleServed != null) items.push({ label: 'People Served', value: log.peopleServed })
    }

    if (log.notes) items.push({ label: 'Notes', value: log.notes, full: true })

    return (
      <Box
        sx={{
          px: 3,
          py: 2,
          backgroundColor: colors.background.default,
          borderTop: `1px solid ${colors.background.section}`,
        }}
      >
        {items.length === 0 ? (
          <Typography variant="caption" sx={{ color: colors.text.disabled }}>
            No additional details
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={3}>
            {items.map(({ label, value, full }) => (
              <Box key={label} sx={{ ...(full && { width: '100%' }) }}>
                <DetailItem label={label} value={value} />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    )
  }

  const renderEmptyOrLoading = () => {
    if (loading && logs.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress size={28} sx={{ color: colors.primary.main }} />
        </Box>
      )
    }
    return (
      <Box sx={{ textAlign: 'center', py: 5, px: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: colors.background.section,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          <InboxIcon sx={{ color: colors.text.disabled, fontSize: 24 }} />
        </Box>
        <Typography variant="body1" sx={{ fontWeight: 600, color: colors.text.secondary }}>
          No logs yet
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.disabled, mt: 0.5 }}>
          {emptyMessage}
        </Typography>
      </Box>
    )
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
        sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.background.section}` }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={onRefresh} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {logs.length === 0 ? (
        renderEmptyOrLoading()
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.background.section }}>
                  {isSupplies ? (
                    <>
                      <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </>
                  ) : isSeed ? (
                    <>
                      <TableCell sx={{ fontWeight: 600 }}>Crop Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Quantity (pkts)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Crop / Material</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Weight (lb)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </>
                  )}
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const isExpanded = expandedRows.has(log._id)
                  return (
                    <React.Fragment key={log._id}>
                      <TableRow
                        sx={{
                          '&:hover': { backgroundColor: colors.background.section },
                          ...(isExpanded && {
                            backgroundColor: colors.background.section,
                            '& td': { borderBottom: 0 },
                          }),
                        }}
                      >
                        {isSupplies ? (
                          <>
                            <TableCell sx={{ fontWeight: 500 }}>{log.cropType}</TableCell>
                            <TableCell>{log.quantity ?? '-'}</TableCell>
                            <TableCell>{formatDate(log.date)}</TableCell>
                          </>
                        ) : isSeed ? (
                          <>
                            <TableCell sx={{ fontWeight: 500 }}>{log.cropType}</TableCell>
                            <TableCell>{log.quantity ?? '-'}</TableCell>
                            <TableCell>{formatDate(log.date)}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{getTypeChip(log)}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{log.cropType}</TableCell>
                            <TableCell>
                              {log.weightKg != null ? log.weightKg.toFixed(1) : '-'}
                            </TableCell>
                            <TableCell>{formatDate(log.date)}</TableCell>
                          </>
                        )}
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title={isExpanded ? 'Collapse' : 'Expand details'}>
                              <IconButton
                                size="small"
                                onClick={() => toggleRow(log._id)}
                                sx={{ color: colors.text.secondary }}
                              >
                                {isExpanded ? (
                                  <KeyboardArrowUpIcon fontSize="small" />
                                ) : (
                                  <KeyboardArrowDownIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="Delete log">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(log)}
                                  sx={{
                                    color: colors.error.main,
                                    '&:hover': { backgroundColor: colors.error.light + '20' },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={colCount} sx={{ p: 0, border: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {renderExpandedDetail(log)}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </>
      )}

      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Log</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {deleteDialog.log?.type} log for{' '}
            <strong>{deleteDialog.log?.cropType}</strong> from{' '}
            {formatDate(deleteDialog.log?.date)}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleDeleteCancel}>Cancel</MuiButton>
          <MuiButton onClick={handleDeleteConfirm} sx={{ color: colors.error.main }}>
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
