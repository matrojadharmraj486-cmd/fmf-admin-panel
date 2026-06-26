import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listUsers as apiList,
  blockUser,
  unblockUser,
  deleteAdminUser,
  getAdminUser,
  listPayments,
  sendNotification,
  updateAdminUser,
  bulkDeleteAdminUsers
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { GridFooter } from '../shared/GridFooter.jsx'
import {
  Box, Card, Typography, Button, TextField, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Checkbox, Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, CircularProgress, IconButton, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Divider, Paper, Tooltip
} from '@mui/material'
import { Icon } from '@iconify/react'

export default function Users() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState({ id: null, action: '' })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const selectAllRef = useRef(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifySending, setNotifySending] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ title: '', body: '', dataText: '{}' })

  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editOriginal, setEditOriginal] = useState(null)
  const [editForm, setEditForm] = useState({
    fullName: '', email: '', mobileNumber: '', isVerified: false,
    addressLine1: '', addressLine2: '', city: '', state: '', country: '', pincode: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', name: '' })
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState({ open: false, count: 0 })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const u = await apiList({ q: '' })
        setList(extractUsers(u))
      } catch (e) {
        setError('Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = String(query || '').toLowerCase()
    return list.filter((u) => {
      const name = String(u?.fullName || '').toLowerCase()
      const email = String(u?.email || '').toLowerCase()
      const mobile = String(u?.mobileNumber || u?.phone || u?.mobile || '').toLowerCase()
      return name.includes(q) || email.includes(q) || mobile.includes(q)
    })
  }, [list, query])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const safePage = useMemo(() => Math.min(page, totalPages), [page, totalPages])
  const start = useMemo(() => (safePage - 1) * pageSize, [safePage, pageSize])
  const currentItems = useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize])

  useEffect(() => { setPage(1) }, [query, pageSize])
  useEffect(() => { if (page !== safePage) setPage(safePage) }, [page, safePage])

  const currentPageIds = useMemo(() => currentItems.map((u) => u?._id).filter(Boolean), [currentItems])
  const isAllVisibleSelected = useMemo(() => currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id)), [currentPageIds, selectedIds])
  const isSomeVisibleSelected = useMemo(() => currentPageIds.some((id) => selectedIds.has(id)) && !isAllVisibleSelected, [currentPageIds, selectedIds, isAllVisibleSelected])

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = isSomeVisibleSelected
  }, [isSomeVisibleSelected])

  const refetchUsers = async () => {
    const res = await apiList({ q: query || '' })
    setList(extractUsers(res))
  }

  const openDetails = async (u) => {
    const id = u?._id
    if (!id) return
    setSelectedUser(u)
    setActiveTab(0)
    setPayments([])
    setOk(''); setError('')
    setDetailOpen(true)
    try {
      setDetailLoading(true)
      const res = await getAdminUser(id)
      setSelectedUser(extractUser(res) || u)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetails = () => {
    setDetailOpen(false); setSelectedUser(null); setDetailLoading(false)
    setPayments([]); setPaymentsLoading(false); setNotifyOpen(false); setNotifySending(false)
  }

  const fetchPayments = async (userId) => {
    if (!userId) return
    try {
      setPaymentsLoading(true); setError('')
      const res = await listPayments({ userId })
      setPayments(toArray(res))
    } catch (e) {
      setPayments([]); setError(e?.response?.data?.message || 'Failed to load transactions')
    } finally {
      setPaymentsLoading(false)
    }
  }

  const onTabChange = (_, tab) => {
    setActiveTab(tab)
    if (tab === 1) fetchPayments(selectedUser?._id)
  }

  const openNotify = () => {
    if (!selectedUser?._id) return
    setNotifyForm({ title: '', body: '', dataText: '{}' })
    setOk(''); setError(''); setNotifyOpen(true)
  }
  const closeNotify = () => { setNotifyOpen(false); setNotifySending(false) }

  const submitNotify = async (e) => {
    e.preventDefault()
    if (!selectedUser?._id) return
    setOk(''); setError('')
    if (!notifyForm.title.trim()) return setError('Please enter notification title')
    if (!notifyForm.body.trim()) return setError('Please enter notification body')
    let dataObj = {}
    try {
      const parsed = JSON.parse(notifyForm.dataText || '{}')
      dataObj = parsed && typeof parsed === 'object' ? parsed : {}
    } catch { return setError('Data must be valid JSON (example: {"type":"promo"})') }
    try {
      setNotifySending(true)
      await sendNotification({ userId: selectedUser._id, title: notifyForm.title.trim(), body: notifyForm.body.trim(), data: dataObj })
      setOk('Notification sent'); closeNotify()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send notification')
    } finally { setNotifySending(false) }
  }

  const toggleBlock = async (_id, blocked) => {
    try {
      setOk(''); setError(''); setBusy({ id: _id, action: 'block' })
      if (blocked) await unblockUser(_id)
      else await blockUser(_id)
      setList((prev) => prev.map((u) => (u._id === _id ? { ...u, blocked: !u.blocked } : u)))
    } catch { setError('Failed to update status') }
    finally { setBusy({ id: null, action: '' }) }
  }

  const openEdit = async (u) => {
    const id = u?._id
    if (!id) return
    setOk(''); setError(''); setEditOpen(true); setEditLoading(true)
    try {
      const res = await getAdminUser(id)
      const user = extractUser(res) || u
      const addr = normalizeAddress(user)
      const normalized = {
        _id: user?._id || id, fullName: user?.fullName || '', email: user?.email || '',
        mobileNumber: user?.mobileNumber || user?.phone || user?.mobile || '',
        isVerified: Boolean(pickBool(user, ['isVerified', 'verified'])),
        ...addr
      }
      setEditOriginal(normalized)
      setEditForm({ fullName: normalized.fullName, email: normalized.email, mobileNumber: normalized.mobileNumber, isVerified: normalized.isVerified, addressLine1: normalized.addressLine1, addressLine2: normalized.addressLine2, city: normalized.city, state: normalized.state, country: normalized.country, pincode: normalized.pincode })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load user'); setEditOpen(false)
    } finally { setEditLoading(false) }
  }

  const closeEdit = () => { setEditOpen(false); setEditLoading(false); setEditSaving(false); setEditOriginal(null) }

  const buildDiff = (original, next) => {
    const diff = {}
    if (!original) return diff
    for (const f of ['fullName', 'email', 'mobileNumber', 'isVerified']) {
      const a = original?.[f]; const b = next?.[f]
      const same = typeof b === 'string' ? String(a || '') === b : Boolean(a) === Boolean(b)
      if (!same) diff[f] = b
    }
    const addressKeys = ['addressLine1', 'addressLine2', 'city', 'state', 'country', 'pincode']
    if (addressKeys.some((k) => String(original?.[k] || '') !== String(next?.[k] || ''))) {
      diff.address = { addressLine1: next?.addressLine1 || '', addressLine2: next?.addressLine2 || '', city: next?.city || '', state: next?.state || '', country: next?.country || '', pincode: next?.pincode || '' }
    }
    return diff
  }

  const saveEdit = async () => {
    if (!editOriginal?._id) return
    setOk(''); setError('')
    const diff = buildDiff(editOriginal, editForm)
    if (Object.keys(diff).length === 0) { setOk('No changes'); closeEdit(); return }
    try {
      setEditSaving(true)
      await updateAdminUser(editOriginal._id, diff)
      setOk('User updated'); closeEdit(); await refetchUsers()
    } catch (err) {
      if (err?.response?.status === 409) {
        const msg = String(err?.response?.data?.message || '').toLowerCase()
        if (msg.includes('email')) return setError('email already exists')
        if (msg.includes('mobile')) return setError('mobileNumber already exists')
        return setError('Duplicate value already exists')
      }
      setError(err?.response?.data?.message || 'Failed to update user')
    } finally { setEditSaving(false) }
  }

  const openDeleteConfirm = (u) => {
    const id = u?._id; if (!id) return
    setOk(''); setError('')
    setDeleteConfirm({ open: true, id, name: u?.fullName || u?.email || 'this user' })
  }
  const closeDeleteConfirm = () => setDeleteConfirm({ open: false, id: '', name: '' })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    setOk(''); setError('')
    try {
      setBusy({ id: deleteConfirm.id, action: 'delete' })
      await deleteAdminUser(deleteConfirm.id)
      setOk('User deleted'); closeDeleteConfirm(); await refetchUsers()
    } catch (err) { setError(err?.response?.data?.message || 'Failed to delete user') }
    finally { setBusy({ id: null, action: '' }) }
  }

  const toggleSelect = (id) => {
    if (!id) return
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const shouldSelectAll = !currentPageIds.every((id) => next.has(id))
      for (const id of currentPageIds) shouldSelectAll ? next.add(id) : next.delete(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())
  const openBulkDeleteConfirm = () => { if (selectedIds.size === 0) return; setOk(''); setError(''); setBulkDeleteConfirm({ open: true, count: selectedIds.size }) }
  const closeBulkDeleteConfirm = () => setBulkDeleteConfirm({ open: false, count: 0 })

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setOk(''); setError('')
    try {
      setBusy({ id: 'bulk', action: 'bulk-delete' })
      try { await bulkDeleteAdminUsers(ids) }
      catch { for (const id of ids) await deleteAdminUser(id) }
      setOk(`Deleted ${ids.length} users`); closeBulkDeleteConfirm(); clearSelection(); await refetchUsers()
    } catch (err) { setError(err?.response?.data?.message || 'Failed to delete users') }
    finally { setBusy({ id: null, action: '' }) }
  }

  if (loading) return <Loader />

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" fontWeight={600}>Users</Typography>
          {selectedIds.size > 0 && (
            <>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={busy.id === 'bulk' ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:delete-sweep-outline" />}
                disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
                onClick={openBulkDeleteConfirm}
              >
                Delete ({selectedIds.size})
              </Button>
              <Button variant="outlined" size="small" onClick={clearSelection}>Clear</Button>
            </>
          )}
        </Box>
        <TextField
          size="small"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Icon icon="mdi:magnify" fontSize={18} /></InputAdornment> }}
          sx={{ minWidth: 220 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setOk('')}>{ok}</Alert>}

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    inputRef={selectAllRef}
                    checked={isAllVisibleSelected}
                    indeterminate={isSomeVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    size="small"
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentItems.map((u) => (
                <TableRow key={u._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={selectedIds.has(u._id)} onChange={() => toggleSelect(u._id)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{u.fullName}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{u.mobileNumber || u.phone || u.mobile || '-'}</Typography></TableCell>
                  <TableCell><SubscriptionStatus user={u} /></TableCell>
                  <TableCell>
                    <Chip label={pickBool(u, ['isVerified', 'verified']) ? 'Yes' : 'No'} size="small" color={pickBool(u, ['isVerified', 'verified']) ? 'success' : 'default'} variant="tonal" />
                  </TableCell>
                  <TableCell>
                    <Chip label={u.blocked ? 'Blocked' : 'Active'} size="small" color={u.blocked ? 'error' : 'success'} variant="tonal" />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openDetails(u)} color="primary"><Icon icon="mdi:eye-outline" fontSize={16} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(u)} color="info"><Icon icon="mdi:pencil-outline" fontSize={16} /></IconButton>
                      </Tooltip>
                      <Tooltip title={u.blocked ? 'Unblock' : 'Block'}>
                        <IconButton size="small" onClick={() => toggleBlock(u._id, u.blocked)} disabled={busy.id === u._id} color={u.blocked ? 'success' : 'warning'}>
                          {busy.id === u._id && busy.action === 'block' ? <CircularProgress size={14} /> : <Icon icon={u.blocked ? 'mdi:lock-open-outline' : 'mdi:lock-outline'} fontSize={16} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => openDeleteConfirm(u)} color="error" disabled={busy.id === u._id && busy.action === 'delete'}>
                          {busy.id === u._id && busy.action === 'delete' ? <CircularProgress size={14} /> : <Icon icon="mdi:trash-can-outline" fontSize={16} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {currentItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <GridFooter
          page={safePage} totalPages={totalPages} pageSize={pageSize}
          onPageSize={(n) => setPageSize(n)}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onPageChange={(p) => setPage(p)}
          totalItems={filtered.length} itemLabel="users"
        />
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onClose={closeDetails} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>{selectedUser?.fullName || 'User'}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedUser?.email || '-'}</Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={openNotify} startIcon={<Icon icon="mdi:bell-ring-outline" />} color="success">
              Send Notification
            </Button>
          </Box>
        </DialogTitle>
        <Tabs value={activeTab} onChange={onTabChange} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Details" />
          <Tab label="Transactions" />
        </Tabs>
        <DialogContent sx={{ pt: 3 }}>
          {activeTab === 0 ? (
            detailLoading ? <Loader /> : (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <InfoCard title="Profile">
                    <InfoRow label="User ID" value={selectedUser?._id} />
                    <InfoRow label="Name" value={selectedUser?.fullName} />
                    <InfoRow label="Email" value={selectedUser?.email} />
                    <InfoRow label="Phone" value={selectedUser?.mobileNumber || selectedUser?.phone || selectedUser?.mobile || '-'} />
                    <InfoRow label="Verified" value={pickBool(selectedUser, ['isVerified', 'verified']) ? 'Yes' : 'No'} />
                  </InfoCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard title="Address">{renderAddressRows(selectedUser)}</InfoCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard title="Status">
                    <InfoRow label="Blocked" value={selectedUser?.blocked ? 'Yes' : 'No'} />
                    <InfoRow label="Subscription" value={<SubscriptionStatus user={selectedUser} />} />
                    <InfoRow label="Created" value={formatDate(selectedUser?.createdAt || selectedUser?.created_at)} />
                    <InfoRow label="Updated" value={formatDate(selectedUser?.updatedAt || selectedUser?.updated_at)} />
                  </InfoCard>
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoCard title="Other">{renderOtherRows(selectedUser)}</InfoCard>
                </Grid>
              </Grid>
            )
          ) : (
            paymentsLoading ? <Loader /> : payments.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <Typography color="text.secondary">No transactions found.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment ID</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p, idx) => (
                      <TableRow key={getPaymentId(p) || idx} hover>
                        <TableCell><Typography variant="caption">{getPaymentId(p) || '-'}</Typography></TableCell>
                        <TableCell>{formatAmount(p)}</TableCell>
                        <TableCell><Chip label={formatAny(getPaymentStatus(p))} size="small" variant="tonal" /></TableCell>
                        <TableCell>{formatAny(getPaymentMethod(p))}</TableCell>
                        <TableCell>{formatAny(getPaymentPlan(p))}</TableCell>
                        <TableCell>{formatDate(getPaymentCreatedAt(p))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notifyOpen} onClose={closeNotify} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={submitNotify} sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField label="Title" fullWidth size="small" value={notifyForm.title} onChange={(e) => setNotifyForm((s) => ({ ...s, title: e.target.value }))} />
            <TextField label="Body" fullWidth size="small" multiline rows={3} value={notifyForm.body} onChange={(e) => setNotifyForm((s) => ({ ...s, body: e.target.value }))} />
            <TextField label="Data (JSON)" fullWidth size="small" multiline rows={3} value={notifyForm.dataText} onChange={(e) => setNotifyForm((s) => ({ ...s, dataText: e.target.value }))} inputProps={{ style: { fontFamily: 'monospace' } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNotify} variant="outlined">Cancel</Button>
          <Button onClick={submitNotify} variant="contained" color="success" disabled={notifySending} startIcon={notifySending ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:send-outline" />}>
            {notifySending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editLoading ? <Loader /> : (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField label="Full Name" fullWidth size="small" value={editForm.fullName} onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Email" fullWidth size="small" value={editForm.email} onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Mobile Number" fullWidth size="small" value={editForm.mobileNumber} onChange={(e) => setEditForm((s) => ({ ...s, mobileNumber: e.target.value }))} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Is Verified</InputLabel>
                    <Select label="Is Verified" value={editForm.isVerified ? 'true' : 'false'} onChange={(e) => setEditForm((s) => ({ ...s, isVerified: e.target.value === 'true' }))}>
                      <MenuItem value="true">True</MenuItem>
                      <MenuItem value="false">False</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={2}>Address</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}><TextField label="Address Line 1" fullWidth size="small" value={editForm.addressLine1} onChange={(e) => setEditForm((s) => ({ ...s, addressLine1: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField label="Address Line 2" fullWidth size="small" value={editForm.addressLine2} onChange={(e) => setEditForm((s) => ({ ...s, addressLine2: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField label="City" fullWidth size="small" value={editForm.city} onChange={(e) => setEditForm((s) => ({ ...s, city: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField label="State" fullWidth size="small" value={editForm.state} onChange={(e) => setEditForm((s) => ({ ...s, state: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField label="Country" fullWidth size="small" value={editForm.country} onChange={(e) => setEditForm((s) => ({ ...s, country: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField label="Pincode" fullWidth size="small" value={editForm.pincode} onChange={(e) => setEditForm((s) => ({ ...s, pincode: e.target.value }))} /></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} variant="outlined">Cancel</Button>
          <Button onClick={saveEdit} variant="contained" disabled={editSaving} startIcon={editSaving ? <CircularProgress size={14} color="inherit" /> : null}>
            {editSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm.open} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</Typography>
          <Typography variant="body2" color="error" mt={1}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} variant="outlined">Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error" disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
            startIcon={busy.id === deleteConfirm.id && busy.action === 'delete' ? <CircularProgress size={14} color="inherit" /> : null}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteConfirm.open} onClose={closeBulkDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{bulkDeleteConfirm.count}</strong> selected users?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulkDeleteConfirm} variant="outlined">Cancel</Button>
          <Button onClick={confirmBulkDelete} variant="contained" color="error" disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
            startIcon={busy.id === 'bulk' && busy.action === 'bulk-delete' ? <CircularProgress size={14} color="inherit" /> : null}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function InfoCard({ title, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: '100%', borderRadius: 2 }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>{title}</Typography>
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Paper>
  )
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      <Typography variant="body2" textAlign="right" sx={{ wordBreak: 'break-all', maxWidth: '60%' }}>{value || '-'}</Typography>
    </Box>
  )
}

function SubscriptionStatus({ user }) {
  const status = getSubscriptionStatus(user)
  return (
    <Box>
      <Chip label={status.active ? 'Active' : 'Inactive'} size="small" color={status.active ? 'success' : 'default'} variant="tonal" />
      {status.active && status.remainingDays !== null && (
        <Typography variant="caption" color="text.secondary" display="block">
          {status.remainingDays} {status.remainingDays === 1 ? 'day' : 'days'} left
        </Typography>
      )}
    </Box>
  )
}

// ---- helper functions ----
function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.payments)) return value.payments
  if (Array.isArray(value?.transactions)) return value.transactions
  return []
}
function getPaymentId(p) { return p?._id || p?.id || p?.paymentId || p?.txnId || p?.transactionId || '' }
function getPaymentStatus(p) { return p?.status || p?.paymentStatus || p?.state || '' }
function getPaymentMethod(p) { return p?.method || p?.paymentMethod || p?.gateway || p?.provider || '' }
function getPaymentPlan(p) { return p?.planName || p?.plan || p?.productName || p?.subscriptionPlan || '' }
function getPaymentCreatedAt(p) { return p?.createdAt || p?.created_at || p?.date || p?.paidAt || p?.updatedAt || '' }
function formatAny(v) { if (v === null || typeof v === 'undefined') return '-'; const s = String(v).trim(); return s ? s : '-' }
function formatAmount(p) {
  const amount = p?.amount ?? p?.price ?? p?.total ?? p?.value ?? ''
  const currency = p?.currency || p?.currencyCode || 'INR'
  if (amount === null || typeof amount === 'undefined' || amount === '') return '-'
  const n = Number(amount)
  if (!Number.isFinite(n)) return String(amount)
  return `${n} ${currency}`
}
function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}
function getSubscriptionStatus(user) {
  const subscription = user?.subscription && typeof user.subscription === 'object' ? user.subscription : {}
  const statusText = String(pickValue(user, ['subscriptionStatus', 'paymentStatus']) || pickValue(subscription, ['status', 'subscriptionStatus']) || '').toLowerCase()
  const activeBool = pickBool(user, ['isSubscribed', 'subscribed', 'subscriptionActive', 'hasActiveSubscription'])
  const nestedActiveBool = pickBool(subscription, ['isActive', 'active', 'isSubscribed'])
  const endDate = pickValue(user, ['subscriptionEndDate', 'subscriptionExpiresAt', 'subscriptionExpiry', 'expiresAt', 'validTill']) || pickValue(subscription, ['endDate', 'expiresAt', 'expiryDate', 'validTill', 'subscriptionEndDate'])
  const computedDays = getRemainingDaysFromDate(endDate)
  const remainingDays = getRemainingDays(user, subscription, computedDays)
  const hasPositiveRemaining = typeof remainingDays === 'number' && remainingDays > 0
  const explicitActive = activeBool ?? nestedActiveBool
  const active = typeof explicitActive === 'boolean' ? explicitActive : statusText === 'active' || hasPositiveRemaining
  return { active: Boolean(active || hasPositiveRemaining), remainingDays: typeof remainingDays === 'number' ? Math.max(0, remainingDays) : null }
}
function getRemainingDays(user, subscription, computedDays) {
  const raw = pickValue(user, ['remainingDays', 'subscriptionRemainingDays', 'remainingSubscriptionDays']) || pickValue(subscription, ['remainingDays', 'remainingSubscriptionDays'])
  if (raw !== '') { const value = Number(raw); if (Number.isFinite(value)) return Math.ceil(value) }
  return computedDays
}
function getRemainingDaysFromDate(value) {
  if (!value) return null
  const endDate = new Date(value)
  if (Number.isNaN(endDate.getTime())) return null
  const diff = endDate.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
function extractUser(res) {
  if (!res) return null
  if (res?.data && typeof res.data === 'object') { if (Array.isArray(res.data)) return res.data[0] || null; return res.data }
  return res?.user || res?.data?.user || res
}
function pickBool(source, keys) {
  for (const key of keys) {
    const v = source?.[key]
    if (typeof v === 'boolean') return v
    if (v === 1 || v === 0) return Boolean(v)
    if (typeof v === 'string' && (v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) return v.toLowerCase() === 'true'
  }
  return null
}
function normalizeAddress(user) {
  const addr = user?.address && typeof user.address === 'object' ? user.address : {}
  return {
    addressLine1: pickValue(user, ['addressLine1', 'address1', 'line1']) || pickValue(addr, ['addressLine1', 'address1', 'line1']) || '',
    addressLine2: pickValue(user, ['addressLine2', 'address2', 'line2']) || pickValue(addr, ['addressLine2', 'address2', 'line2']) || '',
    city: pickValue(user, ['city']) || pickValue(addr, ['city']) || '',
    state: pickValue(user, ['state']) || pickValue(addr, ['state']) || '',
    country: pickValue(user, ['country']) || pickValue(addr, ['country']) || '',
    pincode: pickValue(user, ['pincode', 'pinCode', 'zip']) || pickValue(addr, ['pincode', 'pinCode', 'zip']) || ''
  }
}
function renderAddressRows(user) {
  const addr = normalizeAddress(user)
  const hasAny = Object.values(addr).some((v) => String(v || '').trim())
  if (!hasAny) return <Typography variant="body2" color="text.secondary">-</Typography>
  return (<>
    <InfoRow label="Line 1" value={addr.addressLine1} />
    <InfoRow label="Line 2" value={addr.addressLine2} />
    <InfoRow label="City" value={addr.city} />
    <InfoRow label="State" value={addr.state} />
    <InfoRow label="Country" value={addr.country} />
    <InfoRow label="Pincode" value={addr.pincode} />
  </>)
}
function renderOtherRows(user) {
  const blacklist = new Set(['_id', '__v', 'password', 'hash', 'salt', 'isActive', 'active', 'isDeleted', 'deleted', 'fullName', 'email', 'mobileNumber', 'mobile', 'phone', 'address', 'addressLine1', 'addressLine2', 'address1', 'address2', 'line1', 'line2', 'city', 'state', 'country', 'pincode', 'pinCode', 'zip', 'blocked', 'isVerified', 'verified', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'subscription', 'subscriptionStatus', 'isSubscribed', 'subscribed', 'subscriptionActive', 'hasActiveSubscription', 'subscriptionEndDate', 'subscriptionExpiresAt', 'subscriptionExpiry', 'expiresAt', 'validTill', 'remainingDays', 'subscriptionRemainingDays', 'remainingSubscriptionDays'])
  const entries = Object.entries(user || {}).filter(([k]) => !blacklist.has(k))
  if (entries.length === 0) return <Typography variant="body2" color="text.secondary">-</Typography>
  return <>{entries.map(([k, v]) => <InfoRow key={k} label={k} value={formatValue(v)} />)}</>
}
function pickValue(source, keys) {
  for (const key of keys) {
    const v = source?.[key]
    if (typeof v === 'string' && v.trim()) return v
    if (typeof v === 'number') return String(v)
  }
  return ''
}
function formatValue(v) {
  if (v === null || typeof v === 'undefined') return '-'
  if (typeof v === 'string') return v || '-'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toLocaleString()
  try { return JSON.stringify(v) } catch { return String(v) }
}
function extractUsers(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data?.users)) return res.data.users
  if (Array.isArray(res?.users)) return res.users
  if (Array.isArray(res?.data?.result)) return res.data.result
  return []
}
