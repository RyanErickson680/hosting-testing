import { useState, useEffect } from 'react'
import { Box, TextField, Typography, Checkbox, FormControlLabel, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { colors } from '../../theme/colors'
import { useAuth } from '../../context/AuthContext'

/**
 * Donor Information Section Component
 * Displays pre-filled info for logged-in users or form for guests
 */
export default function DonorInfoSection({
  firstName,
  lastName,
  email,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  createAccount,
  onCreateAccountChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  errors = {},
}) {
  const { isAuthenticated, user } = useAuth()

  // Initialize with user data if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (!firstName && user.firstName) {
        onFirstNameChange(user.firstName)
      }
      if (!lastName && user.lastName) {
        onLastNameChange(user.lastName)
      }
      if (!email && user.email) {
        onEmailChange(user.email)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  if (isAuthenticated && user) {
    // Logged-in user view
    return (
      <Box sx={{ marginBottom: '24px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            marginBottom: '16px',
          }}
        >
          <CheckCircleIcon
            sx={{
              color: colors.primary.main,
              fontSize: '20px',
            }}
          />
          <Chip
            label={`Donating as: ${firstName && lastName ? `${firstName} ${lastName}` : `${user.firstName} ${user.lastName}`}`}
            sx={{
              backgroundColor: colors.background.section,
              color: colors.primary.main,
              fontWeight: 600,
              fontSize: '14px',
            }}
          />
        </Box>

        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 400,
            color: colors.text.secondary,
            marginBottom: '16px',
          }}
        >
          You can edit your information below if needed.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, marginBottom: '16px' }}>
          <TextField
            label="First Name"
            value={firstName || ''}
            onChange={(e) => onFirstNameChange(e.target.value)}
            fullWidth
            required
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
          <TextField
            label="Last Name"
            value={lastName || ''}
            onChange={(e) => onLastNameChange(e.target.value)}
            fullWidth
            required
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
        </Box>

        <TextField
          label="Email"
          type="email"
          value={email || ''}
          onChange={(e) => onEmailChange(e.target.value)}
          fullWidth
          required
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
      </Box>
    )
  }

  // Guest user view
  return (
    <Box sx={{ marginBottom: '24px' }}>
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 600,
          color: colors.text.primary,
          marginBottom: '16px',
        }}
      >
        Donor Information
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, marginBottom: '16px' }}>
        <TextField
          label="First Name"
          value={firstName || ''}
          onChange={(e) => onFirstNameChange(e.target.value)}
          fullWidth
          required
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
        <TextField
          label="Last Name"
          value={lastName || ''}
          onChange={(e) => onLastNameChange(e.target.value)}
          fullWidth
          required
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
      </Box>

      <TextField
        label="Email"
        type="email"
        value={email || ''}
        onChange={(e) => onEmailChange(e.target.value)}
        fullWidth
        required
        sx={{
          marginBottom: '16px',
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

      <FormControlLabel
        control={
          <Checkbox
            checked={createAccount}
            onChange={(e) => onCreateAccountChange(e.target.checked)}
            sx={{
              color: colors.primary.main,
              '&.Mui-checked': {
                color: colors.primary.main,
              },
            }}
          />
        }
        label="Create an account to track your donations"
        sx={{
          marginBottom: createAccount ? '16px' : 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '15px',
            fontWeight: 400,
            color: colors.text.primary,
          },
        }}
      />

      {createAccount && (
        <>
          <TextField
            label="Password"
            type="password"
            value={password || ''}
            onChange={(e) => onPasswordChange(e.target.value)}
            fullWidth
            required
            error={!!errors.password}
            helperText={errors.password || 'Minimum 8 characters'}
            sx={{
              marginTop: '8px',
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
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword || ''}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            fullWidth
            required
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            sx={{
              marginTop: '16px',
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
        </>
      )}
    </Box>
  )
}
