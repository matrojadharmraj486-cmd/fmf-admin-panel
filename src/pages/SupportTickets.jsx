import { useEffect, useMemo, useState } from 'react'
import { bulkDeleteSupportTickets, listSupportTickets, updateSupportTicket } from '../services/api.js'
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
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Checkbox,
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'

const STATUS_OPTIONS = ['created', 'in_progress', 'resolved', 'closed']
const CATEGORY_OPTIONS = ['']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'urgent']

const statusChipColor = {
  created: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default'
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState({ open: false })
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  })
  const [updateForm, setUpdateForm] = useState({
    status: 'created',
    adminNote: '',
    statusNote: ''
  })

  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      setOk('')
      const res = await listSupportTickets()
      setTickets(toArray(res))
      setSelectedIds([])
    } catch (err) {
      setTickets([])
      setError(err?.response?.data?.message || 'Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(tickets.map((ticket) => getCategory(ticket)).filter(Boolean)))
    return [...CATEGORY_OPTIONS, ...dynamic]
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const byStatus = filters.status ? getStatus(ticket) === filters.status : true
      const byCategory = filters.category ? getCategory(ticket) === filters.category : true
      const byPriority = filters.priority ? getPriority(ticket) === filters.priority : true
      const haystack = [
        getTicketNumber(ticket),
        getSubject(ticket),
        getDescription(ticket)
      ].join(' ').toLowerCase()
      const bySearch = search ? haystack.includes(search) : true
      return byStatus && byCategory && byPriority && bySearch
    })
  }, [tickets, filters])

  const openDetail = (ticket) => {
    setSelectedTicket(ticket)
    setUpdateForm({
      status: getStatus(ticket) || 'created',
      adminNote: getAdminNote(ticket),
      statusNote: ''
    })
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedTicket(null)
    setSaving(false)
  }

  const saveTicketUpdate = async (e) => {
    e.preventDefault()
    if (!selectedTicket) return
    const id = getTicketId(selectedTicket)
    if (!id) {
      setError('Unable to update this ticket because it has no id')
      return
    }
    try {
      setSaving(true)
      setError('')
      setOk('')
      const payload = {
        status: updateForm.status,
        adminNote: updateForm.adminNote,
        statusNote: updateForm.statusNote
      }
      const updated = await updateSupportTicket(id, payload)
      const nextTicket = extractTicket(updated) || {
        ...selectedTicket,
        status: updateForm.status,
        adminNote: updateForm.adminNote
      }
      setTickets((prev) => prev.map((ticket) => (getTicketId(ticket) === id ? nextTicket : ticket)))
      setSelectedTicket(nextTicket)
      setUpdateForm((prev) => ({ ...prev, statusNote: '' }))
      setOk('Support ticket updated')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update support ticket')
    } finally {
      setSaving(false)
    }
  }

  const visibleTicketIds = useMemo(
    () => filteredTickets.map(getTicketId).filter(Boolean),
    [filteredTickets]
  )
  const allVisibleSelected = visibleTicketIds.length > 0 && visibleTicketIds.every((id) => selectedIds.includes(id))
  const someVisibleSelected = visibleTicketIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected

  const toggleSelected = (id, checked) => {
    if (!id) return
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((currentId) => currentId !== id)
    })
  }

  const toggleAllVisible = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of visibleTicketIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return Array.from(next)
    })
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      setBulkDeleting(true)
      setError('')
      setOk('')
      const res = await bulkDeleteSupportTickets(selectedIds)
      const deleted = res?.deleted ?? res?.data?.deleted ?? selectedIds.length
      setBulkConfirm({ open: false })
      setSelectedIds([])
      await fetchTickets()
      setOk(`Deleted ${deleted} support ${deleted === 1 ? 'ticket' : 'tickets'}`)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to bulk delete support tickets')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Support Tickets</Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
        </Typography>
      </Box>

      {/* Filters */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.filter(Boolean).map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="">All Priorities</MenuItem>
                {PRIORITY_OPTIONS.filter(Boolean).map((priority) => (
                  <MenuItem key={priority} value={priority}>{formatLabel(priority)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              sx={{ flex: 1, minWidth: 220 }}
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search ticket no / subject / description"
              InputProps={{
                startAdornment: <Icon icon="mdi:magnify" style={{ marginRight: 6, color: '#888' }} />
              }}
            />

            <Button
              variant="contained"
              color="error"
              disabled={selectedIds.length === 0}
              onClick={() => setBulkConfirm({ open: true })}
              startIcon={<Icon icon="mdi:delete-outline" />}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Delete{selectedIds.length ? ` (${selectedIds.length})` : ' Selected'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      )}
      {ok && (
        <Alert severity="success" onClose={() => setOk('')}>{ok}</Alert>
      )}

      {/* Table */}
      {loading ? (
        <Loader />
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No support tickets found for the current filters.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      onChange={(e) => toggleAllVisible(e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Ticket Number</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Subject</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Category</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Priority</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Status</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>User Name</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>User Email</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Phone</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>Created At</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" fontWeight={600}>Action</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={getTicketId(ticket) || getTicketNumber(ticket)} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(getTicketId(ticket))}
                        onChange={(e) => toggleSelected(getTicketId(ticket), e.target.checked)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getTicketNumber(ticket)}</TableCell>
                    <TableCell>{getSubject(ticket)}</TableCell>
                    <TableCell>{getCategory(ticket)}</TableCell>
                    <TableCell>{formatLabel(getPriority(ticket))}</TableCell>
                    <TableCell>
                      <StatusBadge status={getStatus(ticket)} />
                    </TableCell>
                    <TableCell>{getUserName(ticket)}</TableCell>
                    <TableCell>{getUserEmail(ticket)}</TableCell>
                    <TableCell>{getUserPhone(ticket) || '-'}</TableCell>
                    <TableCell>{formatDate(getCreatedAt(ticket))}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openDetail(ticket)}
                        sx={{ bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkConfirm.open} onClose={() => setBulkConfirm({ open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Delete {selectedIds.length} selected support {selectedIds.length === 1 ? 'ticket' : 'tickets'}?
          </Typography>
          <Typography variant="body2" color="error">This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkConfirm({ open: false })}
            disabled={bulkDeleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBulkDelete}
            disabled={bulkDeleting}
            variant="contained"
            color="error"
            startIcon={bulkDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {bulkDeleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen && !!selectedTicket} onClose={closeDetail} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">{selectedTicket && getTicketNumber(selectedTicket)}</Typography>
              <Typography variant="h6" fontWeight={600}>{selectedTicket && getSubject(selectedTicket)}</Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={closeDetail}>Close</Button>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedTicket && (
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} lg={7}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Ticket Meta */}
                  <Card variant="outlined">
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <DetailField label="Category" value={getCategory(selectedTicket)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <DetailField label="Priority" value={formatLabel(getPriority(selectedTicket))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <DetailField label="Current Status" value={<StatusBadge status={getStatus(selectedTicket)} />} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <DetailField label="Created Date" value={formatDate(getCreatedAt(selectedTicket))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <DetailField label="Updated Date" value={formatDate(getUpdatedAt(selectedTicket))} />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Description */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {getDescription(selectedTicket) || 'No description provided.'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Attachment */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                        Attachment
                      </Typography>
                      <AttachmentBlock ticket={selectedTicket} baseUrl={baseUrl} />
                    </CardContent>
                  </Card>

                  {/* Status History */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                        Status History
                      </Typography>
                      <StatusTimeline history={getStatusHistory(selectedTicket)} />
                    </CardContent>
                  </Card>
                </Box>
              </Grid>

              {/* Right Column */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* User Info */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                        User Info
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <DetailRow label="Name" value={getUserName(selectedTicket)} />
                        <DetailRow label="Email" value={getUserEmail(selectedTicket)} />
                        <DetailRow label="Phone" value={getUserPhone(selectedTicket) || '-'} />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Admin Note display */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1 }}>
                        Admin Note
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {getAdminNote(selectedTicket) || 'No admin note yet.'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Update Ticket Form */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                        Update Ticket
                      </Typography>
                      <Box component="form" onSubmit={saveTicketUpdate} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={updateForm.status}
                            label="Status"
                            onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status} value={status}>{formatLabel(status)}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          label="Admin note"
                          value={updateForm.adminNote}
                          onChange={(e) => setUpdateForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                          multiline
                          rows={4}
                          fullWidth
                          size="small"
                        />

                        <TextField
                          label="Status note"
                          value={updateForm.statusNote}
                          onChange={(e) => setUpdateForm((prev) => ({ ...prev, statusNote: e.target.value }))}
                          multiline
                          rows={3}
                          fullWidth
                          size="small"
                        />

                        <Button
                          type="submit"
                          variant="contained"
                          disabled={saving}
                          fullWidth
                          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save-outline" />}
                          sx={{ bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } }}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>
        {typeof value === 'string' || !value
          ? <Typography variant="body2">{value || '-'}</Typography>
          : value}
      </Box>
    </Box>
  )
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>{value || '-'}</Typography>
    </Box>
  )
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)
  const color = statusChipColor[normalized] || 'default'
  return (
    <Chip
      label={formatLabel(normalized)}
      color={color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  )
}

function AttachmentBlock({ ticket, baseUrl }) {
  const attachment = getAttachment(ticket)
  if (!attachment?.url) {
    return <Typography variant="body2" color="text.secondary">No attachment uploaded.</Typography>
  }
  const href = toAbsoluteUrl(attachment.url, baseUrl)
  const lower = href.toLowerCase()
  const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].some((ext) => lower.includes(ext))
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {isImage && (
        <Box
          component="img"
          src={href}
          alt={attachment.name || 'attachment'}
          sx={{ maxHeight: 256, borderRadius: 1, border: '1px solid', borderColor: 'divider', objectFit: 'contain' }}
        />
      )}
      <Button
        component="a"
        href={href}
        target="_blank"
        rel="noreferrer"
        variant="contained"
        size="small"
        startIcon={<Icon icon="mdi:download" />}
        sx={{ alignSelf: 'flex-start' }}
      >
        {isImage ? 'Open / Download Attachment' : `Download ${attachment.name || 'Attachment'}`}
      </Button>
    </Box>
  )
}

function StatusTimeline({ history }) {
  if (!Array.isArray(history) || history.length === 0) {
    return <Typography variant="body2" color="text.secondary">No status history available.</Typography>
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {history.map((entry, index) => {
        const status = normalizeStatus(pickValue(entry, ['status', 'toStatus', 'currentStatus']) || 'created')
        const note = pickValue(entry, ['note', 'statusNote', 'message', 'remark'])
        const by = pickValue(entry, ['changedByName', 'updatedByName', 'adminName']) || pickValue(pickValue(entry, ['changedBy', 'updatedBy', 'admin']), ['name', 'fullName', 'email'])
        const changedAt = pickValue(entry, ['createdAt', 'updatedAt', 'changedAt', 'date'])
        return (
          <Box key={`${status}-${changedAt || index}`} sx={{ position: 'relative', pl: 3 }}>
            <Box sx={{ position: 'absolute', left: 0, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: 'grey.400' }} />
            {index !== history.length - 1 && (
              <Box sx={{ position: 'absolute', left: '5px', top: 16, width: 2, height: '100%', bgcolor: 'divider' }} />
            )}
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <StatusBadge status={status} />
              <Typography variant="body2">{note || 'No note provided.'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {by ? `By ${by}` : 'Updated'}{changedAt ? ` • ${formatDate(changedAt)}` : ''}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.tickets)) return value.tickets
  if (Array.isArray(value?.supportTickets)) return value.supportTickets
  return []
}

function extractTicket(value) {
  if (!value) return null
  if (Array.isArray(value?.data)) return value.data[0] || null
  return value?.data || value?.ticket || value?.supportTicket || value
}

function pickValue(source, keys) {
  if (!source || typeof source !== 'object') return ''
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function getTicketId(ticket) {
  return pickValue(ticket, ['_id', 'id'])
}

function getTicketNumber(ticket) {
  return pickValue(ticket, ['ticketNumber', 'ticketNo', 'number', 'code']) || '-'
}

function getSubject(ticket) {
  return pickValue(ticket, ['subject', 'title']) || '-'
}

function getCategory(ticket) {
  return pickValue(ticket, ['category', 'type']) || '-'
}

function getPriority(ticket) {
  return String(pickValue(ticket, ['priority']) || '-').toLowerCase()
}

function normalizeStatus(status) {
  const normalized = String(status || 'created').toLowerCase()
  if (normalized === 'open') return 'created'
  if (normalized === 'pending_user') return 'in_progress'
  return normalized
}

function getStatus(ticket) {
  return normalizeStatus(pickValue(ticket, ['status']))
}

function getDescription(ticket) {
  return pickValue(ticket, ['description', 'message', 'details']) || ''
}

function getUser(ticket) {
  return pickValue(ticket, ['user', 'createdBy']) || {}
}

function getUserName(ticket) {
  const user = getUser(ticket)
  if (typeof user === 'string') return user
  return pickValue(user, ['name', 'fullName', 'username']) || pickValue(ticket, ['userName']) || '-'
}

function getUserEmail(ticket) {
  const user = getUser(ticket)
  if (typeof user === 'string') return '-'
  return pickValue(user, ['email']) || pickValue(ticket, ['userEmail']) || '-'
}

function getUserPhone(ticket) {
  const user = getUser(ticket)
  if (typeof user === 'string') return ''
  return pickValue(user, ['mobileNumber', 'phone', 'mobile', 'contactNumber']) || ''
}

function getAdminNote(ticket) {
  return pickValue(ticket, ['adminNote', 'noteForAdmin', 'internalNote']) || ''
}

function getStatusHistory(ticket) {
  const history = pickValue(ticket, ['statusHistory', 'history', 'timeline'])
  return Array.isArray(history) ? history : []
}

function getCreatedAt(ticket) {
  return pickValue(ticket, ['createdAt', 'created_at'])
}

function getUpdatedAt(ticket) {
  return pickValue(ticket, ['updatedAt', 'updated_at'])
}

function getAttachment(ticket) {
  const raw = pickValue(ticket, ['attachment', 'file', 'document'])
  if (typeof raw === 'string') return { url: raw, name: raw.split('/').pop() }
  if (raw && typeof raw === 'object') {
    return {
      url: pickValue(raw, ['url', 'path', 'fileUrl', 'attachmentUrl']),
      name: pickValue(raw, ['name', 'fileName', 'originalName'])
    }
  }
  const url = pickValue(ticket, ['attachmentUrl', 'fileUrl'])
  if (url) return { url, name: url.split('/').pop() }
  return null
}

function toAbsoluteUrl(url, baseUrl) {
  if (!url) return ''
  if (String(url).startsWith('http')) return url
  const base = String(baseUrl || '').replace(/\/+$/, '')
  const path = String(url).startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatLabel(value) {
  return String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
