import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Box,
  TextField, Button, Alert, InputAdornment, IconButton, Typography, CircularProgress
} from '@mui/material'
import { Icon } from '@iconify/react'
import { useAuth } from '../context/AuthContext.jsx'
import { changeAdminPassword, changeAdminEmail } from '../services/api.js'

const emptyPassword = { currentPassword: '', newPassword: '', confirmPassword: '' }
const emptyEmail = { newEmail: '', currentPassword: '' }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AccountSettingsDialog({ open, onClose }) {
  const { user, updateAccountEmail } = useAuth()
  const [tab, setTab] = useState(0)

  const [pwForm, setPwForm] = useState({ ...emptyPassword })
  const [emailForm, setEmailForm] = useState({ ...emptyEmail })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEmailPw, setShowEmailPw] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Reset everything whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setTab(0)
      setPwForm({ ...emptyPassword })
      setEmailForm({ ...emptyEmail })
      setShowCurrent(false); setShowNew(false); setShowConfirm(false); setShowEmailPw(false)
      setSaving(false); setError(''); setSuccess('')
    }
  }, [open])

  const switchTab = (_, next) => {
    setTab(next)
    setError('')
    setSuccess('')
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    const { currentPassword, newPassword, confirmPassword } = pwForm
    if (!currentPassword || !newPassword || !confirmPassword) return setError('Please fill in all fields')
    if (newPassword.length < 8) return setError('New password must be at least 8 characters long')
    if (newPassword !== confirmPassword) return setError('New password and confirmation do not match')
    if (newPassword === currentPassword) return setError('New password must be different from the current password')

    try {
      setSaving(true)
      await changeAdminPassword({ currentPassword, newPassword })
      setSuccess('Password updated successfully')
      setPwForm({ ...emptyPassword })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const submitEmail = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    const newEmail = emailForm.newEmail.trim()
    const { currentPassword } = emailForm
    if (!newEmail || !currentPassword) return setError('Please fill in all fields')
    if (!EMAIL_REGEX.test(newEmail)) return setError('Please enter a valid email address')
    if (newEmail.toLowerCase() === String(user?.email || '').toLowerCase()) {
      return setError('New email is the same as the current email')
    }

    try {
      setSaving(true)
      const res = await changeAdminEmail({ currentPassword, newEmail })
      const updatedEmail = res?.data?.user?.email || newEmail
      updateAccountEmail(updatedEmail)
      setSuccess('Email updated successfully')
      setEmailForm({ ...emptyEmail })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update email')
    } finally {
      setSaving(false)
    }
  }

  const pwEndAdornment = (visible, toggle) => (
    <InputAdornment position="end">
      <IconButton onClick={toggle} edge="end" size="small">
        <Icon icon={visible ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} fontSize={20} />
      </IconButton>
    </InputAdornment>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Account Settings</DialogTitle>
      <Tabs value={tab} onChange={switchTab} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Change Password" />
        <Tab label="Change Email" />
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {tab === 0 ? (
          <Box component="form" id="account-password-form" onSubmit={submitPassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            <TextField
              label="Current Password"
              type={showCurrent ? 'text' : 'password'}
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((s) => ({ ...s, currentPassword: e.target.value }))}
              fullWidth size="small" autoComplete="current-password"
              InputProps={{ endAdornment: pwEndAdornment(showCurrent, () => setShowCurrent((v) => !v)) }}
            />
            <TextField
              label="New Password"
              type={showNew ? 'text' : 'password'}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((s) => ({ ...s, newPassword: e.target.value }))}
              fullWidth size="small" autoComplete="new-password"
              helperText="At least 8 characters"
              InputProps={{ endAdornment: pwEndAdornment(showNew, () => setShowNew((v) => !v)) }}
            />
            <TextField
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((s) => ({ ...s, confirmPassword: e.target.value }))}
              fullWidth size="small" autoComplete="new-password"
              InputProps={{ endAdornment: pwEndAdornment(showConfirm, () => setShowConfirm((v) => !v)) }}
            />
          </Box>
        ) : (
          <Box component="form" id="account-email-form" onSubmit={submitEmail} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            <TextField
              label="Current Email"
              value={user?.email || '—'}
              fullWidth size="small"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="New Email"
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm((s) => ({ ...s, newEmail: e.target.value }))}
              fullWidth size="small" autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Icon icon="mdi:email-outline" fontSize={20} />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Current Password"
              type={showEmailPw ? 'text' : 'password'}
              value={emailForm.currentPassword}
              onChange={(e) => setEmailForm((s) => ({ ...s, currentPassword: e.target.value }))}
              fullWidth size="small" autoComplete="current-password"
              InputProps={{ endAdornment: pwEndAdornment(showEmailPw, () => setShowEmailPw((v) => !v)) }}
            />
            <Typography variant="caption" color="text.secondary">
              You will use this email to sign in. If your deployment restricts the admin
              email via configuration, that value must be updated too.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={saving}>Close</Button>
        <Button
          type="submit"
          form={tab === 0 ? 'account-password-form' : 'account-email-form'}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save-outline" />}
        >
          {saving ? 'Saving...' : tab === 0 ? 'Update Password' : 'Update Email'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
