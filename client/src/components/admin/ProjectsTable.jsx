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
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material'
import Button from '../Button'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import EditIcon from '@mui/icons-material/Edit'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

const statusChipColor = (status) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'proposed':
      return 'info'
    case 'completed':
      return 'default'
    default:
      return 'default'
  }
}

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProjectsTable({
  projects,
  loading,
  onRefresh,
  onDeleteProject,
  onViewProject,
}) {
  return (
    <Box my={2}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h6">
          Projects ({projects.length} {projects.length === 1 ? 'project' : 'projects'})
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

      {projects.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Goal Amount</TableCell>
                <TableCell>Raised</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Target Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const progress =
                  project.goalAmount > 0
                    ? (project.currentAmount || 0) / project.goalAmount
                    : 0
                const progressPercent = Math.round(progress * 100)

                return (
                  <TableRow key={project._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {project.name}
                      </Typography>
                      {project.description && (
                        <Typography variant="caption" color="text.secondary">
                          {project.description.substring(0, 50)}
                          {project.description.length > 50 ? '...' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={project.status}
                        color={statusChipColor(project.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{project.priority}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AttachMoneyIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatCurrency(project.goalAmount)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main" fontWeight="medium">
                        {formatCurrency(project.currentAmount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Stack spacing={0.5}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progressPercent, 100)}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {progressPercent}%
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {project.timeline?.targetEndDate
                        ? formatDate(project.timeline.targetEndDate)
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View/Edit">
                        <span>
                          <IconButton
                            onClick={() => onViewProject(project._id)}
                            disabled={loading}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            onClick={() => onDeleteProject(project._id)}
                            disabled={loading}
                            size="small"
                          >
                            <DeleteForeverIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !loading && (
          <Typography variant="body1" color="text.secondary">
            No projects found. Create a new project to get started.
          </Typography>
        )
      )}
    </Box>
  )
}
