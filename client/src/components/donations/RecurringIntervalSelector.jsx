import { Box, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material'
import { colors } from '../../theme/colors'

/**
 * Recurring Interval Selector Component
 * Select monthly, quarterly, or yearly recurring donation interval
 */
export default function RecurringIntervalSelector({ value, onChange, amount }) {
  // Calculate next charge date based on interval
  const getNextChargeDate = (interval) => {
    const now = new Date()
    const nextDate = new Date(now)

    switch (interval) {
      case 'weekly':
        nextDate.setDate(now.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(now.getFullYear() + 1)
        break
      default:
        return null
    }

    return nextDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Get interval label
  const getIntervalLabel = (interval) => {
    switch (interval) {
      case 'weekly':
        return 'week'
      case 'monthly':
        return 'month'
      case 'yearly':
        return 'year'
      default:
        return ''
    }
  }

  if (!value) return null

  return (
    <Box sx={{ marginBottom: '24px' }}>
      <FormControl component="fieldset" fullWidth>
        <FormLabel
          component="legend"
          sx={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.text.primary,
            marginBottom: '12px',
          }}
        >
          Frequency
        </FormLabel>
        <RadioGroup
          value={value}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            '& .MuiFormControlLabel-root': {
              marginBottom: '8px',
            },
          }}
        >
          <FormControlLabel
            value="weekly"
            control={
              <Radio
                sx={{
                  color: colors.primary.main,
                  '&.Mui-checked': {
                    color: colors.primary.main,
                  },
                }}
              />
            }
            label="Weekly"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '15px',
                fontWeight: 500,
                color: colors.text.primary,
              },
            }}
          />
          <FormControlLabel
            value="monthly"
            control={
              <Radio
                sx={{
                  color: colors.primary.main,
                  '&.Mui-checked': {
                    color: colors.primary.main,
                  },
                }}
              />
            }
            label="Monthly"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '15px',
                fontWeight: 500,
                color: colors.text.primary,
              },
            }}
          />
          <FormControlLabel
            value="yearly"
            control={
              <Radio
                sx={{
                  color: colors.primary.main,
                  '&.Mui-checked': {
                    color: colors.primary.main,
                  },
                }}
              />
            }
            label="Yearly"
            sx={{
              '& .MuiFormControlLabel-label': {
                fontSize: '15px',
                fontWeight: 500,
                color: colors.text.primary,
              },
            }}
          />
        </RadioGroup>
      </FormControl>

      {/* Preview Section */}
      {amount && amount > 0 && (
        <Box
          sx={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: colors.background.section,
            borderRadius: '8px',
          }}
        >
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 500,
              color: colors.text.primary,
              marginBottom: '4px',
            }}
          >
            You'll be charged {formatCurrency(amount)} every {getIntervalLabel(value)}
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: colors.text.secondary,
            }}
          >
            Next charge: {getNextChargeDate(value)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
