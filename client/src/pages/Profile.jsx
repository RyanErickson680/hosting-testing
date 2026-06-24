import { Box, Typography, Container, Paper, Avatar, Divider } from '@mui/material'
import { colors } from '../theme/colors'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          Loading...
        </Typography>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          No user data available
        </Typography>
      </Container>
    )
  }

  const getUserInitials = () => {
    const first = user.firstName?.[0] || ''
    const last = user.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '32px',
        }}
      >
        Profile
      </Typography>

      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 2,
          backgroundColor: colors.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              backgroundColor: colors.primary.main,
              fontSize: '32px',
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: colors.text.primary,
                mb: 0.5,
              }}
            >
              {user.firstName} {user.lastName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.text.secondary,
                textTransform: 'capitalize',
              }}
            >
              {user.role || 'Donor'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: colors.text.secondary,
                mb: 1,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              Email
            </Typography>
            <Typography variant="body1" sx={{ color: colors.text.primary }}>
              {user.email}
            </Typography>
          </Box>

          {user.contactInfo?.phone && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: colors.text.secondary,
                  mb: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                Phone
              </Typography>
              <Typography variant="body1" sx={{ color: colors.text.primary }}>
                {user.contactInfo.phone}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: colors.text.secondary,
                mb: 1,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              Member Since
            </Typography>
            <Typography variant="body1" sx={{ color: colors.text.primary }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          {user.donorProfile && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: colors.text.secondary,
                  mb: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                Donation Summary
              </Typography>
              <Typography variant="body1" sx={{ color: colors.text.primary }}>
                Total Donated: ${user.donorProfile.totalAmountDonated?.toFixed(2) || '0.00'}
              </Typography>
              {user.donorProfile.recurringDonationCount > 0 && (
                <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 0.5 }}>
                  Active Recurring Donations: {user.donorProfile.recurringDonationCount}
                </Typography>
              )}
            </Box>
          )}

          {user.volunteerProfile && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: colors.text.secondary,
                  mb: 1,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                Volunteer Summary
              </Typography>
              <Typography variant="body1" sx={{ color: colors.text.primary }}>
                Total Hours: {user.volunteerProfile.totalHoursVolunteered?.toFixed(1) || '0.0'} hours
              </Typography>
              <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 0.5 }}>
                Waiver: {user.volunteerProfile.waiverSigned ? 'Signed' : 'Not signed'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  )
}
