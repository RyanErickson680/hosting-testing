import {
  Box,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Paper,
  Chip,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { colors } from '../../theme/colors'
import MuiButton from '@mui/material/Button'

const CROP_TYPES = [
  '',
  'Tomatoes',
  'Peppers',
  'Collard Greens',
  'Kale',
  'Lettuce',
  'Cucumbers',
  'Squash',
  'Zucchini',
  'Beans',
  'Herbs',
  'Carrots',
  'Onions',
  'Garlic',
  'Potatoes',
  'Sweet Potatoes',
  'Corn',
  'Okra',
  'Eggplant',
  'Strawberries',
  'Mixed Produce',
]

const ALL_TYPES = [
  { value: 'harvest', label: 'Harvest' },
  { value: 'compost', label: 'Compost' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'seed', label: 'Seed' },
]

export default function InventoryFilters({
  title = 'Filter Logs',
  filterType,
  filterCropType,
  filterStartDate,
  filterEndDate,
  loading,
  isAdmin,
  showTypeFilter = true,
  allowedTypes = null,
  itemLabel = 'Crop Type',
  itemOptions,
  freeTextItem = false,
  onTypeChange,
  onCropTypeChange,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
  onResetFilters,
  totalCount,
}) {
  const items = itemOptions || CROP_TYPES.filter(Boolean)
  const typeOptions = ALL_TYPES.filter((t) => {
    if (t.value === 'distribution' && !isAdmin) return false
    if (allowedTypes) return allowedTypes.includes(t.value)
    return true
  })
  const hasActiveFilters = filterType || filterCropType || filterStartDate || filterEndDate

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${colors.background.section}`,
        backgroundColor: colors.background.paper,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <FilterListIcon sx={{ color: colors.text.secondary }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {totalCount !== undefined && (
          <Chip
            label={`${totalCount} records`}
            size="small"
            sx={{
              backgroundColor: colors.background.section,
              fontWeight: 500,
            }}
          />
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'flex-end' }}
        flexWrap="wrap"
      >
        {showTypeFilter && (
          <TextField
            select
            label="Type"
            value={filterType}
            onChange={(e) => onTypeChange(e.target.value)}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All Types</MenuItem>
            {typeOptions.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>
        )}

        {freeTextItem ? (
          <TextField
            label={itemLabel}
            value={filterCropType}
            onChange={(e) => onCropTypeChange(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
            placeholder="Search..."
          />
        ) : (
          <TextField
            select
            label={itemLabel}
            value={filterCropType}
            onChange={(e) => onCropTypeChange(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {items.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Start Date"
          type="date"
          value={filterStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="End Date"
          type="date"
          value={filterEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
          InputLabelProps={{ shrink: true }}
        />

        <Stack direction="row" spacing={1}>
          <MuiButton
            variant="contained"
            onClick={onApplyFilters}
            disabled={loading}
            size="small"
            sx={{
              backgroundColor: colors.primary.main,
              '&:hover': { backgroundColor: colors.primary.dark },
              borderRadius: '8px',
              minWidth: 80,
            }}
          >
            Filter
          </MuiButton>
          {hasActiveFilters && (
            <MuiButton
              variant="outlined"
              onClick={onResetFilters}
              disabled={loading}
              size="small"
              sx={{
                borderColor: colors.text.disabled,
                color: colors.text.secondary,
                borderRadius: '8px',
                minWidth: 70,
              }}
            >
              Reset
            </MuiButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
