import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import SortIcon from '@mui/icons-material/Sort'
import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import { colors } from '../theme/colors'
import { getProjects } from '../api/project'
import { getWishlist } from '../api/wishlist'
import { useHomeContent } from '../context/HomeContentContext'
import ProjectCard from '../components/donations/ProjectCard'

function PillButton({ icon: Icon, label, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 2,
        py: 0.75,
        borderRadius: '999px',
        backgroundColor: active ? 'rgba(27, 94, 32, 0.1)' : colors.background.paper,
        color: active ? colors.primary.main : colors.text.secondary,
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(27, 94, 32, 0.08)',
          color: colors.primary.main,
        },
      }}
    >
      <Icon sx={{ fontSize: 16 }} />
      {label}
    </Box>
  )
}

export default function DonationCampaigns() {
  const navigate = useNavigate()
  const { content } = useHomeContent()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortNewest, setSortNewest] = useState(false)
  const [showFilterBar, setShowFilterBar] = useState(false)
  const searchTimeoutRef = useRef(null)

  const [wishlistItems, setWishlistItems] = useState([])
  const [activeTab, setActiveTab] = useState(0)

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const response = await getProjects(params)
      let fetched = (response.data.projects || []).filter((p) => p.status !== 'proposed')
      if (sortNewest) {
        fetched = [...fetched].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
      setProjects(fetched)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setSearch(searchInput), 250)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [searchInput])

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, sortNewest])

  // Load wishlist from MongoDB
  useEffect(() => {
    getWishlist()
      .then((res) => setWishlistItems(res.data.items || []))
      .catch((err) => {
        console.error('Failed to load wishlist', err)
        setError('Failed to load wishlist items.')
      })
  }, [])

  const handleViewDetails = (project) => navigate(`/donation-campaigns/${project._id}`)
  const handleDonate = (project) => navigate(`/donate/${project._id}`)

  // Compute impact numbers from project data
  const totalRaised = projects.reduce((s, p) => s + (p.currentAmount || 0), 0)
  const annualTarget = content.impactStats?.annualSustainabilityTarget || 90000
  const overallProgress = annualTarget > 0 ? Math.min((totalRaised / annualTarget) * 100, 100) : 0

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Page header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 4,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: colors.primary.main, letterSpacing: '0.1em', mb: 0.5, display: 'block' }}
          >
            Fundraising
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.75 }}
          >
            Support Our Roots
          </Typography>
          <Typography variant="body1" sx={{ color: colors.text.secondary, maxWidth: 480 }}>
            Your contributions directly fund urban agriculture, education programs, and sustainable food access.
          </Typography>
        </Box>

        {/* Filter / Sort pills — only on Campaigns tab */}
        {activeTab === 0 && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: { xs: 0, sm: 1 } }}>
            <PillButton
              icon={FilterListIcon}
              label="Filter"
              active={showFilterBar || !!statusFilter}
              onClick={() => setShowFilterBar((v) => !v)}
            />
            <PillButton
              icon={SortIcon}
              label="Sort"
              active={sortNewest}
              onClick={() => setSortNewest((v) => !v)}
            />
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: colors.text.secondary,
          },
          '& .Mui-selected': { color: `${colors.primary.main} !important` },
          '& .MuiTabs-indicator': { backgroundColor: colors.primary.main },
        }}
      >
        <Tab label="Campaigns" />
        <Tab
          label={
            wishlistItems.filter((i) => !i.acquired).length > 0
              ? `Wishlist (${wishlistItems.filter((i) => !i.acquired).length})`
              : 'Wishlist'
          }
        />
      </Tabs>

      {/* Collapsible filter bar — Campaigns tab only */}
      {activeTab === 0 && showFilterBar && (
        <Box
          sx={{
            mb: 3,
            p: '14px 20px',
            backgroundColor: colors.background.paper,
            borderRadius: '1.25rem',
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Status pills */}
          {['', 'active', 'completed'].map((s) => (
            <Box
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: '999px',
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.8125rem',
                fontWeight: statusFilter === s ? 700 : 500,
                color: statusFilter === s ? colors.primary.main : colors.text.secondary,
                backgroundColor:
                  statusFilter === s ? 'rgba(27, 94, 32, 0.1)' : colors.background.section,
                transition: 'all 0.2s ease',
              }}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Box>
          ))}
          <Box
            component="input"
            placeholder="Search campaigns..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 180,
              border: 'none',
              outline: 'none',
              backgroundColor: colors.background.section,
              borderRadius: '0.5rem',
              px: 2,
              py: 0.75,
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.875rem',
              color: colors.text.primary,
              '&::placeholder': { color: colors.text.disabled },
            }}
          />
        </Box>
      )}

      {/* ── Campaigns tab ─────────────────────────────────────────── */}
      {activeTab === 0 && (
        <>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: colors.primary.main }} />
        </Box>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Impact numbers + campaigns */}
      {!loading && !error && (
        <>
          {projects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, color: colors.text.secondary }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No projects found
              </Typography>
              <Typography variant="body2">
                {statusFilter || search
                  ? 'Try adjusting your filters.'
                  : 'No projects are currently available.'}
              </Typography>
            </Box>
          ) : (
            <>
          {/* Your Impact in Numbers */}
          {projects.length > 0 && (
            <Box sx={{ mb: 8 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: colors.text.primary, mb: 3 }}
              >
                Your Impact in Numbers
              </Typography>
              <Grid container spacing={3}>
                {/* Overall goal tile — dark green */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      borderRadius: '1.25rem',
                      backgroundColor: colors.primary.dark,
                      p: 3.5,
                      color: '#ffffff',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.65)',
                        mb: 1,
                      }}
                    >
                      Overall Goal {new Date().getFullYear()}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1,
                        mb: 2,
                      }}
                    >
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(annualTarget)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={overallProgress}
                      sx={{
                        height: 6,
                        borderRadius: '999px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        mb: 1.5,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#acf4a4',
                          borderRadius: '999px',
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {Math.round(overallProgress)}% towards our annual sustainability target
                    </Typography>
                  </Box>
                </Grid>

                {/* Lbs composted */}
                <Grid item xs={12} sm={6} md={3.5}>
                  <Box
                    sx={{
                      borderRadius: '1.25rem',
                      backgroundColor: colors.background.paper,
                      p: 3.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <BoltIcon sx={{ fontSize: 28, color: colors.primary.main }} />
                    <Typography
                      sx={{
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: colors.text.primary,
                        lineHeight: 1,
                      }}
                    >
                      {content.impactStats.compostLbs.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                      Lbs Organic Waste Composted
                    </Typography>
                  </Box>
                </Grid>

                {/* Food baskets — earthy brown */}
                <Grid item xs={12} sm={6} md={3.5}>
                  <Box
                    sx={{
                      borderRadius: '1.25rem',
                      backgroundColor: colors.secondary.main,
                      p: 3.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <ShoppingBagIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.8)' }} />
                    <Typography
                      sx={{
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1,
                      }}
                    >
                      {content.impactStats.basketsProvided.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Community Food Baskets Provided
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 3-column grid */}
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project._id}>
                <ProjectCard
                  project={project}
                  isPast={project.status === 'completed' || project.status === 'past'}
                  onViewDetails={handleViewDetails}
                  onDonate={handleDonate}
                />
              </Grid>
            ))}

            {/* Start a Fundraiser CTA tile */}
            <Grid item xs={12} sm={6} md={4}>
              <Box
                sx={{
                  height: '100%',
                  minHeight: 280,
                  borderRadius: '1.25rem',
                  border: `1.5px dashed rgba(192, 201, 187, 0.6)`,
                  backgroundColor: colors.background.paper,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.primary.main,
                    backgroundColor: 'rgba(27, 94, 32, 0.03)',
                  },
                }}
                onClick={() => navigate('/donate')}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: `1.5px solid ${colors.text.secondary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.text.secondary,
                  }}
                >
                  <AddIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: colors.text.primary,
                    textAlign: 'center',
                  }}
                >
                  Make a General Donation
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                    textAlign: 'center',
                    maxWidth: 180,
                    lineHeight: 1.5,
                  }}
                >
                  Want to support the farm directly? Make a one-time or recurring donation to our general fund.
                </Typography>
              </Box>
            </Grid>
          </Grid>
            </>
          )}
        </>
      )}

        </> /* end campaigns tab */
      )}

      {/* ── Wishlist tab ──────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: colors.primary.main, letterSpacing: '0.1em', display: 'block', mb: 0.5 }}
            >
              Help Us Grow
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <CardGiftcardIcon sx={{ fontSize: 28, color: colors.primary.main }} />
              <Typography
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: { xs: '1.75rem', md: '2rem' },
                  fontWeight: 700,
                  color: colors.text.primary,
                  letterSpacing: '-0.02em',
                }}
              >
                Farm Wishlist
              </Typography>
            </Box>
            <Typography sx={{ color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', maxWidth: 520 }}>
              These are physical items our farm still needs. If you have one to donate or want to purchase one for us, every contribution helps.
            </Typography>
          </Box>

          {wishlistItems.filter((i) => !i.acquired).length === 0 && (
            <Box sx={{ textAlign: 'center', py: 10, color: colors.text.secondary }}>
              <CardGiftcardIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {wishlistItems.length > 0 ? 'All items acquired — thank you!' : 'No wishlist items yet.'}
              </Typography>
              <Typography variant="body2">Check back later for new items.</Typography>
            </Box>
          )}

          <Grid container spacing={2.5}>
            {wishlistItems
              .filter((item) => !item.acquired)
              .map((item) => {
                const priorityMeta = {
                  high: { label: 'High Priority', bg: '#FEF2F2', color: '#991b1b' },
                  medium: { label: 'Medium Priority', bg: '#FDF3CC', color: '#7c5e00' },
                  low: { label: 'Low Priority', bg: colors.background.section, color: colors.text.secondary },
                }
                const pm = priorityMeta[item.priority] || priorityMeta.medium
                return (
                  <Grid item xs={12} sm={6} md={4} key={item._id}>
                    <Box
                      sx={{
                        backgroundColor: colors.background.paper,
                        borderRadius: '1.25rem',
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        boxShadow: '0px 12px 32px rgba(24,29,27,0.04)',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '0.75rem',
                            backgroundColor: pm.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CardGiftcardIcon sx={{ fontSize: 20, color: pm.color }} />
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: colors.text.primary,
                              mb: 0.25,
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 1.25,
                              py: 0.25,
                              borderRadius: '999px',
                              backgroundColor: pm.bg,
                              color: pm.color,
                              fontFamily: 'Manrope, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {pm.label}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                        {item.price != null && (
                          <Typography
                            sx={{
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              fontWeight: 800,
                              fontSize: '1rem',
                              color: colors.primary.main,
                              lineHeight: 1,
                            }}
                          >
                            ${item.price.toLocaleString()}
                          </Typography>
                        )}
                        <Box
                          onClick={() => navigate('/donate')}
                          sx={{
                            px: 2,
                            py: 0.75,
                            borderRadius: '999px',
                            backgroundColor: 'rgba(27,94,32,0.08)',
                            color: colors.primary.main,
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.2s ease',
                            '&:hover': { backgroundColor: 'rgba(27,94,32,0.15)' },
                          }}
                        >
                          Donate
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                )
              })}
          </Grid>

          {/* Acquired progress bar */}
          {wishlistItems.some((i) => i.acquired) && (
            <Box
              sx={{
                mt: 4,
                p: 3,
                backgroundColor: colors.background.paper,
                borderRadius: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: colors.text.secondary, mb: 1 }}>
                  {wishlistItems.filter((i) => i.acquired).length} of {wishlistItems.length} items acquired — thank you!
                </Typography>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: '999px',
                    backgroundColor: colors.background.section,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      borderRadius: '999px',
                      width: `${Math.round((wishlistItems.filter((i) => i.acquired).length / wishlistItems.length) * 100)}%`,
                      background: `linear-gradient(90deg, ${colors.primary.dark}, ${colors.primary.main})`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Container>
  )
}
