/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Primary Green (Action / Brand)
        primary: {
          DEFAULT: '#1F7A4A', // Forest Green
          light: '#2A9D63',
          dark: '#165A35',
        },
        // Secondary Green (Volunteer / Friendly CTA)
        secondary: {
          DEFAULT: '#A7E6C7', // Fresh Mint
          light: '#C4F0DB',
          dark: '#8AD9B0',
        },
        // Accent / Growth Color
        accent: {
          DEFAULT: '#F2B705', // Warm Harvest Gold
          light: '#F5C842',
          dark: '#D9A204',
        },
        // Text Colors
        text: {
          primary: '#1F2933', // Charcoal
          secondary: '#4A5568',
          disabled: '#A0AEC0',
        },
        // Background Colors
        bg: {
          default: '#F9FAF8', // Off-White
          paper: '#FFFFFF',
          section: '#EEF5F0', // Soft Sage
        },
        // Error / Alerts
        error: {
          DEFAULT: '#C94C4C', // Muted Red
          light: '#E57373',
          dark: '#B71C1C',
        },
        // Success (using primary green)
        success: {
          DEFAULT: '#1F7A4A',
          light: '#2A9D63',
          dark: '#165A35',
        },
        // Warning (using accent gold)
        warning: {
          DEFAULT: '#F2B705',
          light: '#F5C842',
          dark: '#D9A204',
        },
      },
      backgroundColor: {
        default: '#F9FAF8', // Off-White
        paper: '#FFFFFF',
        section: '#EEF5F0', // Soft Sage
      },
      textColor: {
        primary: '#1F2933', // Charcoal
        secondary: '#4A5568',
        disabled: '#A0AEC0',
      },
    },
  },
  plugins: [],
}

