import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Stack,
  Tooltip,
} from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'
import FacebookIcon from '@mui/icons-material/Facebook'
import TwitterIcon from '@mui/icons-material/Twitter'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import EmailIcon from '@mui/icons-material/Email'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { colors } from '../../theme/colors'

/**
 * Social Share Component
 * Provides sharing functionality for projects via social media and email
 * @param {Object} project - The project object to share
 * @param {string} buttonVariant - Button variant ('outlined' or undefined for icon button)
 * @param {boolean} fullWidth - Whether the button should be full width
 */
export default function SocialShare({ project, buttonVariant, fullWidth }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [copied, setCopied] = useState(false)

  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setCopied(false)
  }

  // Get current page URL
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/donation-campaigns/${project._id}`
    }
    return ''
  }

  // Get share text
  const getShareText = () => {
    return `Check out ${project.name} - ${project.description?.substring(0, 100)}...`
  }

  // Share to Facebook
  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl())
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'width=600,height=400'
    )
    handleClose()
  }

  // Share to Twitter/X
  const shareToTwitter = () => {
    const url = encodeURIComponent(getShareUrl())
    const text = encodeURIComponent(getShareText())
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      '_blank',
      'width=600,height=400'
    )
    handleClose()
  }

  // Share to LinkedIn
  const shareToLinkedIn = () => {
    const url = encodeURIComponent(getShareUrl())
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'width=600,height=400'
    )
    handleClose()
  }

  // Share via Email
  const shareViaEmail = () => {
    const url = getShareUrl()
    const subject = encodeURIComponent(`Check out: ${project.name}`)
    const body = encodeURIComponent(
      `${getShareText()}\n\n${url}`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    handleClose()
  }

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Shared Popover content
  const sharePopover = (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box sx={{ p: 2, minWidth: 200 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: colors.text.primary,
            marginBottom: 1.5,
          }}
        >
          Share this project
        </Typography>
        <Stack spacing={1}>
          <Button
            startIcon={<FacebookIcon />}
            onClick={shareToFacebook}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: colors.background.section,
              },
            }}
          >
            Facebook
          </Button>
          <Button
            startIcon={<TwitterIcon />}
            onClick={shareToTwitter}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: colors.background.section,
              },
            }}
          >
            Twitter/X
          </Button>
          <Button
            startIcon={<LinkedInIcon />}
            onClick={shareToLinkedIn}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: colors.background.section,
              },
            }}
          >
            LinkedIn
          </Button>
          <Button
            startIcon={<EmailIcon />}
            onClick={shareViaEmail}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: colors.background.section,
              },
            }}
          >
            Email
          </Button>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={copyToClipboard}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: colors.background.section,
              },
            }}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </Stack>
      </Box>
    </Popover>
  )

  // Render as outlined button if buttonVariant is provided
  if (buttonVariant === 'outlined') {
    return (
      <>
        <Button
          variant="outlined"
          fullWidth={fullWidth}
          startIcon={<ShareIcon />}
          onClick={handleClick}
          sx={{
            color: colors.primary.main,
            borderColor: colors.primary.main,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px',
            padding: '12px 24px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'transparent',
              color: colors.primary.dark,
              borderColor: colors.primary.dark,
            },
          }}
        >
          Share
        </Button>
        {sharePopover}
      </>
    )
  }

  // Default: Render as icon button
  return (
    <>
      <Tooltip title="Share project">
        <IconButton
          onClick={handleClick}
          sx={{
            color: colors.text.secondary,
            '&:hover': {
              color: colors.primary.main,
              backgroundColor: colors.background.section,
            },
          }}
        >
          <ShareIcon />
        </IconButton>
      </Tooltip>
      {sharePopover}
    </>
  )
}
