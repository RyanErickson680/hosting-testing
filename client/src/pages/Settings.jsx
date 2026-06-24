import { useState } from 'react'
import {
  Box,
  Typography,
  Container,
  Stack,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { colors } from '../theme/colors'
import { useAuth } from '../context/AuthContext'
import {
  changePassword,
  updateOwnProfile,
  updateNewsletterSubscription,
  deleteOwnAccount,
} from '../api/user'

function Section({ title, children }) {
  return (
    <Box
      sx={{
        backgroundColor: colors.background.section,
        borderRadius: '1.25rem',
        p: { xs: 3, md: 4 },
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: colors.text.primary, mb: 3, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()

  // Profile
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [profileStatus, setProfileStatus] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Newsletter
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterStatus, setNewsletterStatus] = useState(null)

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState(null)

  const handleProfileSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileStatus({ type: 'error', message: 'First and last name are required.' })
      return
    }
    setProfileLoading(true)
    setProfileStatus(null)
    try {
      const res = await updateOwnProfile({ firstName: firstName.trim(), lastName: lastName.trim() })
      updateUser(res.data.user)
      setProfileStatus({ type: 'success', message: 'Profile updated.' })
    } catch (err) {
      setProfileStatus({ type: 'error', message: err.response?.data?.error || 'Update failed.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters.' })
      return
    }
    setPasswordLoading(true)
    setPasswordStatus(null)
    try {
      await changePassword({ currentPassword, newPassword })
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.response?.data?.error || 'Password change failed.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNewsletterToggle = async (e) => {
    const next = e.target.checked
    setNewsletterLoading(true)
    setNewsletterStatus(null)
    try {
      await updateNewsletterSubscription(next)
      updateUser({ ...user, newsletterSubscribed: next })
      setNewsletterStatus({ type: 'success', message: next ? 'Subscribed to newsletter.' : 'Unsubscribed from newsletter.' })
    } catch (err) {
      setNewsletterStatus({ type: 'error', message: err.response?.data?.error || 'Update failed.' })
    } finally {
      setNewsletterLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteStatus(null)
    try {
      await deleteOwnAccount()
      await logout()
      navigate('/')
    } catch (err) {
      setDeleteStatus({ type: 'error', message: err.response?.data?.error || 'Account deletion failed.' })
      setDeleteLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 800, color: colors.text.primary, mb: 1, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        Settings
      </Typography>
      <Typography variant="body1" sx={{ color: colors.text.secondary, mb: 4 }}>
        Manage your account preferences.
      </Typography>

      {/* Profile */}
      <Section title="Profile">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="First Name"
              size="small"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              label="Last Name"
              size="small"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Stack>
          <TextField
            label="Email"
            size="small"
            fullWidth
            value={user?.email || ''}
            disabled
            helperText="Contact an admin to change your email address."
          />
          {profileStatus && <Alert severity={profileStatus.type}>{profileStatus.message}</Alert>}
          <Box>
            <Button
              variant="contained"
              onClick={handleProfileSave}
              disabled={profileLoading}
              sx={{
                backgroundColor: colors.primary.main,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: colors.primary.dark },
              }}
            >
              {profileLoading ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </Section>

      {/* Password */}
      <Section title="Change Password">
        <Stack spacing={2}>
          <TextField
            label="Current Password"
            type="password"
            size="small"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            size="small"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="At least 8 characters."
          />
          <TextField
            label="Confirm New Password"
            type="password"
            size="small"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordStatus && <Alert severity={passwordStatus.type}>{passwordStatus.message}</Alert>}
          <Box>
            <Button
              variant="contained"
              onClick={handlePasswordChange}
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              sx={{
                backgroundColor: colors.primary.main,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: colors.primary.dark },
              }}
            >
              {passwordLoading ? <CircularProgress size={18} color="inherit" /> : 'Update Password'}
            </Button>
          </Box>
        </Stack>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={!!user?.newsletterSubscribed}
                onChange={handleNewsletterToggle}
                disabled={newsletterLoading}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primary.main }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.primary.main } }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
                  Newsletter
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  Get notified when new volunteer events or donation campaigns are posted.
                </Typography>
              </Box>
            }
          />
          {newsletterStatus && <Alert severity={newsletterStatus.type} sx={{ mt: 1 }}>{newsletterStatus.message}</Alert>}
        </Stack>
      </Section>

      {/* Danger Zone */}
      <Box
        sx={{
          backgroundColor: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: '1.25rem',
          p: { xs: 3, md: 4 },
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: '#b91c1c', mb: 1, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          Danger Zone
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
          Permanently delete your account. This cannot be undone.
        </Typography>
        {deleteStatus && <Alert severity={deleteStatus.type} sx={{ mb: 2 }}>{deleteStatus.message}</Alert>}
        <Button
          variant="outlined"
          onClick={() => setDeleteOpen(true)}
          sx={{
            borderColor: '#b91c1c',
            color: '#b91c1c',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: '#fef2f2', borderColor: '#991b1b' },
          }}
        >
          Delete My Account
        </Button>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete your account and all associated data. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            sx={{ backgroundColor: '#b91c1c', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#991b1b' } }}
          >
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : 'Yes, Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
