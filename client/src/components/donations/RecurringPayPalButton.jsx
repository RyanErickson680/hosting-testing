import { useState } from "react"
import { Button, Box, CircularProgress, Alert } from "@mui/material"
import { createRecurringSubscription } from "../../api/donation"
import { colors } from "../../theme/colors"

/**
 * Recurring PayPal Subscription Button
 * Creates subscription and redirects to PayPal for approval
 */
export default function RecurringPayPalButton({ 
  amount, 
  projectId, 
  interval,
  message,
  onSuccess, 
  onError,
  disabled 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await createRecurringSubscription({
        projectId,
        amount,
        interval,
        currency: "USD",
        message,
      })

      // Redirect to PayPal approval URL
      if (response.data.approvalUrl) {
        window.location.href = response.data.approvalUrl
      } else {
        throw new Error('No approval URL received from PayPal')
      }
    } catch (err) {
      setLoading(false)
      const errorMessage = err.response?.data?.error || err.message || "Failed to create subscription"
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  return (
    <Box sx={{ marginTop: '24px' }}>
      {error && (
        <Alert severity="error" sx={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      <Button
        variant="contained"
        fullWidth
        disabled={disabled || loading}
        onClick={handleClick}
        sx={{
          // PayPal "gold" — same family as PayPalButtons style.color "gold" (overrides theme primary gradient)
          background: '#FFC439',
          backgroundImage: 'none',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '18px',
          padding: '16px 32px',
          borderRadius: '50px',
          boxShadow: disabled
            ? 'none'
            : '0 2px 4px rgba(255, 196, 57, 0.3)',
          minHeight: '56px',
          letterSpacing: '0.5px',
          transition: 'all 0.2s ease-in-out',
          '&.MuiButton-containedPrimary': {
            background: '#FFC439',
            backgroundImage: 'none',
            '&:hover': {
              background: '#F2BA36',
              backgroundImage: 'none',
              boxShadow: '0 4px 8px rgba(255, 196, 57, 0.4)',
              transform: 'translateY(-1px)',
            },
          },
          '&.Mui-disabled': {
            background: '#E0E0E0',
            backgroundImage: 'none',
            color: '#9E9E9E',
          },
        }}
      >
        {loading ? (
          <CircularProgress size={24} sx={{ color: '#003087' }} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Box
              component="span"
              sx={{
                color: '#003087',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Pay
            </Box>
            <Box
              component="span"
              sx={{
                color: '#009CDE',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Pal
            </Box>
            <Box
              component="span"
              sx={{
                color: '#003087',
                fontSize: '16px',
                marginLeft: '8px',
              }}
            >
              - Subscribe
            </Box>
          </Box>
        )}
      </Button>
    </Box>
  )
}
