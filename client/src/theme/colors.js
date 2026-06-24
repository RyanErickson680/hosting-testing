/**
 * MCUF Color Palette — "The Living Archive" design system
 */

export const colors = {
  // Primary Deep Forest Green
  primary: {
    main: '#1b5e20',      // signature forest green — main CTAs, hero elements
    light: '#2e7d32',     // lighter variant
    dark: '#00450d',      // deep action states, high-authority type
    contrastText: '#ffffff',
  },

  // Secondary — Earthy Brown ("Soil")
  secondary: {
    main: '#7a5649',
    light: '#9c7b6e',
    dark: '#5c3f35',
    contrastText: '#ffffff',
  },

  // Accent — Harvest Gold ("Tertiary")
  accent: {
    main: '#503600',
    light: '#7a5200',
    dark: '#3a2600',
    contrastText: '#ffffff',
  },

  // Soft green highlight for success states / subtle highlights
  primaryFixed: '#acf4a4',

  // On-surface text — never pure black
  text: {
    primary: '#181d1b',
    secondary: '#3d4d43',
    disabled: '#8fa898',
  },

  // Surface hierarchy (tonal layering, no borders)
  background: {
    default: '#f6faf7',       // mint-tinted off-white — page background
    paper: '#ffffff',          // highest focus — cards, inputs
    section: '#f1f5f2',        // surface-container-low — sidebar, secondary sections
  },

  // Error / Alerts
  error: {
    main: '#C94C4C',
    light: '#E57373',
    dark: '#B71C1C',
    contrastText: '#ffffff',
  },

  // Success (primary green family)
  success: {
    main: '#1b5e20',
    light: '#2e7d32',
    dark: '#00450d',
    contrastText: '#ffffff',
  },

  // Warning (harvest gold)
  warning: {
    main: '#f57f17',
    light: '#ff8f00',
    dark: '#e65100',
    contrastText: '#ffffff',
  },

  // Info
  info: {
    main: '#1b5e20',
    light: '#2e7d32',
    dark: '#00450d',
    contrastText: '#ffffff',
  },
}

export const tailwindColors = {
  'primary': colors.primary.main,
  'primary-light': colors.primary.light,
  'primary-dark': colors.primary.dark,
  'secondary': colors.secondary.main,
  'secondary-light': colors.secondary.light,
  'secondary-dark': colors.secondary.dark,
  'accent': colors.accent.main,
  'accent-light': colors.accent.light,
  'accent-dark': colors.accent.dark,
  'text-primary': colors.text.primary,
  'text-secondary': colors.text.secondary,
  'bg-default': colors.background.default,
  'bg-paper': colors.background.paper,
  'bg-section': colors.background.section,
  'error': colors.error.main,
  'success': colors.success.main,
  'warning': colors.warning.main,
}

export default colors
