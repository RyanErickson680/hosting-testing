import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Container, Divider, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GppBadIcon from '@mui/icons-material/GppBad'
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import { colors } from '../theme/colors'
import { getAccountWaiverDetails, approveAccountWaiver } from '../api/auth'
import { WAIVER_TEXT } from '../constants/waiverText'

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

function FieldRow({ label, value, blank }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'flex-end', gap: 0.5, mr: 4, mb: 1 }}>
      <Typography sx={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: colors.text.primary, whiteSpace: 'nowrap' }}>
        {label}:
      </Typography>
      {blank ? (
        <Box sx={{ borderBottom: `1px solid ${colors.text.secondary}`, minWidth: 120, mb: '2px' }} />
      ) : (
        <Typography sx={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: colors.text.primary, fontWeight: 500, borderBottom: `1px solid ${colors.text.secondary}`, minWidth: 120, mb: '2px', pb: '1px' }}>
          {value}
        </Typography>
      )}
    </Box>
  )
}

/**
 * One volunteer liability waiver for your account (same link flow as registration).
 * After signing, you can register for events that require a waiver.
 */
export default function WaiverApproval() {
  const { token } = useParams()

  const [status, setStatus] = useState('loading') // loading | ready | submitting | done | error
  const [details, setDetails] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    getAccountWaiverDetails(token)
      .then(({ data }) => {
        if (!cancelled) {
          setDetails(data)
          setStatus('ready')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            err?.response?.data?.error ||
            'This waiver link is invalid, has already been used, or has expired.'
          setErrorMsg(msg)
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleApprove() {
    setStatus('submitting')
    try {
      await approveAccountWaiver(token)
      setStatus('done')
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        'Something went wrong. Please try again or contact us.'
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const volunteer = details?.volunteer ?? {}
  const firstName = volunteer.firstName ?? ''
  const lastName = volunteer.lastName ?? ''
  const email = volunteer.email ?? ''

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Box
        sx={{
          backgroundColor: colors.background.paper,
          borderRadius: '1.5rem',
          boxShadow: '0px 12px 40px rgba(24, 29, 27, 0.06)',
          p: { xs: 4, md: 6 },
        }}
      >
        {status === 'loading' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ color: colors.primary.main }} />
            <Typography sx={{ mt: 2, color: colors.text.secondary, fontFamily: 'Manrope, sans-serif' }}>
              Loading waiver…
            </Typography>
          </Box>
        )}

        {status === 'ready' && (
          <>
            {/* Page icon + title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#e5f4e8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <HistoryEduIcon sx={{ fontSize: 36, color: colors.primary.main }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: '1.4rem', md: '1.7rem' },
                  color: colors.primary.dark,
                }}
              >
                Volunteer Release Waiver of Liability
              </Typography>
            </Box>

            {/* Header block */}
            <Box
              sx={{
                backgroundColor: colors.background.section,
                borderRadius: '1rem',
                p: 3,
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.85rem',
                  color: colors.text.secondary,
                  mb: 2,
                }}
              >
                <strong>The Release and Waiver of Liability executed on:</strong> {today}
              </Typography>

              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.85rem',
                  color: colors.text.primary,
                  mb: 0.5,
                }}
              >
                I hereby agree to accept a position as a volunteer for MILL CREEK URBAN FARM.
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.85rem',
                  color: colors.text.primary,
                  mb: 2.5,
                }}
              >
                I acknowledge I have read and accept these conditions.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {/* Volunteer info fields */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 1 }}>
                <FieldRow label="FIRST NAME" value={firstName} />
                <FieldRow label="LAST NAME" value={lastName} />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 1, mt: 1 }}>
                <FieldRow label="Email address" value={email} />
                <FieldRow label="Phone Number" blank />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 1, mt: 1 }}>
                <FieldRow label="Age of Volunteer" blank />
                <FieldRow label="Parent/Guardian" blank />
              </Box>
              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.75rem',
                  color: colors.text.secondary,
                  mt: 1,
                  fontStyle: 'italic',
                }}
              >
                (if under 17 years old, please have parent/guardian sign)
              </Typography>
            </Box>

            {/* Full legal text */}
            <Box
              sx={{
                backgroundColor: colors.background.section,
                borderRadius: '1rem',
                p: 3,
                mb: 3,
                maxHeight: 420,
                overflowY: 'auto',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: colors.primary.main,
                  mb: 1.5,
                }}
              >
                Liability Waiver &amp; Release — Full Terms
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '0.82rem',
                  color: colors.text.secondary,
                  lineHeight: 1.75,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {WAIVER_TEXT}
              </Typography>
            </Box>

            {/* Signature block */}
            <Box
              sx={{
                border: `1px solid ${colors.primary.light ?? '#c8e6c9'}`,
                borderRadius: '1rem',
                p: 3,
                mb: 4,
                backgroundColor: '#f9fdf9',
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}
                  >
                    Signature
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Dancing Script", "Brush Script MT", cursive',
                      fontSize: '1.4rem',
                      color: colors.primary.dark,
                      borderBottom: `1px solid ${colors.text.secondary}`,
                      pb: '2px',
                    }}
                  >
                    {firstName} {lastName}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}
                  >
                    Today's Date
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '0.9rem',
                      color: colors.text.primary,
                      borderBottom: `1px solid ${colors.text.secondary}`,
                      pb: '2px',
                    }}
                  >
                    {today}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Button
              fullWidth
              onClick={handleApprove}
              sx={{
                backgroundColor: colors.primary.dark,
                color: '#ffffff',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                py: 1.75,
                borderRadius: '0.875rem',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: colors.primary.main,
                  boxShadow: '0px 8px 24px rgba(27, 94, 32, 0.2)',
                },
              }}
            >
              I Approve This Waiver
            </Button>
          </>
        )}

        {status === 'submitting' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={48} sx={{ color: colors.primary.main }} />
            <Typography sx={{ mt: 2, color: colors.text.secondary, fontFamily: 'Manrope, sans-serif' }}>
              Saving your approval…
            </Typography>
          </Box>
        )}

        {status === 'done' && (
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#e5f4e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 44, color: colors.primary.main }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: '1.6rem',
                color: colors.primary.dark,
                mb: 1,
              }}
            >
              Waiver approved
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1rem',
                color: colors.text.secondary,
                mb: 2,
              }}
            >
              You can now sign up for volunteer events that require a waiver — go to Volunteer Opportunities
              and complete your registration for any event you had in mind.
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#fdecea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <GppBadIcon sx={{ fontSize: 44, color: colors.error.main }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800,
                fontSize: '1.5rem',
                color: colors.error.dark,
                mb: 1,
              }}
            >
              Unable to load waiver
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.95rem',
                color: colors.text.secondary,
              }}
            >
              {errorMsg}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  )
}
