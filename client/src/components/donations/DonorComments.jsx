import { Box, Typography, Paper, Avatar, Chip } from '@mui/material'
import RepeatIcon from '@mui/icons-material/Repeat'
import { colors } from '../../theme/colors'

/**
 * Donor Comments Component
 * Displays recent donations with donor names and messages
 */
export default function DonorComments({ donations, loading }) {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'A'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Only show messages for completed payments (defense in depth with API)
  const donationsWithMessages =
    donations?.filter((donation) => donation.message && donation.paymentStatus === 'completed') || []

  if (loading) {
    return (
      <Box sx={{ marginTop: '32px' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: '24px',
          }}
        >
          Recent Donor Messages
        </Typography>
        <Typography
          sx={{
            color: colors.text.secondary,
          }}
        >
          Loading...
        </Typography>
      </Box>
    )
  }

  if (donationsWithMessages.length === 0) {
    return (
      <Box sx={{ marginTop: '32px' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: '24px',
          }}
        >
          Recent Donor Messages
        </Typography>
        <Paper
          elevation={0}
          sx={{
            padding: '32px',
            backgroundColor: colors.background.section,
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              color: colors.text.secondary,
              fontStyle: 'italic',
            }}
          >
            No donor messages yet. Be the first to leave a message with your donation!
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ marginTop: '32px' }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '24px',
        }}
      >
        Recent Donor Messages
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {donationsWithMessages.map((donation) => (
          <Paper
            key={donation._id}
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
                {getInitials(
                  donation.donor?.displayName || donation.donor?.name || 'Anonymous'
                )}
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
                      {donation.donor?.displayName || donation.donor?.name || 'Anonymous'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: '2px' }}>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: colors.primary.main,
                        }}
                      >
                        {formatCurrency(donation.amount)}
                      </Typography>
                      {donation.recurringInterval && (
                        <Chip
                          icon={<RepeatIcon sx={{ fontSize: '14px !important' }} />}
                          label={`Recurring ${donation.recurringInterval}`}
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
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: 400,
                      color: colors.text.secondary,
                    }}
                  >
                    {formatDate(donation.donatedAt)}
                  </Typography>
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
                  {donation.message}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}
