import { Box, Typography, Paper } from '@mui/material'
import { colors } from '../theme/colors'

/**
 * Reusable card for role explanations
 * Used for Volunteer, Donor, and Shared Impact cards
 */
export default function RoleCard({ title, items, icon: Icon, stats }) {
  return (
    <Paper
      elevation={0}
      sx={{
        padding: '24px',
        borderRadius: '1.25rem',
        backgroundColor: colors.background.paper,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {Icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: colors.background.section,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary.main,
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        )}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: colors.text.primary,
          }}
        >
          {title}
        </Typography>
      </Box>

      {items && items.length > 0 && (
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            flex: 1,
          }}
        >
          {items.map((item, index) => (
            <Box
              key={index}
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '12px',
                '&::before': {
                  content: '"•"',
                  color: colors.primary.main,
                  fontWeight: 'bold',
                  marginRight: '12px',
                  fontSize: '20px',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: colors.text.secondary,
                  lineHeight: 1.6,
                }}
              >
                {item}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {stats && (
        <Box
          sx={{
            marginTop: '16px',
            paddingTop: '16px',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colors.primary.main,
            }}
          >
            {stats}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
