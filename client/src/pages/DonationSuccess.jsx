import { useSearchParams, useNavigate } from 'react-router-dom'
import { Container, Paper, Typography, Button, Box } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { colors } from '../theme/colors'

/**
 * Donation Success Page
 * Shown after successful donation
 */
export default function DonationSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const donationId = searchParams.get('donationId')
  const txnId = searchParams.get('txnId')
  const projectId = searchParams.get('projectId')
  const amount = searchParams.get('amount')
  const currency = searchParams.get('currency')
  const projectName = searchParams.get('projectName')

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: colors.background.paper,
          border: `1px solid ${colors.background.section}`,
          borderRadius: '12px',
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: '80px',
            color: '#4ADE80',
            marginBottom: '24px',
          }}
        />
        <Typography variant="h4" sx={{ marginBottom: '16px', fontWeight: 700 }}>
          Thank You for Your Donation!
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: '16px', color: colors.text.secondary }}>
          Your donation has been processed successfully. A confirmation email has been sent to you.
        </Typography>
        {amount && (
          <Typography variant="h6" sx={{ marginBottom: '32px', fontWeight: 600, color: colors.text.primary }}>
            {projectName
              ? `Thank you! Your $${parseFloat(amount).toFixed(2)} donation to ${projectName} has been processed.`
              : `Thank you! Your $${parseFloat(amount).toFixed(2)} donation has been processed.`}
          </Typography>
        )}
        {txnId && (
          <Typography variant="body2" sx={{ marginBottom: '8px', color: colors.text.secondary }}>
            PayPal Transaction ID: {txnId}
          </Typography>
        )}
        {donationId && (
          <Typography variant="body2" sx={{ marginBottom: '32px', color: colors.text.secondary }}>
            Reference ID: {donationId}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {projectId && (
            <Button
              variant="contained"
              onClick={() => navigate(`/donation-campaigns/${projectId}`)}
              sx={{
                backgroundColor: colors.primary.main,
                textTransform: 'none',
              }}
            >
              View Project
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => navigate('/impact')}
            sx={{
              backgroundColor: colors.primary.main,
              textTransform: 'none',
            }}
          >
            Impact
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{
              textTransform: 'none',
            }}
          >
            Return Home
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
