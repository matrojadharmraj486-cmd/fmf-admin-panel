import { useEffect, useMemo, useState } from 'react'
import { createCoupon, deleteCoupon, listCoupons } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import {
  Box, Card, CardContent, Typography, Button, Alert, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem,
  Switch, FormControlLabel
} from '@mui/material'
import { Icon } from '@iconify/react'

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Flat Discount in Percentage' },
  { value: 'fixed', label: 'Flat Discount in Fix Amount' }
]

const emptyForm = {
  code: '',
  isActive: true,
  discountType: 'percentage',
  discountValue: '',
  description: ''
}

export default function Coupons() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', code: '' })

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listCoupons()
      setItems(toArray(res))
    } catch (err) {
      setItems([])
      setError(err?.response?.data?.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const rows = useMemo(() => {
    return [...items].sort((a, b) => getDateValue(b) - getDateValue(a))
  }, [items])

  const validate = () => {
    if (!form.code.trim()) return 'Please enter coupon code name'
    const discountValue = Number(form.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) return 'Discount must be greater than 0'
    if (form.discountType === 'percentage' && discountValue > 100) return 'Percentage discount cannot be more than 100'
    if (!form.description.trim()) return 'Please enter discount description'
    return ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      code: form.code.trim(),
      isActive: Boolean(form.isActive),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      description: form.description.trim()
    }

    try {
      setSaving(true)
      await createCoupon(payload)
      setOk('Coupon created')
      setForm({ ...emptyForm })
      await fetchCoupons()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      setDeletingId(deleteConfirm.id)
      setError('')
      setOk('')
      await deleteCoupon(deleteConfirm.id)
      setOk('Coupon deleted')
      setDeleteConfirm({ open: false, id: '', code: '' })
      await fetchCoupons()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete coupon')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Coupons System</Typography>
        <Typography variant="body2" color="text.secondary">
          {rows.length} {rows.length === 1 ? 'coupon' : 'coupons'}
        </Typography>
      </Box>

      {/* Create Coupon Form */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Create New Coupon
          </Typography>
          <Box component="form" onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} xl={2.4}>
                <TextField
                  label="Coupon Code"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Coupon code name"
                  size="small"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} xl={2.4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} xl={2.4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Discount Type</InputLabel>
                  <Select
                    label="Discount Type"
                    value={form.discountType}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value, discountValue: '' }))}
                  >
                    {DISCOUNT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} xl={2.4}>
                <TextField
                  label={form.discountType === 'percentage' ? 'Discount %' : 'Discount Amount'}
                  type="number"
                  inputProps={{
                    min: 0,
                    max: form.discountType === 'percentage' ? 100 : undefined,
                    step: form.discountType === 'percentage' ? 1 : 0.01
                  }}
                  value={form.discountValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                  size="small"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6} xl={2.4}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  fullWidth
                  sx={{ height: 40 }}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:ticket-percent-outline" />}
                >
                  {saving ? 'Creating...' : 'Create Code'}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Discount Description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Discount description"
                  multiline
                  rows={3}
                  size="small"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" onClose={() => setOk('')}>{ok}</Alert>}

      {/* Table */}
      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Icon icon="mdi:ticket-percent-outline" width={48} style={{ color: '#9e9e9e', marginBottom: 8 }} />
            <Typography color="text.secondary">No coupons found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Coupon Code Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Type of Coupon</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Code Creation</TableCell>
                  <TableCell>Discount Description</TableCell>
                  <TableCell align="right">Delete Button</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((item) => {
                  const id = getId(item)
                  return (
                    <TableRow key={id || item?.code} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                          {getCode(item)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getIsActive(item) ? 'Active' : 'Inactive'}
                          color={getIsActive(item) ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDiscountType(getDiscountType(item))}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatDiscount(item)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(getCreatedAt(item))}</TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" noWrap title={getDescription(item)}>
                          {getDescription(item)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={deletingId === id}
                          onClick={() => setDeleteConfirm({ open: true, id, code: getCode(item) })}
                          startIcon={
                            deletingId === id
                              ? <CircularProgress size={12} color="inherit" />
                              : <Icon icon="mdi:delete-outline" width={14} />
                          }
                        >
                          {deletingId === id ? 'Deleting...' : 'Delete'}
                        </Button>
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
        onClose={() => setDeleteConfirm({ open: false, id: '', code: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Delete coupon <strong>{deleteConfirm.code}</strong>?
          </Typography>
          <Typography variant="body2" color="error.main">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => setDeleteConfirm({ open: false, id: '', code: '' })}
            disabled={Boolean(deletingId)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDelete}
            disabled={Boolean(deletingId)}
            startIcon={
              deletingId
                ? <CircularProgress size={14} color="inherit" />
                : <Icon icon="mdi:delete-outline" width={14} />
            }
          >
            {deletingId ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.coupons)) return value.coupons
  return []
}

function getId(item) {
  return item?._id || item?.id || ''
}

function getCode(item) {
  return item?.code || item?.couponCode || item?.name || '-'
}

function getIsActive(item) {
  if (typeof item?.isActive === 'boolean') return item.isActive
  if (typeof item?.active === 'boolean') return item.active
  return String(item?.status || 'active').toLowerCase() === 'active'
}

function getDiscountType(item) {
  return item?.discountType || item?.type || item?.couponType || ''
}

function getDiscountValue(item) {
  return item?.discountValue ?? item?.discount ?? item?.amount ?? item?.percentage ?? ''
}

function getDescription(item) {
  return item?.description || item?.discountDescription || item?.discountDiscription || '-'
}

function getCreatedAt(item) {
  return item?.createdAt || item?.created_at || item?.codeCreation || item?.createdDate || ''
}

function getDateValue(item) {
  const date = new Date(getCreatedAt(item))
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function formatDiscountType(type) {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'percentage') return 'Flat Discount in Percentage'
  if (normalized === 'fixed' || normalized === 'fixed_amount') return 'Flat Discount in Fix Amount'
  return type || '-'
}

function formatDiscount(item) {
  const value = getDiscountValue(item)
  if (value === '') return '-'
  const type = String(getDiscountType(item)).toLowerCase()
  return type === 'percentage' ? `${value}%` : `INR ${value}`
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}
