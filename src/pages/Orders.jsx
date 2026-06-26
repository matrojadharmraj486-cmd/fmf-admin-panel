import { useEffect, useMemo, useRef, useState } from 'react'
import { bulkDeleteOrders, deleteOrder, getOrderById, listOrders } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { GridFooter } from '../shared/GridFooter.jsx'
import {
  Box, Card, CardContent, Typography, Button, Alert, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, CircularProgress, IconButton, Tooltip, FormControl,
  InputLabel, Select, MenuItem, Paper
} from '@mui/material'
import { Icon } from '@iconify/react'

const DEFAULT_PAGE_SIZE = 50
const STATUS_OPTIONS = ['', 'pending', 'completed']

export default function Orders() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState({ id: '', action: '' })
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', label: '' })
  const [bulkConfirm, setBulkConfirm] = useState({ open: false })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [filters, setFilters] = useState({ status: '', search: '', dateFrom: '', dateTo: '', userId: '', subscriptionId: '' })
  const [detail, setDetail] = useState({ open: false, id: '', loading: false, data: null })
  const checkboxRef = useRef(null)

  const params = useMemo(() => ({ page, limit: pageSize, ...filters }), [page, pageSize, filters])

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      try {
        setLoading(true); setError(''); setOk('')
        const res = await listOrders(params)
        if (!alive) return
        setItems(toArray(res))
      } catch (e) {
        if (!alive) return
        setItems([]); setError(e?.response?.data?.message || 'Failed to load orders')
      } finally { if (alive) setLoading(false) }
    }, 250)
    return () => { alive = false; clearTimeout(t) }
  }, [params])

  useEffect(() => {
    const allowed = new Set(items.map(getId).filter(Boolean))
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)))
  }, [items])

  const currentPageIds = useMemo(() => items.map(getId).filter(Boolean), [items])
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
  const somePageSelected = currentPageIds.some((id) => selectedIds.includes(id)) && !allPageSelected

  useEffect(() => { if (checkboxRef.current) checkboxRef.current.indeterminate = somePageSelected }, [somePageSelected])

  const onChange = (patch) => { setPage(1); setFilters((prev) => ({ ...prev, ...patch })) }

  const reloadOrders = async () => { const res = await listOrders(params); setItems(toArray(res)) }

  const openView = async (order) => {
    const id = getId(order); if (!id) return
    setError(''); setOk('')
    setDetail({ open: true, id, loading: true, data: null })
    try {
      const res = await getOrderById(id)
      setDetail({ open: true, id, loading: false, data: unwrap(res) })
    } catch (e) {
      setDetail({ open: true, id, loading: false, data: null })
      setError(e?.response?.data?.message || 'Failed to load order details')
    }
  }

  const closeView = () => setDetail({ open: false, id: '', loading: false, data: null })

  const toggleSelected = (id, checked) => {
    if (!id) return
    setSelectedIds((prev) => checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((i) => i !== id))
  }

  const toggleSelectAllPage = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of currentPageIds) checked ? next.add(id) : next.delete(id)
      return Array.from(next)
    })
  }

  const openDeleteConfirm = (order) => {
    const id = getId(order)
    if (!id) { setError('Unable to delete this order because it has no id'); return }
    setDeleteConfirm({ open: true, id, label: getDisplayOrderId(order) || getOrderId(order) || id })
  }

  const closeDeleteConfirm = () => setDeleteConfirm({ open: false, id: '', label: '' })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      setBusy({ id: deleteConfirm.id, action: 'delete' }); setError(''); setOk('')
      await deleteOrder(deleteConfirm.id)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirm.id))
      closeDeleteConfirm(); await reloadOrders(); setOk('Order deleted')
    } catch (err) { setError(err?.response?.data?.message || 'Failed to delete order') }
    finally { setBusy({ id: '', action: '' }) }
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const ids = [...selectedIds]
    try {
      setBusy({ id: 'bulk', action: 'bulk-delete' }); setError(''); setOk('')
      let deleted = ids.length
      try {
        const data = await bulkDeleteOrders(ids)
        deleted = data?.deleted ?? data?.data?.deleted ?? ids.length
      } catch (err) {
        if (err?.response?.status !== 404) throw err
        for (const id of ids) await deleteOrder(id)
      }
      setBulkConfirm({ open: false }); setSelectedIds([]); await reloadOrders()
      setOk(`Deleted ${deleted} ${deleted === 1 ? 'order' : 'orders'}`)
    } catch (err) { setError(err?.response?.data?.message || 'Failed to bulk delete orders') }
    finally { setBusy({ id: '', action: '' }) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight={600}>Orders</Typography>
          <Typography variant="body2" color="text.secondary">Page {page} · {items.length} items</Typography>
          {selectedIds.length > 0 && (
            <Button variant="contained" color="error" size="small"
              startIcon={busy.id === 'bulk' ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:delete-sweep-outline" />}
              disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
              onClick={() => setBulkConfirm({ open: true })}>
              Delete ({selectedIds.length})
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <MenuItem key={s || 'all'} value={s}>{s ? formatStatusLabel(s) : 'All'}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Search" placeholder="orderId / paymentId / receipt"
                value={filters.search} onChange={(e) => onChange({ search: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" label="User ID" value={filters.userId} onChange={(e) => onChange({ userId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" label="Date From" type="date" InputLabelProps={{ shrink: true }} value={filters.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" label="Date To" type="date" InputLabelProps={{ shrink: true }} value={filters.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button fullWidth variant="outlined" onClick={() => { setPage(1); setFilters({ status: '', search: '', dateFrom: '', dateTo: '', userId: '', subscriptionId: '' }) }}>Clear</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setOk('')}>{ok}</Alert>}

      {loading ? <Loader /> : items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary">No orders found.</Typography>
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" inputRef={checkboxRef} checked={allPageSelected} indeterminate={somePageSelected} onChange={(e) => toggleSelectAllPage(e.target.checked)} />
                  </TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((o, idx) => (
                  <TableRow key={getId(o) || `${getOrderId(o)}-${idx}`} hover>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selectedIds.includes(getId(o))} onChange={(e) => toggleSelected(getId(o), e.target.checked)} />
                    </TableCell>
                    <TableCell><Typography variant="caption" fontFamily="monospace">{getDisplayOrderId(o, idx, page, pageSize)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{formatDate(getOrderDate(o))}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500}>{getUserName(o)}</Typography></TableCell>
                    <TableCell><StatusChip status={getPaymentStatus(o)} /></TableCell>
                    <TableCell><StatusChip status={getOrderStatus(o)} /></TableCell>
                    <TableCell><Typography variant="body2">{formatDiscountedPrice(o)}</Typography></TableCell>
                    <TableCell><InvoiceDownloadButton order={o} /></TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary" onClick={() => openView(o)}><Icon icon="mdi:eye-outline" fontSize={16} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDeleteConfirm(o)} disabled={busy.id === getId(o) && busy.action === 'delete'}>
                            {busy.id === getId(o) && busy.action === 'delete' ? <CircularProgress size={14} /> : <Icon icon="mdi:trash-can-outline" fontSize={16} />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <GridFooter page={page} pageSize={pageSize} onPageSize={(n) => { setPage(1); setPageSize(n) }}
            onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)}
            canNext={items.length >= pageSize} totalItems={items.length} itemLabel="orders on this page" />
        </Card>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={detail.open} onClose={closeView} maxWidth="lg" fullWidth>
        <DialogTitle>Order Details <Typography component="span" variant="body2" color="text.secondary" ml={1}>{detail.id}</Typography></DialogTitle>
        <DialogContent>{detail.loading ? <Loader /> : <OrderDetailsView order={detail.data} />}</DialogContent>
        <DialogActions><Button onClick={closeView} variant="outlined">Close</Button></DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm.open} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete order <strong>{deleteConfirm.label}</strong>?</Typography>
          <Typography variant="body2" color="error" mt={1}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} variant="outlined">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
            startIcon={busy.id === deleteConfirm.id && busy.action === 'delete' ? <CircularProgress size={14} color="inherit" /> : null}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirm */}
      <Dialog open={bulkConfirm.open} onClose={() => setBulkConfirm({ open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete {selectedIds.length} selected {selectedIds.length === 1 ? 'order' : 'orders'}?</Typography>
          <Typography variant="body2" color="error" mt={1}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkConfirm({ open: false })} variant="outlined">Cancel</Button>
          <Button onClick={confirmBulkDelete} variant="contained" color="error" disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
            startIcon={busy.id === 'bulk' && busy.action === 'bulk-delete' ? <CircularProgress size={14} color="inherit" /> : null}>Delete All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function StatusChip({ status }) {
  const normalized = String(status || 'pending').toLowerCase()
  const isCompleted = normalized === 'completed'
  return <Chip label={formatStatusLabel(normalized)} size="small" color={isCompleted ? 'success' : 'warning'} variant="tonal" />
}

function InvoiceDownloadButton({ order }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const onDownload = async () => {
    if (busy) return
    setErr(''); setBusy(true)
    try { const { downloadInvoice } = await import('../shared/TransactionInvoicePdf.jsx'); await downloadInvoice(order) }
    catch (e) { setErr(e?.message || 'Failed to generate invoice') }
    finally { setBusy(false) }
  }
  return (
    <Box>
      <Button size="small" variant="outlined" color="info" onClick={onDownload} disabled={busy}
        startIcon={busy ? <CircularProgress size={12} /> : <Icon icon="mdi:download-outline" fontSize={14} />}>
        {busy ? 'Generating...' : 'PDF'}
      </Button>
      {err && <Typography variant="caption" color="error" display="block">{err}</Typography>}
    </Box>
  )
}

function OrderDetailsView({ order }) {
  if (!order) return (
    <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
      <Typography color="text.secondary">No order details found.</Typography>
    </Box>
  )
  return (
    <Grid container spacing={3} sx={{ pt: 1 }}>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">Order Information</Typography>
          <Box sx={{ mt: 2 }}>
            <DetailRow label="Order ID" value={getOrderId(order)} />
            <DetailRow label="Order Number" value={getOrderNumber(order)} />
            <DetailRow label="Order Date" value={formatDate(getOrderDate(order))} />
            <DetailRow label="Order Status" value={<StatusChip status={getOrderStatus(order)} />} />
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase">Amount</Typography>
          <Box sx={{ mt: 2 }}>
            <DetailRow label="Plan" value={getPlanName(order)} />
            <DetailRow label="Original Price" value={formatOriginalAmount(order)} />
            <DetailRow label="Coupon Code" value={getCouponCode(order)} />
            <DetailRow label="Discount" value={formatDiscountAmount(order)} />
            <DetailRow label="Final Price" value={formatDiscountedPrice(order)} />
            <DetailRow label="Email" value={getUserEmail(order)} />
            <DetailRow label="Mobile" value={getUserMobile(order)} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
    </Box>
  )
}

// ---- helpers ----
function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.data?.items)) return value.data.items
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.orders)) return value.orders
  return []
}
function unwrap(res) { if (!res) return null; if (res?.data && typeof res.data === 'object') return res.data; return res }
function getId(o) { return o?._id || o?.id || '' }
function getOrderId(o) { return o?.orderId || o?.razorpayOrderId || o?.order_id || o?.razorpay_order_id || getId(o) || '-' }
function getDisplayOrderId(o, index = 0, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const existing = o?.orderNumber || o?.orderNo || o?.displayOrderId || o?.displayOrderNumber
  if (existing) return String(existing)
  const serial = 1001 + Math.max(0, page - 1) * pageSize + index
  return String(serial).padStart(4, '0')
}
function getOrderNumber(o) { return o?.orderNumber || o?.orderNo || o?.displayOrderId || o?.displayOrderNumber || getOrderId(o) }
function getUser(o) { return o?.user || o?.userId || o?.customer || {} }
function getUserName(o) { const u = getUser(o); return u?.fullName || u?.name || '-' }
function getUserEmail(o) { const u = getUser(o); return u?.email || '-' }
function getUserMobile(o) { const u = getUser(o); return u?.mobileNumber || u?.phone || u?.mobile || '-' }
function getPlanName(o) { const s = o?.subscription || o?.plan || o?.subscriptionId || {}; if (typeof s === 'string') return s; return s?.name || s?.title || s?.planName || '-' }
function getCurrency(o) { return o?.currency || o?.currencyCode || 'INR' }
function pickFirstValue(source, keys) { for (const key of keys) { const value = source?.[key]; if (value !== null && typeof value !== 'undefined' && value !== '') return value } return '' }
function getOriginalAmount(o) { const subscription = o?.subscription && typeof o.subscription === 'object' ? o.subscription : {}; return pickFirstValue(o, ['originalAmount', 'originalPrice', 'baseAmount', 'basePrice', 'subtotal', 'subTotal', 'planAmount', 'planPrice']) || pickFirstValue(subscription, ['totalPrice', 'price', 'amount']) }
function getDiscountAmount(o) { const coupon = o?.coupon && typeof o.coupon === 'object' ? o.coupon : {}; return pickFirstValue(o, ['discountAmount', 'couponDiscountAmount', 'discount', 'discountValueApplied', 'couponDiscount']) || pickFirstValue(coupon, ['discountAmount', 'amountOff', 'discountApplied']) }
function getDiscountedAmount(o) { return pickFirstValue(o, ['discountedAmount', 'discountedPrice', 'finalAmount', 'finalPrice', 'payableAmount', 'paidAmount', 'totalAmount', 'amountInr', 'amount', 'amount_inr', 'total']) }
function getCouponCode(o) { const coupon = o?.coupon && typeof o.coupon === 'object' ? o.coupon : {}; return o?.couponCode || o?.appliedCouponCode || coupon?.code || coupon?.couponCode || '-' }
function formatMoneyValue(amount, currency = 'INR') { if (amount === null || typeof amount === 'undefined' || amount === '') return '-'; const n = Number(amount); if (!Number.isFinite(n)) return `${amount} ${currency}`.trim(); return `${n.toFixed(2)} ${currency}`.trim() }
function formatOriginalAmount(o) { return formatMoneyValue(getOriginalAmount(o), getCurrency(o)) }
function formatDiscountAmount(o) { return formatMoneyValue(getDiscountAmount(o), getCurrency(o)) }
function formatDiscountedPrice(o) { return formatMoneyValue(getDiscountedAmount(o), getCurrency(o)) }
function getPaymentStatus(o) { const status = String(o?.paymentStatus || o?.payment?.status || o?.status || '').toLowerCase(); if (['paid', 'success', 'successful', 'completed', 'captured'].includes(status)) return 'completed'; return 'pending' }
function getOrderStatus(o) { const status = String(o?.orderStatus || o?.status || '').toLowerCase(); if (['completed', 'paid', 'success', 'successful', 'fulfilled'].includes(status)) return 'completed'; return 'pending' }
function getOrderDate(o) { return o?.orderDate || o?.createdAt || o?.created_at || o?.date || '' }
function formatDate(value) { if (!value) return '-'; const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value); return date.toLocaleString() }
function formatStatusLabel(value) { return String(value || '-').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
