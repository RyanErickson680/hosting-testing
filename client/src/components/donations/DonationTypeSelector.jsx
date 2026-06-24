import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { colors } from '../../theme/colors'

/**
 * Donation Type Selector Component
 * Toggle between one-time and recurring donation options
 */
export default function DonationTypeSelector({ value, onChange }) {
  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      onChange(newValue)
    }
  }

  return (
    <Box sx={{ marginBottom: '24px' }}>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: colors.text.primary,
          marginBottom: '12px',
        }}
      >
        Donation Type
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        fullWidth
        sx={{
          '& .MuiToggleButtonGroup-grouped': {
            border: `1px solid ${colors.background.section}`,
            '&.Mui-disabled': {
              border: `1px solid ${colors.background.section}`,
            },
            '&:not(:first-of-type)': {
              borderLeft: `1px solid ${colors.background.section}`,
            },
          },
        }}
      >
        <ToggleButton
          value="once"
          sx={{
            textTransform: 'none',
            fontSize: '15px',
            fontWeight: 500,
            padding: '12px 24px',
            color: value === 'once' ? colors.primary.contrastText : colors.text.primary,
            backgroundColor: value === 'once' ? colors.primary.main : colors.background.paper,
            '&:hover': {
              backgroundColor: value === 'once' ? colors.primary.dark : colors.background.section,
            },
          }}
        >
          One-time
        </ToggleButton>
        <ToggleButton
          value="recurring"
          sx={{
            textTransform: 'none',
            fontSize: '15px',
            fontWeight: 500,
            padding: '12px 24px',
            color: value === 'recurring' ? colors.primary.contrastText : colors.text.primary,
            backgroundColor: value === 'recurring' ? colors.primary.main : colors.background.paper,
            '&:hover': {
              backgroundColor: value === 'recurring' ? colors.primary.dark : colors.background.section,
            },
          }}
        >
          Recurring
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
