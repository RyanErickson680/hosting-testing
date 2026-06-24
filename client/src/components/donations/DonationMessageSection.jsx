import { useState } from 'react'
import { Box, TextField, Typography, Checkbox, FormControlLabel, Paper, Avatar, Chip } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import RepeatIcon from '@mui/icons-material/Repeat'
import { colors } from '../../theme/colors'

/**
 * Donation Message Section Component
 * Message input with public info text, anonymous checkbox, and preview
 */
export default function DonationMessageSection({
  message,
  onMessageChange,
  isAnonymous,
  onAnonymousChange,
  donorName,
  amount,
  donationType,
  interval,
}) {
  const maxLength = 500
  const remainingChars = maxLength - (message?.length || 0)

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name || name === 'Anonymous') return 'A'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const displayName = isAnonymous ? 'Anonymous' : donorName || 'Donor'

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
        Donation Message (Optional)
      </Typography>

      {/* Message Textarea */}
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="Leave a message of support..."
        value={message || ''}
        onChange={(e) => {
          const newValue = e.target.value
          if (newValue.length <= maxLength) {
            onMessageChange(newValue)
          }
        }}
        sx={{
          marginBottom: '12px',
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

      {/* Character Counter */}
      <Typography
        sx={{
          fontSize: '13px',
          color: colors.text.secondary,
          marginBottom: '12px',
          textAlign: 'right',
        }}
      >
        {remainingChars} characters remaining
      </Typography>

      {/* Info Text - Shows when message has content */}
      {message && message.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            padding: '12px',
            backgroundColor: colors.info.light,
            borderRadius: '8px',
            marginBottom: '16px',
          }}
        >
          <InfoIcon
            sx={{
              color: colors.primary.main,
              fontSize: '20px',
              marginTop: '2px',
            }}
          />
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: colors.text.primary,
              lineHeight: 1.5,
            }}
          >
            Your message will be shown publicly on the project page
          </Typography>
        </Box>
      )}

      {/* Anonymous Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={isAnonymous}
            onChange={(e) => onAnonymousChange(e.target.checked)}
            sx={{
              color: colors.primary.main,
              '&.Mui-checked': {
                color: colors.primary.main,
              },
            }}
          />
        }
        label="Make this donation anonymous"
        sx={{
          '& .MuiFormControlLabel-label': {
            fontSize: '15px',
            fontWeight: 400,
            color: colors.text.primary,
          },
        }}
      />

      {/* Preview - Shows when message exists */}
      {message && message.length > 0 && (
        <Box sx={{ marginTop: '20px' }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.text.secondary,
              marginBottom: '12px',
            }}
          >
            Preview
          </Typography>
          <Paper
            elevation={0}
            sx={{
              padding: '20px',
              backgroundColor: colors.background.paper,
              border: `1px solid ${colors.background.section}`,
              borderRadius: '12px',
            }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Avatar */}
              <Avatar
                sx={{
                  backgroundColor: colors.primary.main,
                  color: colors.primary.contrastText,
                  width: 48,
                  height: 48,
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {getInitials(displayName)}
              </Avatar>

              {/* Content */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: colors.text.primary,
                      }}
                    >
                      {displayName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: '2px' }}>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: colors.primary.main,
                        }}
                      >
                        {formatCurrency(amount)}
                      </Typography>
                      {donationType === 'recurring' && interval && (
                        <Chip
                          icon={<RepeatIcon sx={{ fontSize: '14px !important' }} />}
                          label={`Recurring ${interval}`}
                          size="small"
                          sx={{
                            backgroundColor: '#F0FDF4',
                            color: '#166534',
                            fontWeight: 500,
                            fontSize: '11px',
                            height: '22px',
                            '& .MuiChip-icon': {
                              color: '#166534',
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Typography
                  sx={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: colors.text.primary,
                    lineHeight: 1.6,
                    marginTop: '8px',
                  }}
                >
                  {message}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
