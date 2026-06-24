import { useState, useEffect } from 'react'
import { Box, Button, TextField, Typography, InputAdornment } from '@mui/material'
import { colors } from '../../theme/colors'

/**
 * Donation Amount Selector Component
 * Quick select buttons and custom amount input
 */
export default function DonationAmountSelector({ value, onChange, error }) {
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const quickAmounts = [10, 25, 50, 100, 250, 500]

  const handleQuickAmountClick = (amount) => {
    setCustomAmount('')
    setIsCustom(false)
    onChange(amount)
  }

  const handleCustomAmountChange = (e) => {
    const inputValue = e.target.value
    // Remove any non-numeric characters except decimal point
    const cleanValue = inputValue.replace(/[^0-9.]/g, '')
    setCustomAmount(cleanValue)
    setIsCustom(true)

    // Parse the numeric value
    const numericValue = parseFloat(cleanValue)
    if (!isNaN(numericValue) && numericValue > 0) {
      onChange(numericValue)
    } else if (cleanValue === '') {
      onChange(null)
    }
  }

  // Check if current value is a quick amount
  useEffect(() => {
    if (value && quickAmounts.includes(value)) {
      setIsCustom(false)
      setCustomAmount('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
        Donation Amount
      </Typography>

      {/* Quick Select Buttons */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {quickAmounts.map((amount) => (
          <Button
            key={amount}
            variant={!isCustom && value === amount ? 'contained' : 'outlined'}
            onClick={() => handleQuickAmountClick(amount)}
            sx={{
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 600,
              padding: '12px 16px',
              borderRadius: '8px',
              borderColor: !isCustom && value === amount ? colors.primary.main : colors.background.section,
              backgroundColor: !isCustom && value === amount ? colors.primary.main : 'transparent',
              color: !isCustom && value === amount ? colors.primary.contrastText : colors.text.primary,
              '&:hover': {
                borderColor: colors.primary.main,
                backgroundColor: !isCustom && value === amount ? colors.primary.dark : colors.background.section,
              },
            }}
          >
            ${amount}
          </Button>
        ))}
      </Box>

      {/* Custom Amount Input */}
      <TextField
        fullWidth
        label="Custom Amount"
        placeholder="0.00"
        value={
          isCustom
            ? customAmount.replace(/[$,]/g, '')
            : value && !quickAmounts.includes(value)
            ? value.toFixed(2)
            : ''
        }
        onChange={handleCustomAmountChange}
        onFocus={() => {
          if (value && quickAmounts.includes(value)) {
            setIsCustom(true)
            setCustomAmount(value.toString())
          }
        }}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        inputProps={{
          inputMode: 'decimal',
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover fieldset': {
              borderColor: colors.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
            },
          },
        }}
      />

      {value && value < 1 && (
        <Typography
          sx={{
            fontSize: '13px',
            color: colors.error.main,
            marginTop: '8px',
          }}
        >
          Minimum donation amount is $1.00
        </Typography>
      )}
    </Box>
  )
}
