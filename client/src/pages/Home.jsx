import { useState } from 'react'
import { Box, Typography, Grid, Button, LinearProgress } from '@mui/material'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateNewsletterSubscription } from '../api/user'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import GroupsIcon from '@mui/icons-material/Groups'
import MapIcon from '@mui/icons-material/Map'
import { colors } from '../theme/colors'
import { useHomeContent } from '../context/HomeContentContext'

export default function Home() {
  const navigate = useNavigate()
  const { content } = useHomeContent()
  const { user, isAuthenticated, updateUser } = useAuth()
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  const handleDonate = () => navigate('/donation-campaigns')
  const handleVolunteer = () => navigate('/volunteer-opportunities')
  const handleJoinHarvest = () =>
    navigate(isAuthenticated ? '/volunteer-opportunities' : '/signup')

  const visibleVolunteer = content.happeningNow.volunteerOpportunities.filter((op) => op.visible)
  const visibleCampaigns = content.happeningNow.campaigns.filter((c) => c.visible)

  const pad = { xs: '20px', sm: '32px' }

  return (
    // Break out of Layout's 32px padding so sections can go full-bleed
    <Box sx={{ mx: { xs: '-20px', sm: '-32px' }, mt: { xs: '-20px', sm: '-32px' }, mb: { xs: '-20px', sm: '-32px' } }}>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          mx: 2,
          mt: 2,
          borderRadius: '2.5rem',
          minHeight: { xs: 480, md: 600 },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: [
            'linear-gradient(to bottom, rgba(0,69,13,0.35), rgba(0,69,13,0.78))',
            `url('${content.hero.image || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=2000'}') center/cover no-repeat`,
          ].join(', '),
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 4, md: 8 }, maxWidth: 680 }}>
          <Typography
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: { xs: '2.25rem', md: '3.75rem' },
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              mb: 3,
            }}
          >
            {content.hero.title}
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: { xs: '1rem', md: '1.1rem' },
              mb: 4.5,
              maxWidth: 460,
              lineHeight: 1.75,
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 500,
            }}
          >
            {content.hero.subtitle}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              onClick={handleVolunteer}
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: '#ffffff',
                color: colors.primary.dark,
                px: 4,
                py: 1.5,
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#acf4a4', boxShadow: 'none' },
              }}
            >
              Get Involved
            </Button>
            <Button
              onClick={handleDonate}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#ffffff',
                px: 4,
                py: 1.5,
                borderRadius: '0.75rem',
                fontWeight: 700,
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)', boxShadow: 'none' },
              }}
            >
              Donate Now
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ── Impact Stats ─────────────────────────────────────────────── */}
      <Box sx={{ px: pad, py: 8 }}>
        <Grid container spacing={3}>
          {[
            { Icon: AgricultureIcon, bg: '#acf4a4', iconColor: colors.primary.dark, idx: 0 },
            { Icon: VolunteerActivismIcon, bg: '#fdcdbc', iconColor: '#7a5649', idx: 1 },
            { Icon: HomeWorkIcon, bg: '#ffdeac', iconColor: '#503600', idx: 2 },
          ].map(({ Icon, bg, iconColor, idx }) => (
            <Grid item xs={12} md={4} key={idx}>
              <Box
                sx={{
                  p: 5,
                  borderRadius: '2rem',
                  backgroundColor: colors.background.section,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '1rem',
                    backgroundColor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Icon sx={{ fontSize: 32, color: iconColor }} />
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: colors.primary.dark,
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {content.stats[idx]?.value}
                </Typography>
                <Typography
                  sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, color: colors.text.secondary }}
                >
                  {content.stats[idx]?.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Choose Your Path (Bento Grid) ────────────────────────────── */}
      <Box sx={{ backgroundColor: colors.background.paper, py: 8 }}>
        <Box sx={{ px: pad }}>
          <Box sx={{ mb: 7 }}>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                color: colors.primary.dark,
                letterSpacing: '-0.02em',
                mb: 1.5,
              }}
            >
              Choose Your Path
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Manrope, sans-serif',
                color: colors.text.secondary,
                maxWidth: 520,
                fontSize: '1.05rem',
              }}
            >
              Every contribution helps our garden grow and our community thrive.
            </Typography>
          </Box>

          {/* CSS 12-column grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
              gap: 3,
            }}
          >
            {/* Volunteer — 8/12 */}
            <Box
              sx={{
                gridColumn: { xs: 'span 1', md: 'span 8' },
                borderRadius: '2.5rem',
                background: [
                  `linear-gradient(to top, ${colors.primary.dark} 0%, rgba(27,94,32,0.15) 100%)`,
                  "url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&fit=crop') center/cover no-repeat",
                ].join(', '),
                p: { xs: 5, md: 6 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                color: '#ffffff',
                minHeight: 280,
              }}
            >
              <Typography
                sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.75rem', mb: 1.5 }}
              >
                Become a Volunteer
              </Typography>
              <Typography
                sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 420, fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem' }}
              >
                Get your hands in the soil. Join weekly shifts to learn urban farming while giving back to your neighbors.
              </Typography>
              <Button
                onClick={handleVolunteer}
                endIcon={<ChevronRightIcon />}
                sx={{
                  backgroundColor: '#acf4a4',
                  color: '#0c5216',
                  px: 3,
                  py: 1.25,
                  borderRadius: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif',
                  textTransform: 'none',
                  boxShadow: 'none',
                  alignSelf: 'flex-start',
                  '&:hover': { backgroundColor: '#91d78a', boxShadow: 'none' },
                }}
              >
                Sign Up to Help
              </Button>
            </Box>

            {/* Donors — 4/12 */}
            <Box
              sx={{
                gridColumn: { xs: 'span 1', md: 'span 4' },
                borderRadius: '2.5rem',
                backgroundColor: '#fdcdbc',
                p: 5,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 280,
              }}
            >
              <ShoppingBagIcon sx={{ fontSize: 36, color: '#795548', mb: 2 }} />
              <Typography
                sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#795548', mb: 1.5 }}
              >
                Sustain Growth
              </Typography>
              <Typography sx={{ color: 'rgba(121,85,72,0.8)', fontFamily: 'Manrope, sans-serif', mb: 3, flex: 1, fontSize: '0.9rem', lineHeight: 1.7 }}>
                Your donations directly fund seeds, tools, and educational programs for local youth.
              </Typography>
              <Button
                onClick={handleDonate}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: '#795548',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif',
                  p: 0,
                  alignSelf: 'flex-start',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                }}
              >
                Monthly Giving
              </Button>
            </Box>

            {/* Community — 4/12 */}
            <Box
              sx={{
                gridColumn: { xs: 'span 1', md: 'span 4' },
                borderRadius: '2.5rem',
                backgroundColor: '#6e4b00',
                p: 5,
                display: 'flex',
                flexDirection: 'column',
                color: '#ffffff',
                minHeight: 280,
              }}
            >
              <GroupsIcon sx={{ fontSize: 36, color: '#ffdeac', mb: 2 }} />
              <Typography
                sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.5rem', mb: 1.5 }}
              >
                Community Access
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Manrope, sans-serif', mb: 3, flex: 1, fontSize: '0.9rem', lineHeight: 1.7 }}>
                Apply for a garden plot or join our CSA program to receive fresh, hyper-local produce weekly.
              </Typography>
              <Button
                onClick={handleJoinHarvest}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: '#ffdeac',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontFamily: 'Manrope, sans-serif',
                  p: 0,
                  alignSelf: 'flex-start',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                }}
              >
                Join the Harvest
              </Button>
            </Box>

            {/* Location — 8/12 */}
            <Box
              sx={{
                gridColumn: { xs: 'span 1', md: 'span 8' },
                borderRadius: '2.5rem',
                backgroundColor: colors.background.section,
                p: 5,
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 280,
              }}
            >
              <Box sx={{ zIndex: 1, flex: 1 }}>
                <Typography
                  sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.5rem', color: colors.primary.dark, mb: 1.5 }}
                >
                  Visit the Farm
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', mb: 3, lineHeight: 1.75 }}>
                  {content.location.address}<br />{content.location.hours}
                </Typography>
                <a
                  href="https://maps.app.goo.gl/HQRsh9bgknMvRNX77"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.primary.dark,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    padding: 0,
                    textDecoration: 'none',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  <MapIcon style={{ marginRight: 8 }} />
                  View Map
                </a>
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '50%',
                  background: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&fit=crop') center/cover no-repeat",
                  opacity: 0.15,
                  filter: 'grayscale(100%)',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Happening Now ─────────────────────────────────────────────── */}
      <Box sx={{ px: pad, py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 7 }}>
          <Box>
            <Typography
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: { xs: '2rem', md: '2.5rem' },
                fontWeight: 700,
                color: colors.primary.dark,
                letterSpacing: '-0.02em',
                mb: 1.5,
              }}
            >
              Happening Now
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem' }}>
              Active opportunities to root yourself in our mission.
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/volunteer-opportunities')}
            sx={{
              color: colors.primary.dark,
              textTransform: 'none',
              fontWeight: 700,
              fontFamily: 'Manrope, sans-serif',
              display: { xs: 'none', md: 'flex' },
            }}
          >
            View All Events
          </Button>
        </Box>

        <Grid container spacing={4}>
          {/* Volunteer opportunity card */}
          <Grid item xs={12} md={6}>
            {(() => {
              const op = visibleVolunteer[0]
              return (
                <Box
                  onClick={handleVolunteer}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 3,
                    backgroundColor: colors.background.paper,
                    p: 3,
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 8px 32px rgba(24,29,27,0.08)' },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '100%', sm: 160 },
                      height: 160,
                      borderRadius: '1rem',
                      flexShrink: 0,
                      background: 'linear-gradient(145deg, #1b4332 0%, #2d6a4f 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VolunteerActivismIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.45)' }} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#7a5649', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1, fontFamily: 'Manrope, sans-serif' }}>
                      Volunteer Drive
                    </Typography>
                    <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
                      {op?.title ?? 'Summer Harvest Crew'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2.5, lineHeight: 1.65 }}>
                      {op?.description ?? 'We need extra hands this weekend to help with our seasonal harvest. No experience needed.'}
                    </Typography>
                    <Button
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                      onClick={(e) => { e.stopPropagation(); handleVolunteer() }}
                      sx={{ color: colors.primary.dark, textTransform: 'none', fontWeight: 700, fontFamily: 'Manrope, sans-serif', p: 0, fontSize: '0.875rem', alignSelf: 'flex-start', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                    >
                      Claim a Spot
                    </Button>
                  </Box>
                </Box>
              )
            })()}
          </Grid>

          {/* Campaign card */}
          <Grid item xs={12} md={6}>
            {(() => {
              const c = visibleCampaigns[0]
              return (
                <Box
                  onClick={handleDonate}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 3,
                    backgroundColor: colors.background.paper,
                    p: 3,
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 8px 32px rgba(24,29,27,0.08)' },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '100%', sm: 160 },
                      height: 160,
                      borderRadius: '1rem',
                      flexShrink: 0,
                      background: 'linear-gradient(145deg, #5c3d2e 0%, #7a5649 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingBagIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.45)' }} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography sx={{ color: '#503600', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1, fontFamily: 'Manrope, sans-serif' }}>
                      Campaign
                    </Typography>
                    <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>
                      {c?.title ?? 'Seedling Education Fund'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 2, lineHeight: 1.65 }}>
                      {c?.description ?? 'Help us raise funds for our youth farm education program. Every contribution sponsors a student.'}
                    </Typography>
                    {(c?.progress ?? 72) !== undefined && (
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={c?.progress ?? 72}
                          sx={{
                            height: 6,
                            borderRadius: '999px',
                            backgroundColor: colors.background.section,
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${colors.primary.dark}, ${colors.primary.main})`,
                              borderRadius: '999px',
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.75 }}>
                          <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>
                            {c?.progress ?? 72}% Funded
                          </Typography>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleDonate() }}
                            sx={{ color: colors.primary.dark, textTransform: 'none', fontWeight: 700, fontFamily: 'Manrope, sans-serif', p: 0, minWidth: 0, fontSize: '0.75rem', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                          >
                            Donate Now
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              )
            })()}
          </Grid>
        </Grid>
      </Box>

      {/* ── Newsletter ────────────────────────────────────────────────── */}
      <Box sx={{ px: pad, pb: 10 }}>
        <Box
          sx={{
            backgroundColor: colors.primary.dark,
            borderRadius: '3rem',
            p: { xs: 5, md: 10 },
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          <Box sx={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', backgroundColor: 'rgba(172,244,164,0.08)', mr: -8, mt: -8, pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 150, height: 150, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', backgroundColor: 'rgba(253,205,188,0.08)', ml: -5, mb: -5, pointerEvents: 'none' }} />
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 560, mx: 'auto' }}>
            <Typography
              sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: { xs: '2.25rem', md: '3rem' }, fontWeight: 800, color: '#ffffff', mb: 2 }}
            >
              Stay Rooted
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', mb: 5, fontFamily: 'Manrope, sans-serif' }}>
              Sign up for our monthly field notes, recipes from the garden, and upcoming community events.
            </Typography>
            {isAuthenticated ? (
              <>
                <Button
                  disabled={newsletterLoading}
                  onClick={async () => {
                    setNewsletterLoading(true)
                    try {
                      const next = !user?.newsletterSubscribed
                      await updateNewsletterSubscription(next)
                      updateUser({ ...user, newsletterSubscribed: next })
                    } catch (err) {
                      alert('Failed to update newsletter subscription. Please try again.')
                    }
                    setNewsletterLoading(false)
                  }}
                  sx={{
                    backgroundColor: user?.newsletterSubscribed ? 'rgba(255,255,255,0.15)' : '#ffffff',
                    color: user?.newsletterSubscribed ? '#ffffff' : colors.primary.dark,
                    border: user?.newsletterSubscribed ? '1px solid rgba(255,255,255,0.4)' : 'none',
                    px: 5,
                    py: 1.75,
                    borderRadius: '1rem',
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: user?.newsletterSubscribed ? 'rgba(255,255,255,0.25)' : '#acf4a4', boxShadow: 'none' },
                  }}
                >
                  {user?.newsletterSubscribed ? 'Subscribed ✓' : 'Subscribe'}
                </Button>
                {user?.newsletterSubscribed && (
                  <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontFamily: 'Manrope, sans-serif' }}>
                    You'll be notified when new events and campaigns are posted.
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  sx={{
                    backgroundColor: '#ffffff',
                    color: colors.primary.dark,
                    px: 5,
                    py: 1.75,
                    borderRadius: '1rem',
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { backgroundColor: '#acf4a4', boxShadow: 'none' },
                  }}
                >
                  Sign in to subscribe
                </Button>
                <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontFamily: 'Manrope, sans-serif' }}>
                  Create a free account to get notified about new events and campaigns.
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Box sx={{ backgroundColor: colors.background.section, borderRadius: '2rem 2rem 0 0', px: pad, pt: 8, pb: 6 }}>
        <Grid container spacing={6} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, color: colors.primary.main, fontSize: '1.1rem', mb: 2 }}>
              Mill Creek Urban Farm
            </Typography>
            <Typography variant="body2" sx={{ color: '#7a5649', maxWidth: 260, lineHeight: 1.75 }}>
              Cultivating a sustainable future through urban agriculture and community-driven food systems.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Typography sx={{ fontWeight: 700, color: colors.primary.dark, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 2.5, fontFamily: 'Manrope, sans-serif' }}>
                  Explore
                </Typography>
                {[
                  { label: 'About Us', href: 'https://www.millcreekurbanfarm.org/about-1' },
                  { label: 'Contact', href: 'https://www.millcreekurbanfarm.org/general-6' },
                  { label: 'Programs', href: 'https://www.millcreekurbanfarm.org/services-7-2' },
                ].map(({ label, href }) => (
                  <Typography key={label} component="a" href={href} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ display: 'block', color: '#7a5649', mb: 1.5, cursor: 'pointer', textDecoration: 'none', '&:hover': { color: colors.primary.main } }}>
                    {label}
                  </Typography>
                ))}
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontWeight: 700, color: colors.primary.dark, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 2.5, fontFamily: 'Manrope, sans-serif' }}>
                  Support
                </Typography>
                {[
                  { label: 'Donate', action: handleDonate },
                  { label: 'Volunteer', action: handleVolunteer },
                  { label: 'Sponsorship', action: () => window.open('mailto:hello@millcreekurbanfarm.org', '_self') },
                ].map(({ label, action }) => (
                  <Typography key={label} variant="body2" onClick={action} sx={{ color: '#7a5649', mb: 1.5, cursor: 'pointer', '&:hover': { color: colors.primary.main } }}>
                    {label}
                  </Typography>
                ))}
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography sx={{ fontWeight: 700, color: colors.primary.dark, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 2.5, fontFamily: 'Manrope, sans-serif' }}>
              Connect
            </Typography>
            {content.footer.contact && (
              <Typography variant="body2" sx={{ color: '#7a5649', mb: 2, lineHeight: 1.75 }}>
                {content.footer.contact}
              </Typography>
            )}
            {content.footer.social && (
              <Typography variant="body2" sx={{ color: '#7a5649', mb: 2, lineHeight: 1.75 }}>
                {content.footer.social}
              </Typography>
            )}
            {content.footer.email && (
              <Typography
                component="a"
                href={`mailto:${content.footer.email}`}
                sx={{ color: colors.primary.main, fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {content.footer.email}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Box sx={{ borderTop: '1px solid rgba(192,201,187,0.2)', pt: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#7a5649', fontFamily: 'Manrope, sans-serif' }}>
            {content.footer.nonprofit}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            {[
              { label: 'Resources', href: 'https://www.millcreekurbanfarm.org/general-1' },
              { label: 'Gallery', href: 'https://www.millcreekurbanfarm.org/gallery' },
            ].map(({ label, href }) => (
              <Typography key={label} component="a" href={href} target="_blank" rel="noopener noreferrer" variant="body2" sx={{ color: '#7a5649', cursor: 'pointer', textDecoration: 'none', '&:hover': { color: colors.primary.main, textDecoration: 'underline' } }}>
                {label}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
