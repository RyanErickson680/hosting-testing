import { styled, ButtonBase } from '@mui/material'
import { colors } from '../theme/colors'

/**
 * Button component using MCUF color system
 * Updated to use the centralized color palette
 */
const CustomButton = styled(ButtonBase)({
  padding: '12px 16px',
  borderRadius: '8px', // Medium border radius, not pill
  backgroundColor: colors.primary.main,
  color: colors.primary.contrastText,
  fontWeight: 600,
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(31, 122, 74, 0.2)',

  '&:hover': {
    backgroundColor: colors.primary.dark,
    boxShadow: '0 4px 8px rgba(31, 122, 74, 0.3)',
    transform: 'translateY(-1px)',
  },

  '&:active': {
    transform: 'scale(0.98)',
  },
})

export default function Button({ children, ...props }) {
  return <CustomButton {...props}>{children}</CustomButton>
}
