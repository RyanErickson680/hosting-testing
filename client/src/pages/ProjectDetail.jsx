import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  Paper,
  LinearProgress,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import StarIcon from '@mui/icons-material/Star'
import { colors } from '../theme/colors'
import { getProject } from '../api/project'
import { getDonationsByProject } from '../api/donation'
import StickyDonationCard from '../components/donations/StickyDonationCard'
import DonorComments from '../components/donations/DonorComments'
import SocialShare from '../components/donations/SocialShare'

/**
 * Project Detail Page
 * Displays detailed information about a specific donation project
 */
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [donationsWithMessages, setDonationsWithMessages] = useState([])
  const [donorCount, setDonorCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getProject({ id })
        setProject(response.data.project)
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id])

  // Fetch donations data (for donor count)
  useEffect(() => {
    const fetchDonations = async () => {
      if (!id) return
      try {
        const response = await getDonationsByProject({
          projectId: id,
          limit: 1, // We only need the donor count
          includeMessages: false,
        })
        setDonorCount(response.data.donorCount || 0)
      } catch (err) {
        console.error('Failed to load donations:', err)
      }
    }

    if (id) {
      fetchDonations()
    }
  }, [id])

  // Fetch donations with messages (for comments section)
  useEffect(() => {
    const fetchDonationsWithMessages = async () => {
      if (!id) return
      try {
        const response = await getDonationsByProject({
          projectId: id,
          limit: 20,
          includeMessages: true, // Only get donations with messages
        })
        setDonationsWithMessages(response.data.donations || [])
      } catch (err) {
        console.error('Failed to load donations with messages:', err)
      }
    }

    if (id) {
      fetchDonationsWithMessages()
    }
  }, [id])

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  // Calculate progress percentage
  const getProgress = () => {
    if (!project || project.goalAmount <= 0) return 0
    return Math.min(((project.currentAmount || 0) / project.goalAmount) * 100, 100)
  }

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!project?.timeline?.targetEndDate) return null
    const targetDate = new Date(project.timeline.targetEndDate)
    const now = new Date()
    const diffTime = targetDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Campaign ended', days: 0 }
    if (diffDays === 0) return { text: 'Ends today', days: 0 }
    if (diffDays === 1) return { text: '1 day remaining', days: 1 }
    return { text: `${diffDays} days remaining`, days: diffDays }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#F0FDF4'
      case 'completed':
        return '#F0FDF4'
      case 'proposed':
        return '#F0FDF4'
      default:
        return colors.background.section
    }
  }

  // Get status badge text color
  const getStatusTextColor = (status) => {
    switch (status) {
      case 'active':
        return '#166534'
      case 'completed':
        return '#166534'
      case 'proposed':
        return '#166534'
      default:
        return colors.text.secondary
    }
  }

  // Get status label
  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const handleDonate = () => {
    navigate(`/donate/${id}`)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
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
      </Container>
    )
  }

  if (error || !project) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ marginBottom: '24px' }}>
          {error || 'Project not found'}
        </Alert>
        <Button onClick={() => navigate('/donation-campaigns')}>
          Back to Projects
        </Button>
      </Container>
    )
  }

  const progress = getProgress()
  const currentAmount = project.currentAmount || 0
  const goalAmount = project.goalAmount || 0
  const timeRemaining = getTimeRemaining()

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/donation-campaigns')}
        sx={{
          color: colors.text.secondary,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '15px',
          marginBottom: '16px',
          padding: '6px 12px',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: colors.background.section,
            color: colors.text.primary,
          },
        }}
      >
        Back to All Campaigns
      </Button>

      <Grid container spacing={4}>
        {/* Main Content - Left Side */}
        <Grid item xs={12} md={8}>
          {/* Project Header */}
          <Box sx={{ marginBottom: '32px' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}
            >
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: '28px', md: '36px' },
                    fontWeight: 700,
                    color: colors.text.primary,
                    lineHeight: 1.2,
                  }}
                >
                  {project.name}
                </Typography>
                {(project.priority === 1 || project.priority === 2) && (
                  <StarIcon
                    sx={{
                      color: '#EAB308',
                      fontSize: { xs: '28px', md: '32px' },
                    }}
                  />
                )}
              </Box>
              <Chip
                label={getStatusLabel(project.status)}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(project.status),
                  color: getStatusTextColor(project.status),
                  fontWeight: 500,
                  fontSize: '12px',
                  height: '28px',
                }}
              />
            </Box>
          </Box>

          {/* Progress Section */}
          <Paper
            elevation={0}
            sx={{
              padding: '24px',
              backgroundColor: colors.background.paper,
              border: `1px solid ${colors.background.section}`,
              borderRadius: '12px',
              marginBottom: '32px',
            }}
          >
            {/* Amount raised */}
            <Box sx={{ marginBottom: '16px' }}>
              <Typography
                component="span"
                sx={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: colors.text.primary,
                }}
              >
                {formatCurrency(currentAmount)}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: '18px',
                  fontWeight: 400,
                  color: colors.text.secondary,
                  marginLeft: '8px',
                }}
              >
                raised of {formatCurrency(goalAmount)} goal
              </Typography>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ position: 'relative', marginBottom: '16px' }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#EDF7F1',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(to right, #166534, #4ADE80)',
                    borderRadius: 10,
                  },
                }}
              />
              {/* Milestone vertical bars at 25%, 50%, 75% */}
              {[25, 50, 75].map((milestone) => (
                <Box
                  key={milestone}
                  sx={{
                    position: 'absolute',
                    left: `${milestone}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: '#166534',
                    opacity: 0.4,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
              ))}
            </Box>

            {/* Stats Row */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                marginTop: '16px',
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: colors.text.primary,
                  }}
                >
                  {progress.toFixed(1)}%
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: colors.text.secondary,
                  }}
                >
                  Complete
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: colors.text.primary,
                  }}
                >
                  {donorCount}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: colors.text.secondary,
                  }}
                >
                  {donorCount === 1 ? 'Donor' : 'Donors'}
                </Typography>
              </Box>
              {timeRemaining && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: colors.text.primary,
                    }}
                  >
                    {timeRemaining.days}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: colors.text.secondary,
                    }}
                  >
                    {timeRemaining.text}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Mobile Donate Button */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                gap: 2,
                marginTop: '20px',
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                fullWidth
                onClick={handleDonate}
                sx={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '16px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#16A34A',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                  },
                }}
              >
                Donate Now
              </Button>
              <SocialShare project={project} />
            </Box>
          </Paper>

          {/* Project Info Section */}
          <Paper
            elevation={0}
            sx={{
              padding: '24px',
              backgroundColor: colors.background.paper,
              border: `1px solid ${colors.background.section}`,
              borderRadius: '12px',
              marginBottom: '32px',
            }}
          >
      <Typography
              variant="h5"
        sx={{
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '16px',
        }}
      >
              About this project
      </Typography>
      <Typography
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                color: colors.text.primary,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                marginBottom: '24px',
              }}
            >
              {project.description}
            </Typography>

            {/* Timeline Info */}
            {project.timeline && (
              <Box
        sx={{
                  padding: '16px',
                  backgroundColor: colors.background.section,
                  borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text.primary,
                    marginBottom: '8px',
                  }}
                >
                  Timeline
                </Typography>
                {project.timeline.startDate && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: colors.text.secondary,
                    }}
                  >
                    Started:{' '}
                    {new Date(project.timeline.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                )}
                {project.timeline.targetEndDate && (
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: colors.text.secondary,
                    }}
                  >
                    Target End:{' '}
                    {new Date(project.timeline.targetEndDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
      </Typography>
                )}
              </Box>
            )}

            {/* Gallery */}
            {project.images && project.images.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary, mb: 2 }}>
                  Gallery
                </Typography>
                <Grid container spacing={2}>
                  {project.images.map((img, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Box
                        sx={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: colors.background.section,
                          aspectRatio: '4/3',
                          position: 'relative',
                        }}
                      >
                        <Box
                          component="img"
                          src={img.url}
                          alt={img.caption || `Campaign image ${i + 1}`}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                        {img.caption && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              px: 1.5,
                              py: 0.75,
                              backgroundColor: 'rgba(0,0,0,0.55)',
                              color: '#fff',
                            }}
                          >
                            {img.caption}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Donor Comments Section */}
          <DonorComments donations={donationsWithMessages} loading={false} />
        </Grid>

        {/* Sticky Donation Card - Right Side (Desktop Only) */}
        <Grid item xs={12} md={4}>
          <StickyDonationCard project={project} />
        </Grid>
      </Grid>
    </Container>
  )
}
