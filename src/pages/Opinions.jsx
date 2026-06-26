import { useEffect, useMemo, useState } from 'react'
import { bulkDeleteOpinions, deleteOpinion, listOpinions } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { GridFooter } from '../shared/GridFooter.jsx'
import {
  Box, Card, CardContent, Typography, Button, Alert, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, Chip, IconButton, Tooltip
} from '@mui/material'
import { Icon } from '@iconify/react'

export default function Opinions() {
  const [opinions, setOpinions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState({ open: false })

  const fetchOpinions = async () => {
    try {
      setLoading(true)
      setError('')
      setOk('')
      const res = await listOpinions()
      setOpinions(toArray(res))
    } catch (err) {
      setOpinions([])
      setError(err?.response?.data?.message || 'Failed to load opinions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpinions()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return opinions
    return opinions.filter((item) => {
      const haystack = [getName(item), getEmail(item), getMobile(item), getOpinion(item)].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [opinions, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aTime = getCreatedAt(a)
      const bTime = getCreatedAt(b)
      return bTime - aTime
    })
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const currentItems = sorted.slice(start, start + pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  useEffect(() => {
    // Keep selection valid after filtering/refetch.
    const allowed = new Set(sorted.map(getId).filter(Boolean))
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)))
  }, [sorted])

  const isSelected = (id) => selectedIds.includes(id)

  const toggleSelected = (id, checked) => {
    if (!id) return
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((x) => x !== id)
    })
  }

  const currentPageIds = useMemo(
    () => currentItems.map(getId).filter(Boolean),
    [currentItems]
  )

  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
  const somePageSelected = currentPageIds.some((id) => selectedIds.includes(id)) && !allPageSelected

  const toggleSelectAllPage = (checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev)
      for (const id of currentPageIds) {
        if (checked) set.add(id)
        else set.delete(id)
      }
      return Array.from(set)
    })
  }

  const onDeleteRow = async (id) => {
    if (!id) return
    setError('')
    setOk('')
    try {
      await deleteOpinion(id)
      setOk('Deleted 1')
      await fetchOpinions()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete opinion')
    }
  }

  const openBulkConfirm = () => setBulkConfirm({ open: true })
  const closeBulkConfirm = () => setBulkConfirm({ open: false })

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setError('')
    setOk('')
    try {
      const data = await bulkDeleteOpinions(selectedIds)
      const deleted = data?.deleted ?? data?.data?.deleted ?? selectedIds.length
      setOk(`Deleted ${deleted}`)
      closeBulkConfirm()
      setSelectedIds([])
      await fetchOpinions()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to bulk delete opinions')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Opinions</Typography>
        <Typography variant="body2" color="text.secondary">
          {sorted.length} {sorted.length === 1 ? 'opinion' : 'opinions'}
        </Typography>
      </Box>

      {/* Toolbar */}
      <Card>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, py: '12px !important' }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, mobile or opinion"
            size="small"
            sx={{ flexGrow: 1, maxWidth: { md: 420 } }}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                  <Icon icon="mdi:magnify" width={18} />
                </Box>
              )
            }}
          />
          <Button
            variant="contained"
            color="error"
            disabled={selectedIds.length === 0}
            onClick={openBulkConfirm}
            startIcon={<Icon icon="mdi:delete-outline" />}
          >
            Delete Selected
          </Button>
          {selectedIds.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {selectedIds.length} selected
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" onClose={() => setOk('')}>{ok}</Alert>}

      {/* Content */}
      {loading ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Icon icon="mdi:comment-outline" width={48} style={{ color: '#9e9e9e', marginBottom: 8 }} />
            <Typography color="text.secondary">No opinions found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allPageSelected}
                        indeterminate={somePageSelected}
                        onChange={(e) => toggleSelectAllPage(e.target.checked)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Opinion</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentItems.map((item) => (
                    <TableRow key={getId(item)} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={isSelected(getId(item))}
                          onChange={(e) => toggleSelected(getId(item), e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>{getName(item) || '-'}</TableCell>
                      <TableCell>{getEmail(item) || '-'}</TableCell>
                      <TableCell>{getMobile(item) || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" noWrap title={getOpinion(item)}>
                          {getOpinion(item) || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(getCreatedAtRaw(item))}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteRow(getId(item))}
                          >
                            <Icon icon="mdi:delete-outline" width={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <GridFooter
              page={safePage}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              onPageChange={(p) => setPage(p)}
              pageSize={pageSize}
              onPageSize={(n) => setPageSize(n)}
              totalItems={sorted.length}
              itemLabel={sorted.length === 1 ? 'opinion' : 'opinions'}
            />
          </Card>

          {/* Mobile cards */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 2 }}>
            {currentItems.map((item) => (
              <Card key={getId(item)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography fontWeight={600}>{getName(item) || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected(getId(item))}
                        onChange={(e) => toggleSelected(getId(item), e.target.checked)}
                      />
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDeleteRow(getId(item))}>
                          <Icon icon="mdi:delete-outline" width={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</Typography>
                      <Typography variant="body2">{getEmail(item) || '-'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</Typography>
                      <Typography variant="body2">{getMobile(item) || '-'}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Opinion</Typography>
                    <Typography variant="body2">{getOpinion(item) || '-'}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Created {formatDate(getCreatedAtRaw(item))}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkConfirm.open} onClose={closeBulkConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Delete {selectedIds.length} selected {selectedIds.length === 1 ? 'opinion' : 'opinions'}?
          </Typography>
          <Typography variant="body2" color="error.main">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulkConfirm} variant="outlined">Cancel</Button>
          <Button onClick={confirmBulkDelete} variant="contained" color="error">
            Yes, Delete
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
  if (Array.isArray(value?.opinions)) return value.opinions
  return []
}

function getId(item) {
  return item?._id || item?.id || `${getName(item)}-${getCreatedAtRaw(item) || Math.random()}`
}

function getName(item) {
  if (!item) return '-'
  if (item.name) return item.name
  if (item.fullName) return item.fullName
  if (item.userName) return item.userName
  if (item.user?.name) return item.user.name
  if (item.user?.fullName) return item.user.fullName
  return '-'
}

function getEmail(item) {
  if (!item) return '-'
  return item.email || item.emailId || item.userEmail || item.user?.email || '-'
}

function getMobile(item) {
  if (!item) return '-'
  return item.mobileNumber || item.mobile || item.phone || item.contactNumber || item.user?.mobileNumber || item.user?.mobile || item.user?.phone || '-'
}

function getOpinion(item) {
  if (!item) return '-'
  return item.opinion || item.text || item.message || item.feedback || item.content || item.body || '-'
}

function getCreatedAtRaw(item) {
  return item?.createdAt || item?.created_at || item?.date || item?.submittedAt || ''
}

function getCreatedAt(item) {
  const value = getCreatedAtRaw(item)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0
  return date.getTime()
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}
