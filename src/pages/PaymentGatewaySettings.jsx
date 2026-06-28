import { useEffect, useState } from 'react'
import { getPaymentGatewaySettings, updatePaymentGatewaySettings } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Grid,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Snackbar,
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'

export default function PaymentGatewaySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  // Backend field naming: keyId/saltId vs key/secret (handle both for compatibility)
  const [mode, setMode] = useState('keyId')
  const [saved, setSaved] = useState({
    gateway: 'razorpay',
    key: '',
    secretMasked: '',
    description: '',
    isActive: false,
    isConfigured: false,
    updatedAt: ''
  })
  const [form, setForm] = useState({
    gateway: 'razorpay',
    key: '',
    secret: '',
    description: '',
    isActive: false
  })

  const pushToast = (type, message) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }

  const pickActive = (res) => {
    const val =
      res?.isActive ??
      res?.active ??
      res?.is_active ??
      res?.enabled ??
      false
    return !!val
  }

  const unwrapConfig = (res) => {
    if (!res) return {}
    // backend might return { status, message, data: { ...config } }
    const hasTopLevelConfigFields =
      res?.gateway != null ||
      res?.keyId != null ||
      res?.key != null ||
      res?.saltIdMasked != null ||
      res?.secretMasked != null
    if (!hasTopLevelConfigFields && res?.data && typeof res.data === 'object') return res.data
    return res
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const raw = await getPaymentGatewaySettings()
      const cfg = unwrapConfig(raw)
      const gateway = cfg?.gateway || 'razorpay'
      const resMode = cfg?.keyId != null || cfg?.saltIdMasked != null ? 'keyId' : (cfg?.key != null || cfg?.secretMasked != null ? 'key' : 'keyId')
      setMode(resMode)
      const key = cfg?.keyId || cfg?.key || ''
      const secretMasked = cfg?.saltIdMasked || cfg?.secretMasked || ''
      const description = cfg?.description || ''
      const isActive = pickActive(cfg)
      const isConfigured = !!cfg?.isConfigured
      const updatedAt = cfg?.updatedAt || cfg?.updated_at || cfg?.createdAt || cfg?.created_at || ''

      setSaved({ gateway, key, secretMasked, description, isActive, isConfigured, updatedAt })
      setForm({
        gateway,
        key,
        secret: '',
        description,
        isActive
      })
      setError('')
    } catch {
      const msg = 'Failed to load payment gateway settings'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const resetFormToSaved = () => {
    setForm((s) => ({
      ...s,
      gateway: saved.gateway || 'razorpay',
      key: saved.key || '',
      secret: '',
      description: saved.description || '',
      isActive: !!saved.isActive
    }))
  }

  const onSave = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.key.trim()) {
      const msg = 'Key ID is required'
      setError(msg)
      pushToast('error', msg)
      return
    }
    if (!form.secret.trim() && !saved.secretMasked) {
      const msg = 'Secret is required'
      setError(msg)
      pushToast('error', msg)
      return
    }

    try {
      setSaving(true)
      const payload =
        mode === 'key'
          ? {
              gateway: form.gateway,
              key: form.key.trim(),
              ...(form.secret.trim() ? { secret: form.secret.trim() } : {}),
              description: form.description.trim(),
              isActive: !!form.isActive
            }
          : {
              gateway: form.gateway,
              keyId: form.key.trim(),
              ...(form.secret.trim() ? { saltId: form.secret.trim() } : {}),
              description: form.description.trim(),
              isActive: !!form.isActive
            }

      await updatePaymentGatewaySettings(payload)
      pushToast('success', 'Payment gateway settings saved')
      await fetchSettings()
    } catch {
      const msg = 'Failed to save payment gateway settings'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Payment Gateway Settings</Typography>
        <Button
          variant="outlined"
          onClick={fetchSettings}
          startIcon={<Icon icon="mdi:refresh" />}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      )}

      {loading ? (
        <Loader />
      ) : (
        <Grid container spacing={3} alignItems="flex-start">
          {/* Settings Form */}
          <Grid item xs={12} lg={7}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Configuration
                </Typography>
                <Divider sx={{ mb: 2.5 }} />
                <Box component="form" onSubmit={onSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Gateway + Key row */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <FormControl fullWidth size="small" disabled>
                        <InputLabel>Payment Gateway</InputLabel>
                        <Select
                          value={form.gateway}
                          label="Payment Gateway"
                          onChange={(e) => setForm((s) => ({ ...s, gateway: e.target.value }))}
                        >
                          <MenuItem value="razorpay">razorpay</MenuItem>
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Only Razorpay is supported for now.
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={7}>
                      <TextField
                        label="Key *"
                        value={form.key}
                        onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
                        fullWidth
                        size="small"
                        placeholder="Enter API key"
                        required
                        inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                      />
                    </Grid>
                  </Grid>

                  {/* Description */}
                  <TextField
                    label="Description"
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    placeholder="e.g. Razorpay live keys for production"
                  />

                  {/* Secret */}
                  <TextField
                    label="Secret"
                    type="password"
                    value={form.secret}
                    onChange={(e) => setForm((s) => ({ ...s, secret: e.target.value }))}
                    fullWidth
                    size="small"
                    placeholder={saved.secretMasked ? saved.secretMasked : 'Enter secret key'}
                    autoComplete="new-password"
                    helperText="Secret is never shown. Paste a new secret only if you want to rotate it."
                  />

                  {/* Active Toggle */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Switch
                      checked={!!form.isActive}
                      onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#666CFF' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#666CFF' }
                      }}
                    />
                    <Typography variant="body2" fontWeight={500}>Active</Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={saving}
                      onClick={resetFormToSaved}
                      startIcon={<Icon icon="mdi:restore" />}
                    >
                      Revert
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save-outline" />}
                      sx={{ bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Saved Details */}
          <Grid item xs={12} lg={5}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>Saved Details</Typography>
                  {saved.updatedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Updated: {String(saved.updatedAt)}
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', width: 140, borderBottom: '1px solid', borderColor: 'divider' }}>
                          Gateway
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider' }}>
                          {saved.gateway || '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                          Configured
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider' }}>
                          {saved.isConfigured ? 'Yes' : 'No'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                          Key
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, wordBreak: 'break-all', borderBottom: '1px solid', borderColor: 'divider' }}>
                          {saved.key || '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                          Secret
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, borderBottom: '1px solid', borderColor: 'divider' }}>
                          {saved.secretMasked || '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                          Description
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, whiteSpace: 'pre-wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
                          {saved.description || '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: 'text.secondary' }}>Active</TableCell>
                        <TableCell>
                          <Chip
                            label={saved.isActive ? 'Active' : 'Inactive'}
                            color={saved.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Toast Notifications */}
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: toasts.indexOf(t) * 8 }}
        >
          <Alert severity={t.type === 'error' ? 'error' : 'success'} variant="filled" sx={{ width: '100%' }}>
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  )
}
