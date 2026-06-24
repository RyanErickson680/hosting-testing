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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

const CONDITION_COLORS = {
  'new': colors.primary.main,
  'good': colors.primary.light,
  'fair': colors.accent.main,
  'poor': colors.error.light,
  'needs repair': colors.error.main,
}

const CATEGORY_LABELS = {
  tools: 'Tools',
  equipment: 'Equipment',
  supplies: 'Supplies',
  other: 'Other',
}

export default function EquipmentTable({
  items,
  total,
  page,
  rowsPerPage,
  loading,
  isAdmin,
  filterCategory,
  onCategoryChange,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  onDelete,
}) {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null })

  const handleDeleteClick = (item) => {
    setDeleteDialog({ open: true, item })
  }

  const handleDeleteConfirm = () => {
    if (deleteDialog.item) {
      onDelete(deleteDialog.item._id)
    }
    setDeleteDialog({ open: false, item: null })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, item: null })
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
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Equipment & Supplies
          </Typography>
          {total !== undefined && (
            <Chip
              label={`${total} items`}
              size="small"
              sx={{
                backgroundColor: colors.background.section,
                fontWeight: 500,
              }}
            />
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <TextField
            select
            label="Category"
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="tools">Tools</MenuItem>
            <MenuItem value="equipment">Equipment</MenuItem>
            <MenuItem value="supplies">Supplies</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={onRefresh} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {items.length === 0 ? (
        <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{ color: colors.text.secondary, py: 4 }}
          >
            No equipment items found. Add tools, equipment, or supplies to get started.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ backgroundColor: colors.background.section }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Condition</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                  {isAdmin && (
                    <TableCell sx={{ fontWeight: 600 }} align="center">
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: colors.background.section,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={CATEGORY_LABELS[item.category] || item.category}
                        size="small"
                        sx={{
                          backgroundColor: colors.background.section,
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.condition}
                        size="small"
                        sx={{
                          backgroundColor: (CONDITION_COLORS[item.condition] || colors.text.disabled) + '20',
                          color: CONDITION_COLORS[item.condition] || colors.text.secondary,
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell>
                      {item.notes ? (
                        <Tooltip title={item.notes}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.notes}
                          </Typography>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="center">
                        <Tooltip title="Delete item">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(item)}
                            sx={{
                              color: colors.error.main,
                              '&:hover': {
                                backgroundColor: colors.error.light + '20',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              onRowsPerPageChange(parseInt(e.target.value, 10))
            }
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </>
      )}

      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Equipment Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{deleteDialog.item?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleDeleteCancel}>Cancel</MuiButton>
          <MuiButton
            onClick={handleDeleteConfirm}
            sx={{ color: colors.error.main }}
          >
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
