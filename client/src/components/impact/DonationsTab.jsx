import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import { colors } from '../../theme/colors'
import { getUserDonations, getUserRecurringDonations } from '../../api/donation'
import RecurringDonationCard from './RecurringDonationCard'
import DonationHistoryItem from './DonationHistoryItem'
import EmptyStateCard from './EmptyStateCard'
import FavoriteIcon from '@mui/icons-material/Favorite'

/**
 * Donations tab content component
 */
export default function DonationsTab() {
  const navigate = useNavigate()
  const [recurringDonations, setRecurringDonations] = useState([])
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDonationsData()
  }, [])

  const fetchDonationsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [recurringResponse, allDonations] = await Promise.all([
        getUserRecurringDonations(),
        fetchAllCompletedDonations(),
      ])

      setRecurringDonations(
        Array.isArray(recurringResponse.data?.recurringDonations)
          ? recurringResponse.data.recurringDonations
          : []
      )
      setDonations(
        Array.isArray(allDonations)
          ? allDonations
          : []
      )
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load donations')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllCompletedDonations = async () => {
    const pageSize = 100
    let skip = 0
    let total = 0
    const all = []

    do {
      const response = await getUserDonations({ limit: pageSize, skip })
      const page = Array.isArray(response.data?.donations) ? response.data.donations : []
      total = Number(response.data?.total || 0)
      all.push(...page)
      skip += page.length

      // Safety guard in case backend returns malformed pagination.
      if (page.length === 0) break
    } while (skip < total)

    return all
  }

  const handleBrowseCampaigns = () => {
    navigate('/donation-campaigns')
  }

  const safeRecurringDonations = Array.isArray(recurringDonations) ? recurringDonations : []
  const safeDonations = Array.isArray(donations) ? donations : []
  const hasNoData = safeRecurringDonations.length === 0 && safeDonations.length === 0

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ marginBottom: '24px' }}
        action={
          <button
            onClick={fetchDonationsData}
            style={{
              background: 'none',
              border: 'none',
              color: colors.error.main,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Retry
          </button>
        }
      >
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              marginBottom: '8px',
            }}
          >
            Your Donation Impact
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
            }}
          >
            Supporting our mission through your generous contributions
          </Typography>
        </Box>
      </Box>

      {hasNoData ? (
        <EmptyStateCard
          icon={FavoriteIcon}
          title="Start Supporting Our Mission"
          message="Your donations help us provide fresh produce to families in need. Every contribution makes a difference in our community."
          ctaLabel="Browse Donation Campaigns"
          ctaAction={handleBrowseCampaigns}
          variant="donations"
        />
      ) : (
        <>
          {/* Recurring Donations Section */}
          {safeRecurringDonations.length > 0 && (
            <Box sx={{ marginBottom: '40px' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: colors.text.primary,
                  marginBottom: '16px',
                }}
              >
                Recurring Donations
              </Typography>
              {safeRecurringDonations.map((recurring) => (
                <RecurringDonationCard key={recurring._id} recurringDonation={recurring} />
              ))}
            </Box>
          )}

          {/* Completed Donations Section */}
          {safeDonations.length > 0 && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: colors.text.primary,
                  }}
                >
                  All Donations
                </Typography>
              </Box>

              {/* Summary Card */}
              <Paper
                elevation={0}
                sx={{
                  padding: '20px',
                  backgroundColor: colors.background.section,
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: colors.primary.main,
                      }}
                    >
                      {safeDonations.length}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.text.secondary,
                      }}
                    >
                      Total Donations
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: colors.primary.main,
                      }}
                    >
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(
                        safeDonations.reduce((sum, d) => sum + (d.amount || 0), 0)
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.text.secondary,
                      }}
                    >
                      Total Donated
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Donations List */}
              {safeDonations.map((donation) => (
                <DonationHistoryItem key={donation._id} donation={donation} />
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
