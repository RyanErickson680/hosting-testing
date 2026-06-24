import { createTheme } from '@mui/material/styles'
import { colors } from './colors'

/**
 * MUI Theme — "The Living Archive" design system
 *
 * Key principles:
 * - Plus Jakarta Sans for expressive headers, Manrope for body text
 * - Tonal layering instead of shadows or 1px dividers
 * - Rounded corners: 0.5rem (buttons/inputs), 1–1.5rem (cards)
 * - Gradient primary buttons; no-border secondary buttons
 * - Ghost borders on inputs (visible only on focus)
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
      contrastText: colors.error.contrastText,
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
      contrastText: colors.warning.contrastText,
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
      contrastText: colors.info.contrastText,
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
      contrastText: colors.success.contrastText,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
  },
  typography: {
    // Plus Jakarta Sans for headlines, Manrope for body
    fontFamily: [
      'Manrope',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    // Display / major impact
    h1: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 800,
      fontSize: '3.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.1,
      color: colors.text.primary,
    },
    // Section headers
    h2: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      fontSize: '2.25rem',
      letterSpacing: '-0.01em',
      color: colors.text.primary,
    },
    // Dashboard welcomes, headline medium
    h3: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.005em',
      color: colors.text.primary,
    },
    h4: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      fontSize: '1.375rem',
      color: colors.text.primary,
    },
    h5: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      color: colors.text.primary,
    },
    h6: {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      color: colors.text.primary,
    },
    // Title medium — card titles, prominent list items
    subtitle1: {
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 600,
      fontSize: '1.125rem',
      color: colors.text.primary,
    },
    subtitle2: {
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 600,
      fontSize: '0.875rem',
      color: colors.text.secondary,
    },
    // Body large — all descriptive content
    body1: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '1rem',
      color: colors.text.primary,
    },
    body2: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '0.875rem',
      color: colors.text.secondary,
    },
    // Label medium — tags, metadata, all-caps labels
    caption: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '0.75rem',
      letterSpacing: '0.02em',
      color: colors.text.secondary,
    },
    overline: {
      fontFamily: 'Manrope, sans-serif',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: colors.text.secondary,
    },
    button: {
      fontFamily: 'Manrope, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 8, // 0.5rem default for small elements
  },
  shadows: [
    'none',
    // Level 1: ambient float
    '0px 12px 32px rgba(24, 29, 27, 0.06)',
    '0px 12px 32px rgba(24, 29, 27, 0.06)',
    '0px 12px 32px rgba(24, 29, 27, 0.08)',
    '0px 12px 32px rgba(24, 29, 27, 0.08)',
    '0px 16px 40px rgba(24, 29, 27, 0.10)',
    '0px 16px 40px rgba(24, 29, 27, 0.10)',
    '0px 16px 40px rgba(24, 29, 27, 0.10)',
    '0px 20px 48px rgba(24, 29, 27, 0.10)',
    '0px 20px 48px rgba(24, 29, 27, 0.10)',
    '0px 20px 48px rgba(24, 29, 27, 0.12)',
    '0px 20px 48px rgba(24, 29, 27, 0.12)',
    '0px 24px 56px rgba(24, 29, 27, 0.12)',
    '0px 24px 56px rgba(24, 29, 27, 0.12)',
    '0px 24px 56px rgba(24, 29, 27, 0.12)',
    '0px 24px 56px rgba(24, 29, 27, 0.14)',
    '0px 24px 56px rgba(24, 29, 27, 0.14)',
    '0px 28px 64px rgba(24, 29, 27, 0.14)',
    '0px 28px 64px rgba(24, 29, 27, 0.14)',
    '0px 28px 64px rgba(24, 29, 27, 0.14)',
    '0px 28px 64px rgba(24, 29, 27, 0.16)',
    '0px 28px 64px rgba(24, 29, 27, 0.16)',
    '0px 32px 72px rgba(24, 29, 27, 0.16)',
    '0px 32px 72px rgba(24, 29, 27, 0.16)',
    '0px 32px 72px rgba(24, 29, 27, 0.18)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          color: colors.text.primary,
          fontFamily: 'Manrope, sans-serif',
        },
        '*': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.5rem',
          fontWeight: 600,
          padding: '10px 24px',
          fontFamily: 'Manrope, sans-serif',
          letterSpacing: '0.01em',
        },
        // Gradient primary — "soul and depth"
        containedPrimary: {
          background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
          color: '#ffffff',
          boxShadow: 'none',
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
            boxShadow: '0px 8px 24px rgba(27, 94, 32, 0.25)',
          },
        },
        // Secondary — surface-container with on-surface text, no border
        containedSecondary: {
          backgroundColor: colors.background.section,
          color: colors.text.primary,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#e4ebe5',
            boxShadow: 'none',
          },
        },
        // Outlined — ghost border style
        outlinedPrimary: {
          borderColor: `rgba(192, 201, 187, 0.4)`,
          color: colors.primary.main,
          '&:hover': {
            borderColor: colors.primary.main,
            backgroundColor: 'rgba(27, 94, 32, 0.04)',
          },
        },
        // Text/tertiary — transparent with underline on hover
        textPrimary: {
          color: colors.primary.main,
          '&:hover': {
            backgroundColor: 'rgba(27, 94, 32, 0.06)',
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          borderRadius: '1.25rem',
          boxShadow: 'none',
          border: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          backgroundImage: 'none',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0px 12px 32px rgba(24, 29, 27, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: colors.background.paper,
            borderRadius: '0.5rem',
            fontFamily: 'Manrope, sans-serif',
            '& fieldset': {
              borderColor: 'rgba(192, 201, 187, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(192, 201, 187, 0.6)',
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'Manrope, sans-serif',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.02em',
          borderRadius: '999px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(192, 201, 187, 0.2)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(27, 94, 32, 0.1)',
            color: colors.primary.main,
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(27, 94, 32, 0.14)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.75rem',
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          color: colors.text.primary,
          boxShadow: '0px 4px 16px rgba(24, 29, 27, 0.12)',
          borderRadius: '0.5rem',
        },
        arrow: {
          color: 'rgba(255,255,255,0.9)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 700,
          backgroundColor: colors.primary.main,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          backgroundColor: '#c8e6c9',
        },
        bar: {
          borderRadius: '999px',
          backgroundColor: colors.primary.main,
        },
      },
    },
  },
})

export default muiTheme
