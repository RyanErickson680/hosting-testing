# MCUF Color System

This directory contains the centralized color system for the MCUF application.

## Files

- **`colors.js`** - Centralized color definitions that can be imported and used throughout the app
- **`muiTheme.js`** - MUI theme configuration using the MCUF color palette

## Color Palette

### Primary Green (Action / Brand)
- **Main**: `#1F7A4A` (Forest Green)
- Use for: Primary buttons (Donate), headings, accents
- Tailwind: `bg-primary`, `text-primary`
- MUI: `theme.palette.primary.main`

### Secondary Green (Volunteer / Friendly CTA)
- **Main**: `#A7E6C7` (Fresh Mint)
- Use for: Volunteer buttons, highlights, badges
- Tailwind: `bg-secondary`, `text-secondary`
- MUI: `theme.palette.secondary.main`

### Accent / Growth Color
- **Main**: `#F2B705` (Warm Harvest Gold)
- Use for: Icons, progress bars, campaign highlights (sparingly)
- Tailwind: `bg-accent`, `text-accent`
- MUI: `theme.palette.accent.main` (custom)

### Neutral Text
- **Primary**: `#1F2933` (Charcoal)
- **Secondary**: `#4A5568`
- **Disabled**: `#A0AEC0`
- Tailwind: `text-text-primary`, `text-text-secondary`
- MUI: `theme.palette.text.primary`

### Backgrounds
- **Default**: `#F9FAF8` (Off-White)
- **Paper**: `#FFFFFF`
- **Section**: `#EEF5F0` (Soft Sage)
- Tailwind: `bg-default`, `bg-paper`, `bg-section`
- MUI: `theme.palette.background.default`

### Error / Alerts
- **Main**: `#C94C4C` (Muted Red)
- Tailwind: `bg-error`, `text-error`
- MUI: `theme.palette.error.main`

## Usage Examples

### Using Colors in JavaScript/React

```javascript
import { colors } from '../theme/colors'

// Use in inline styles
<div style={{ backgroundColor: colors.primary.main }}>
  Donate Now
</div>

// Use in styled components or CSS-in-JS
const StyledButton = styled.button`
  background-color: ${colors.primary.main};
  color: ${colors.primary.contrastText};
`
```

### Using Tailwind Classes

```jsx
// Primary green button
<button className="bg-primary text-white">
  Donate
</button>

// Secondary mint button
<button className="bg-secondary text-text-primary">
  Volunteer
</button>

// Accent gold highlight
<div className="bg-accent text-text-primary">
  Campaign Progress
</div>

// Section background
<section className="bg-section">
  Content here
</section>
```

### Using MUI Theme

```jsx
import { useTheme } from '@mui/material/styles'
import { Button, Box } from '@mui/material'

function MyComponent() {
  const theme = useTheme()
  
  return (
    <Box sx={{ backgroundColor: theme.palette.background.section }}>
      <Button variant="contained" color="primary">
        Donate
      </Button>
      <Button variant="contained" color="secondary">
        Volunteer
      </Button>
    </Box>
  )
}
```

### Using MUI with Custom Accent Color

```jsx
import { Button } from '@mui/material'

// Use sx prop for custom accent color
<Button
  sx={{
    backgroundColor: 'accent.main',
    color: 'accent.contrastText',
    '&:hover': {
      backgroundColor: 'accent.dark',
    },
  }}
>
  Campaign Highlight
</Button>
```

## Best Practices

1. **Always use the centralized colors** - Don't hardcode hex values
2. **Use semantic names** - `primary` for brand actions, `secondary` for volunteer CTAs
3. **Maintain contrast** - Ensure text is readable on colored backgrounds
4. **Use sparingly** - The accent gold should be used sparingly for highlights
5. **Consistent spacing** - Combine with consistent spacing and typography

## Color Accessibility

- Primary green (#1F7A4A) on white: ✅ WCAG AA compliant
- Secondary mint (#A7E6C7) with charcoal text: ✅ WCAG AA compliant
- Accent gold (#F2B705) with charcoal text: ✅ WCAG AA compliant
- All text colors meet minimum contrast ratios
