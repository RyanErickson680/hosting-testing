import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Chip,
  Button,
} from '@mui/material'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import GrassIcon from '@mui/icons-material/Grass'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ScaleIcon from '@mui/icons-material/Scale'
import PeopleIcon from '@mui/icons-material/People'
import RecyclingIcon from '@mui/icons-material/Recycling'
import SpaIcon from '@mui/icons-material/Spa'
import BalanceIcon from '@mui/icons-material/Balance'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { colors } from '../../theme/colors'

function StatCard({ icon, label, value, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${colors.background.section}`,
        backgroundColor: colors.background.paper,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          backgroundColor: color + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: colors.text.primary, lineHeight: 1.2 }}
        >
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary, fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  )
}

function CropNetCard({ row, onViewLogs }) {
  const pctDistributed =
    row.harvested > 0 ? Math.min((row.distributed / row.harvested) * 100, 100) : 0
  const pctComposted =
    row.harvested > 0
      ? Math.min((row.composted / row.harvested) * 100, 100 - pctDistributed)
      : 0
  const isPositive = row.available >= 0

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${colors.background.section}`,
        backgroundColor: colors.background.paper,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Crop name + net badge */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.text.primary }}>
          {row.cropType}
        </Typography>
        <Chip
          icon={
            isPositive ? (
              <TrendingUpIcon sx={{ fontSize: '14px !important', color: `${colors.primary.main} !important` }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: '14px !important', color: `${colors.error.main} !important` }} />
            )
          }
          label={`${row.available.toFixed(1)} lb`}
          size="small"
          sx={{
            backgroundColor: isPositive ? `${colors.primary.main}18` : `${colors.error.main}18`,
            color: isPositive ? colors.primary.main : colors.error.main,
            fontWeight: 700,
            fontSize: '0.72rem',
          }}
        />
      </Stack>

      {/* Visual usage bar */}
      {row.harvested > 0 && (
        <Box mb={2}>
          <Box
            sx={{
              height: 7,
              borderRadius: 4,
              backgroundColor: colors.background.section,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* distributed portion */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${pctDistributed}%`,
                backgroundColor: colors.accent.main,
                borderRadius: '4px 0 0 4px',
                transition: 'width 0.5s ease',
              }}
            />
            {/* composted portion */}
            <Box
              sx={{
                position: 'absolute',
                left: `${pctDistributed}%`,
                top: 0,
                height: '100%',
                width: `${pctComposted}%`,
                backgroundColor: '#6B8E23',
                transition: 'width 0.5s ease',
              }}
            />
          </Box>
          <Stack direction="row" spacing={1.5} mt={0.75}>
            {[
              { color: colors.accent.main, label: 'Distributed' },
              { color: '#6B8E23', label: 'Composted' },
              { color: colors.background.section, label: 'Remaining', outlined: true },
            ].map(({ color, label, outlined }) => (
              <Stack key={label} direction="row" spacing={0.5} alignItems="center">
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: 1,
                    backgroundColor: color,
                    ...(outlined && { border: `1px solid ${colors.text.disabled}` }),
                  }}
                />
                <Typography variant="caption" sx={{ color: colors.text.disabled, fontSize: '0.65rem' }}>
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {/* Stat rows */}
      <Stack spacing={0.75} sx={{ flex: 1 }}>
        {[
          {
            icon: <GrassIcon sx={{ fontSize: 13, color: colors.primary.main }} />,
            label: 'Harvested',
            value: `${row.harvested.toFixed(1)} lb`,
          },
          {
            icon: <LocalShippingIcon sx={{ fontSize: 13, color: colors.accent.main }} />,
            label: 'Distributed',
            value: `−${row.distributed.toFixed(1)} lb`,
          },
          {
            icon: <RecyclingIcon sx={{ fontSize: 13, color: '#6B8E23' }} />,
            label: 'Composted',
            value: `−${row.composted.toFixed(1)} lb`,
          },
        ].map(({ icon, label, value }) => (
          <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={0.75} alignItems="center">
              {icon}
              <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                {label}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ fontWeight: 600, color: colors.text.primary }}>
              {value}
            </Typography>
          </Stack>
        ))}

        {/* Net divider + total */}
        <Box sx={{ pt: 1, mt: 0.5, borderTop: `1.5px dashed ${colors.background.section}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary }}>
              Net Available
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                color: isPositive ? colors.primary.main : colors.error.main,
              }}
            >
              {row.available.toFixed(1)} lb
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* View / manage logs link */}
      {onViewLogs && (
        <Box mt={1.5} pt={1.5} sx={{ borderTop: `1px solid ${colors.background.section}` }}>
          <Button
            size="small"
            startIcon={<FormatListBulletedIcon sx={{ fontSize: '14px !important' }} />}
            onClick={(e) => { e.stopPropagation(); onViewLogs(row.cropType) }}
            sx={{
              color: colors.primary.main,
              textTransform: 'none',
              fontSize: '0.72rem',
              p: 0,
              minWidth: 0,
              fontWeight: 600,
              '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
            }}
          >
            View &amp; manage logs
          </Button>
        </Box>
      )}
    </Paper>
  )
}

export default function InventoryStats({ logs, isAdmin, netTotals = [], onViewCropLogs }) {
  const harvestLogs = logs.filter((l) => l.type === 'harvest')
  const distributionLogs = logs.filter((l) => l.type === 'distribution')
  const compostLogs = logs.filter((l) => l.type === 'compost')
  const seedLogs = logs.filter((l) => l.type === 'seed')

  const totalHarvestWeight = harvestLogs.reduce((sum, l) => sum + (l.weightKg || 0), 0)
  const totalPeopleServed = distributionLogs.reduce((sum, l) => sum + (l.peopleServed || 0), 0)

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<GrassIcon sx={{ fontSize: 24, color: colors.primary.main }} />}
            label="Harvest Logs"
            value={harvestLogs.length}
            color={colors.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ScaleIcon sx={{ fontSize: 24, color: colors.primary.light }} />}
            label="Total Harvested (lb)"
            value={totalHarvestWeight.toFixed(1)}
            color={colors.primary.light}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<RecyclingIcon sx={{ fontSize: 24, color: '#6B8E23' }} />}
            label="Compost Logs"
            value={compostLogs.length}
            color={'#6B8E23'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<SpaIcon sx={{ fontSize: 24, color: '#8D6E63' }} />}
            label="Seed Logs"
            value={seedLogs.length}
            color={'#8D6E63'}
          />
        </Grid>
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<LocalShippingIcon sx={{ fontSize: 24, color: colors.accent.main }} />}
                label="Distribution Logs"
                value={distributionLogs.length}
                color={colors.accent.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<PeopleIcon sx={{ fontSize: 24, color: colors.secondary.dark }} />}
                label="People Served"
                value={totalPeopleServed.toLocaleString()}
                color={colors.secondary.dark}
              />
            </Grid>
          </>
        )}
      </Grid>

      {netTotals.length > 0 && (
        <Box mt={3}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <BalanceIcon sx={{ color: colors.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Net Available by Crop
            </Typography>
            <Chip
              label="harvest − distributed − composted"
              size="small"
              sx={{
                backgroundColor: colors.background.section,
                fontWeight: 500,
                fontSize: '0.7rem',
              }}
            />
          </Stack>

          <Grid container spacing={2}>
            {netTotals.map((row) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={row.cropType}>
                <CropNetCard row={row} onViewLogs={onViewCropLogs} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </>
  )
}
