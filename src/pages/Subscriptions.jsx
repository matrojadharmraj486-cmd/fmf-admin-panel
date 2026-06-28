import { useEffect, useMemo, useState } from 'react'
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  deleteSubscription
} from '../services/api.js'
import {
  Box, Card, CardContent, Typography, Button, Alert, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel, Snackbar, IconButton
} from '@mui/material'
import { Icon } from '@iconify/react'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  gstPercent: 0,
  durationDays: '',
  currency: 'INR',
  isActive: true
}

export default function Subscriptions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({ id: null, action: '' })
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })

  const pushToast = (type, message) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3000)
  }

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await listSubscriptions(true)
      setItems(Array.isArray(res) ? res : res?.data || [])
      setError('')
    } catch {
      setItems([])
      setError('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price ?? '',
      gstPercent: Number.isFinite(Number(item?.gstPercent)) ? Number(item.gstPercent) : 0,
      durationDays: item?.durationDays ?? '',
      currency: item?.currency || 'INR',
      isActive: typeof item?.isActive === 'boolean' ? item.isActive : true
    })
    setEditingId(item?._id || item?.id || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSaving(false)
    resetForm()
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'Please enter name'
    const priceValue = Number(form.price)
    if (!Number.isFinite(priceValue) || priceValue <= 0) return 'Price must be greater than 0'
    const gstValue = Number(form.gstPercent)
    if (![0, 5, 18].includes(gstValue)) return 'Please select a valid GST %'
    const durationValue = Number(form.durationDays)
    if (!Number.isFinite(durationValue) || durationValue <= 0) return 'Duration must be greater than 0'
    return ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      pushToast('error', validationError)
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      gstPercent: Number(form.gstPercent),
      durationDays: Number(form.durationDays),
      currency: form.currency.trim() || 'INR',
      isActive: !!form.isActive
    }

    try {
      setSaving(true)
      if (editingId) {
        await updateSubscription(editingId, payload)
        pushToast('success', 'Subscription updated')
      } else {
        await createSubscription(payload)
        pushToast('success', 'Subscription created')
      }
      await fetchSubscriptions()
      closeModal()
    } catch {
      const msg = editingId ? 'Failed to update subscription' : 'Failed to create subscription'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item) => {
    const id = item?._id || item?.id
    if (!id) return
    try {
      setBusy({ id, action: 'toggle' })
      await updateSubscriptionStatus(id, !item.isActive)
      setItems((prev) =>
        prev.map((p) => ((p._id || p.id) === id ? { ...p, isActive: !p.isActive } : p))
      )
      pushToast('success', `Subscription ${item.isActive ? 'deactivated' : 'activated'}`)
    } catch {
      const msg = 'Failed to update status'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setBusy({ id: null, action: '' })
    }
  }

  const rows = useMemo(() => items, [items])

  const basePriceValue = Number(form.price)
  const gstPercentValue = Number(form.gstPercent)
  const gstAmount = Number.isFinite(basePriceValue) && Number.isFinite(gstPercentValue)
    ? (basePriceValue * gstPercentValue) / 100
    : 0
  const totalPlanPrice = Number.isFinite(basePriceValue) ? basePriceValue + gstAmount : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Subscriptions</Typography>
        <Button
          variant="contained"
          onClick={openCreate}
          startIcon={<Icon icon="mdi:plus" />}
        >
          New Plan
        </Button>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      )}

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Icon icon="mdi:card-multiple-outline" width={48} style={{ color: '#9e9e9e', marginBottom: 8 }} />
            <Typography color="text.secondary">No subscriptions found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Base Price (INR)</TableCell>
                  <TableCell>GST %</TableCell>
                  <TableCell>Total Price (INR)</TableCell>
                  <TableCell>Duration (days)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((item) => {
                  const id = item?._id || item?.id
                  const createdAt = item?.createdAt ? new Date(item.createdAt) : null
                  const isBusy = busy.id === id
                  return (
                    <TableRow key={id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{item?.name || '—'}</Typography>
                      </TableCell>
                      <TableCell>INR {item?.price ?? '—'}</TableCell>
                      <TableCell>
                        {Number.isFinite(Number(item?.gstPercent)) ? Number(item.gstPercent) : '—'}
                      </TableCell>
                      <TableCell>
                        INR {item?.totalPrice ?? (
                          Number.isFinite(Number(item?.price)) && Number.isFinite(Number(item?.gstPercent))
                            ? (Number(item.price) + (Number(item.price) * Number(item.gstPercent)) / 100).toFixed(2)
                            : '—'
                        )}
                      </TableCell>
                      <TableCell>{item?.durationDays ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item?.isActive ? 'Active' : 'Inactive'}
                          color={item?.isActive ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {createdAt && !Number.isNaN(createdAt.getTime())
                          ? createdAt.toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => openEdit(item)}
                            startIcon={<Icon icon="mdi:pencil-outline" width={14} />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color={item?.isActive ? 'warning' : 'success'}
                            disabled={isBusy}
                            onClick={() => toggleActive(item)}
                            startIcon={
                              isBusy && busy.action === 'toggle'
                                ? <CircularProgress size={12} />
                                : <Icon icon={item?.isActive ? 'mdi:pause-circle-outline' : 'mdi:play-circle-outline'} width={14} />
                            }
                          >
                            {isBusy && busy.action === 'toggle'
                              ? 'Updating...'
                              : item?.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={isBusy}
                            onClick={() => setDeleteConfirm({ open: true, id, name: item?.name || 'this plan' })}
                            startIcon={<Icon icon="mdi:delete-outline" width={14} />}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Delete subscription <strong>{deleteConfirm.name}</strong>?
          </Typography>
          <Typography variant="body2" color="error.main">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
            onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
            startIcon={
              busy.id === deleteConfirm.id && busy.action === 'delete'
                ? <CircularProgress size={14} color="inherit" />
                : null
            }
            onClick={async () => {
              if (!deleteConfirm.id) return
              try {
                setBusy({ id: deleteConfirm.id, action: 'delete' })
                await deleteSubscription(deleteConfirm.id)
                pushToast('success', 'Subscription deleted')
                setDeleteConfirm({ open: false, id: null, name: '' })
                await fetchSubscriptions()
              } catch {
                pushToast('error', 'Failed to delete subscription')
                setError('Failed to delete subscription')
              } finally {
                setBusy({ id: null, action: '' })
              }
            }}
          >
            {busy.id === deleteConfirm.id && busy.action === 'delete' ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit Plan Dialog */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="md" fullWidth>
        <Box component="form" onSubmit={submit}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{editingId ? 'Edit Plan' : 'Create Plan'}</span>
            <IconButton size="small" onClick={closeModal}>
              <Icon icon="mdi:close" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  size="small"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Currency"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  placeholder="INR"
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Base Price"
                  type="number"
                  inputProps={{ min: 0, step: '0.01' }}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  size="small"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>GST %</InputLabel>
                  <Select
                    label="GST %"
                    value={form.gstPercent}
                    onChange={(e) => setForm((f) => ({ ...f, gstPercent: Number(e.target.value) }))}
                  >
                    <MenuItem value={0}>0</MenuItem>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={18}>18</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Total Plan Price (INR)"
                  value={`INR ${Number.isFinite(totalPlanPrice) ? totalPlanPrice.toFixed(2) : '0.00'}`}
                  size="small"
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'action.hover', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duration (days)"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={form.durationDays}
                  onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                  size="small"
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  multiline
                  rows={3}
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    color="primary"
                  />
                  <Typography variant="body2" fontWeight={500}>Active</Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="outlined" onClick={closeModal}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            >
              {saving ? 'Saving...' : editingId ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Toast Notifications */}
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={3000}
        >
          <Alert severity={t.type === 'error' ? 'error' : 'success'} variant="filled" sx={{ minWidth: 200 }}>
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  )
}
