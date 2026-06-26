import { useEffect, useMemo, useRef, useState } from 'react'
import { listUsers, sendBulkNotification } from '../services/api.js'
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
  CircularProgress,
  Checkbox,
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'

const emptyForm = {
  title: '',
  body: '',
  dataText: '{}'
}

export default function Notifications() {
  const [mode, setMode] = useState('selected')
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [form, setForm] = useState({ ...emptyForm })
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const selectAllRef = useRef(null)

  useEffect(() => {
    let alive = true
    const timeout = setTimeout(async () => {
      try {
        setLoadingUsers(true)
        setError('')
        const res = await listUsers({ q: query || '', limit: 100 })
        if (!alive) return
        setUsers(toArray(res))
      } catch (err) {
        if (!alive) return
        setUsers([])
        setError(err?.response?.data?.message || 'Failed to load users')
      } finally {
        if (alive) setLoadingUsers(false)
      }
    }, 250)

    return () => {
      alive = false
      clearTimeout(timeout)
    }
  }, [query])

  const visibleUserIds = useMemo(() => users.map(getUserId).filter(Boolean), [users])
  const allVisibleSelected = visibleUserIds.length > 0 && visibleUserIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = visibleUserIds.some((id) => selectedIds.has(id)) && !allVisibleSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

  const toggleUser = (id) => {
    if (!id) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const shouldSelectAll = !visibleUserIds.every((id) => next.has(id))
      for (const id of visibleUserIds) {
        if (shouldSelectAll) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const parseData = () => {
    try {
      const parsed = JSON.parse(form.dataText || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
      return parsed
    } catch {
      throw new Error('Data must be valid JSON')
    }
  }

  const validate = () => {
    if (!form.title.trim()) return 'Please enter notification title'
    if (!form.body.trim()) return 'Please enter notification body'
    if (mode === 'selected' && selectedIds.size === 0) return 'Please select at least one user'
    return ''
  }

  const submit = async (forceAll = false) => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (mode === 'all' && !forceAll) {
      setConfirmAllOpen(true)
      return
    }

    let data = {}
    try {
      data = parseData()
    } catch (err) {
      setError(err.message)
      return
    }

    try {
      setSending(true)
      setError('')
      setOk('')
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        data,
        sendToAll: mode === 'all',
        userIds: mode === 'selected' ? Array.from(selectedIds) : []
      }
      const res = await sendBulkNotification(payload)
      const sent = res?.sent ?? res?.data?.sent ?? res?.successCount ?? (mode === 'selected' ? selectedIds.size : 'all')
      setOk(mode === 'all' ? 'Notification sent to all users' : `Notification sent to ${sent} selected users`)
      setConfirmAllOpen(false)
      setForm({ ...emptyForm })
      if (mode === 'selected') setSelectedIds(new Set())
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Notifications</Typography>
        <Typography variant="body2" color="text.secondary">
          {mode === 'all' ? 'All users' : `${selectedIds.size} selected`}
        </Typography>
      </Box>

      {/* Compose Card */}
      <Card>
        <CardContent>
          {/* Mode Toggle */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            <Button
              variant={mode === 'selected' ? 'contained' : 'outlined'}
              onClick={() => setMode('selected')}
              sx={mode === 'selected' ? { bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } } : {}}
            >
              Send to Selected Users
            </Button>
            <Button
              variant={mode === 'all' ? 'contained' : 'outlined'}
              onClick={() => setMode('all')}
              sx={mode === 'all' ? { bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } } : {}}
            >
              Send to All Users
            </Button>
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <TextField
              label="Notification title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label='Data JSON, e.g. {"screen":"home"}'
              value={form.dataText}
              onChange={(e) => setForm((prev) => ({ ...prev, dataText: e.target.value }))}
              fullWidth
              size="small"
              inputProps={{ style: { fontFamily: 'monospace' } }}
            />
            <TextField
              label="Notification body"
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              size="small"
              sx={{ gridColumn: { md: 'span 2' } }}
            />
          </Box>

          {/* Actions */}
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setForm({ ...emptyForm })}
              disabled={sending}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              onClick={() => submit(false)}
              disabled={sending}
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:send" />}
              sx={{ bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } }}
            >
              {sending ? 'Sending...' : mode === 'all' ? 'Send to All' : 'Send to Selected'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {ok && (
        <Alert severity="success" onClose={() => setOk('')}>
          {ok}
        </Alert>
      )}

      {/* User Selection Panel */}
      {mode === 'selected' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search + Clear */}
          <Card>
            <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <TextField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name, email or mobile"
                size="small"
                sx={{ minWidth: 260, flex: 1 }}
                InputProps={{
                  startAdornment: <Icon icon="mdi:magnify" style={{ marginRight: 6, color: '#888' }} />
                }}
              />
              <Button
                variant="outlined"
                onClick={() => setSelectedIds(new Set())}
                disabled={selectedIds.size === 0}
              >
                Clear Selection
              </Button>
            </CardContent>
          </Card>

          {/* Users Table */}
          {loadingUsers ? (
            <Loader />
          ) : users.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No users found.</Typography>
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
                          inputRef={selectAllRef}
                          checked={allVisibleSelected}
                          indeterminate={someVisibleSelected}
                          onChange={toggleAllVisible}
                          size="small"
                        />
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>Name</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>Email</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>Mobile</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => {
                      const id = getUserId(user)
                      return (
                        <TableRow key={id || getUserEmail(user)} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.has(id)}
                              onChange={() => toggleUser(id)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{getUserName(user)}</TableCell>
                          <TableCell>{getUserEmail(user)}</TableCell>
                          <TableCell>{getUserMobile(user)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      {/* Confirm All Dialog */}
      <Dialog open={confirmAllOpen} onClose={() => setConfirmAllOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Send to All Users</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This notification will be sent to every user with a valid device token.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmAllOpen(false)}
            disabled={sending}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => submit(true)}
            disabled={sending}
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: '#666CFF', '&:hover': { bgcolor: '#5558e3' } }}
          >
            {sending ? 'Sending...' : 'Yes, Send'}
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
  if (Array.isArray(value?.data?.users)) return value.data.users
  if (Array.isArray(value?.users)) return value.users
  return []
}

function getUserId(user) {
  return user?._id || user?.id || ''
}

function getUserName(user) {
  return user?.fullName || user?.name || user?.username || '-'
}

function getUserEmail(user) {
  return user?.email || '-'
}

function getUserMobile(user) {
  return user?.mobileNumber || user?.phone || user?.mobile || '-'
}
