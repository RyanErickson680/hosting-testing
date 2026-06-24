import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import Button from '../Button'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'

export default function StatsOverview({
  stats,
  onLoadStats,
}) {
  if (!stats) {
    return <Button onClick={onLoadStats}>Load Statistics</Button>
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{stats.total || 0}</Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <PeopleIcon fontSize="small" />
              <Typography variant="body2">Total Users</Typography>
            </Stack>
          </Paper>
        </Grid>
        {stats.byRole?.map(({ role, count }) => (
          <Grid item xs={12} sm={6} md={3} key={role}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4">{count}</Typography>
              <Typography
                variant="body2"
                sx={{ textTransform: 'capitalize' }}
              >
                {role}s
              </Typography>
            </Paper>
          </Grid>
        ))}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              {stats.waiverSignedVolunteers || 0}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <AssignmentTurnedInIcon fontSize="small" color="success" />
              <Typography variant="body2">Waivers Signed</Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">
              ${stats.totalDonated?.toFixed(2) || '0.00'}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <MonetizationOnIcon fontSize="small" color="warning" />
              <Typography variant="body2">Total Donated</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
