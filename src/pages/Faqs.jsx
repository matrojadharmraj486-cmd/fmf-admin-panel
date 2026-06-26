import { useEffect, useMemo, useState } from 'react'
import { createFaq, deleteFaq, listFaqsAdmin, updateFaq } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Icon } from '@iconify/react'

export default function Faqs() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [search, setSearch] = useState('')
  const [createQuestion, setCreateQuestion] = useState('')
  const [createAnswerHtml, setCreateAnswerHtml] = useState('')
  const [createIsActive, setCreateIsActive] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editId, setEditId] = useState('')
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswerHtml, setEditAnswerHtml] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', label: '' })

  const toArray = (value) => Array.isArray(value)
    ? value
    : Array.isArray(value?.data)
    ? value.data
    : Array.isArray(value?.data?.data)
    ? value.data.data
    : Array.isArray(value?.faqs)
    ? value.faqs
    : []

  const getId = (f) => f?._id || f?.id || ''
  const getQuestion = (f) => f?.question || f?.title || f?.q || ''
  const getAnswer = (f) => f?.answer || f?.answerHtml || f?.answer_html || f?.a || ''
  const getIsActive = (f) => {
    if (typeof f?.isActive === 'boolean') return f.isActive
    if (typeof f?.active === 'boolean') return f.active
    if (typeof f?.is_active === 'boolean') return f.is_active
    return true
  }
  const getOrder = (f) => f?.order ?? f?.position ?? f?.sortOrder ?? null

  const stripHtml = (html) => {
    const div = document.createElement('div')
    div.innerHTML = html || ''
    return (div.textContent || div.innerText || '').trim()
  }

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listFaqsAdmin()
      setItems(toArray(res))
    } catch (err) {
      setItems([])
      setError(err?.response?.data?.message || 'Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = !q
      ? items
      : items.filter((f) => {
        const hay = `${getQuestion(f)} ${stripHtml(getAnswer(f))}`.toLowerCase()
        return hay.includes(q)
      })
    return [...filtered].sort((a, b) => {
      const ao = getOrder(a)
      const bo = getOrder(b)
      const aHas = Number.isFinite(Number(ao))
      const bHas = Number.isFinite(Number(bo))
      if (aHas && bHas) return Number(ao) - Number(bo)
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      const at = new Date(a?.createdAt || a?.updatedAt || 0).getTime()
      const bt = new Date(b?.createdAt || b?.updatedAt || 0).getTime()
      return at - bt
    })
  }, [items, search])

  const resetCreate = () => {
    setCreateQuestion('')
    setCreateAnswerHtml('')
    setCreateIsActive(true)
  }

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    if (!createQuestion.trim()) return setError('Please enter question')
    if (!createAnswerHtml.trim()) return setError('Please enter answer')
    try {
      setSaving(true)
      await createFaq({ question: createQuestion.trim(), answer: createAnswerHtml, isActive: createIsActive })
      setOk('FAQ added')
      resetCreate()
      await fetchFaqs()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create FAQ')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (f) => {
    setOk('')
    setError('')
    setEditId(getId(f))
    setEditQuestion(getQuestion(f))
    setEditAnswerHtml(getAnswer(f))
    setEditIsActive(getIsActive(f))
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditSaving(false)
    setEditId('')
    setEditQuestion('')
    setEditAnswerHtml('')
    setEditIsActive(true)
  }

  const saveEdit = async () => {
    if (!editId) return
    setError('')
    setOk('')
    if (!editQuestion.trim()) return setError('Please enter question')
    if (!editAnswerHtml.trim()) return setError('Please enter answer')
    try {
      setEditSaving(true)
      await updateFaq(editId, { question: editQuestion.trim(), answer: editAnswerHtml, isActive: editIsActive })
      setOk('Saved')
      closeEdit()
      await fetchFaqs()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update FAQ')
    } finally {
      setEditSaving(false)
    }
  }

  const openDelete = (f) => {
    setOk('')
    setError('')
    setDeleteConfirm({ open: true, id: getId(f), label: getQuestion(f) || 'this FAQ' })
  }

  const closeDelete = () => setDeleteConfirm({ open: false, id: '', label: '' })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    setError('')
    setOk('')
    try {
      await deleteFaq(deleteConfirm.id)
      setOk('Deleted')
      closeDelete()
      await fetchFaqs()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete FAQ')
    }
  }

  const toggleActive = async (f) => {
    const id = getId(f)
    if (!id) return
    setError('')
    setOk('')
    try {
      await updateFaq(id, { isActive: !getIsActive(f) })
      setItems((prev) => prev.map((x) => (getId(x) === id ? { ...x, isActive: !getIsActive(f) } : x)))
      setOk('Updated')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          FAQ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {sorted.length} items
        </Typography>
      </Box>

      {/* Create FAQ Form */}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={onCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={8}>
                <TextField
                  size="small"
                  fullWidth
                  label="Question"
                  value={createQuestion}
                  onChange={(e) => setCreateQuestion(e.target.value)}
                  placeholder="Enter FAQ question"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Visible in App</InputLabel>
                  <Select
                    value={createIsActive ? 'yes' : 'no'}
                    label="Visible in App"
                    onChange={(e) => setCreateIsActive(e.target.value === 'yes')}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Answer
              </Typography>
              <RichEditor value={createAnswerHtml} onChange={setCreateAnswerHtml} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button type="button" variant="outlined" onClick={resetCreate}>
                Clear
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={<Icon icon="mdi:plus" />}
              >
                {saving ? 'Adding...' : 'Add FAQ'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card>
        <CardContent>
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQ"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <Icon icon="mdi:magnify" />
                </Box>
              ),
            }}
            sx={{ maxWidth: { md: 480 } }}
          />
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

      {/* FAQ List */}
      {loading ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No FAQs found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sorted.map((f) => (
            <Card key={getId(f) || Math.random()}>
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                  <Box>
                    <Typography fontWeight={600} gutterBottom>
                      {getQuestion(f) || '-'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getIsActive(f) ? 'Visible in App' : 'Hidden'}
                        color={getIsActive(f) ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                      {Number.isFinite(Number(getOrder(f))) && (
                        <Typography variant="caption" color="text.secondary">
                          Order: {getOrder(f)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={getIsActive(f) ? 'Hide from app' : 'Show in app'}>
                      <Button
                        size="small"
                        variant={getIsActive(f) ? 'contained' : 'outlined'}
                        onClick={() => toggleActive(f)}
                        startIcon={<Icon icon={getIsActive(f) ? 'mdi:eye-off' : 'mdi:eye'} />}
                      >
                        {getIsActive(f) ? 'Hide' : 'Show'}
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => openEdit(f)}>
                        <Icon icon="mdi:pencil" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => openDelete(f)}>
                        <Icon icon="mdi:delete" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {stripHtml(getAnswer(f)) || '-'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm.open} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm.label}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete} variant="outlined">
            Cancel
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit FAQ</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={8}>
                <TextField
                  size="small"
                  fullWidth
                  label="Question"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Visible in App</InputLabel>
                  <Select
                    value={editIsActive ? 'yes' : 'no'}
                    label="Visible in App"
                    onChange={(e) => setEditIsActive(e.target.value === 'yes')}
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Answer
              </Typography>
              <RichEditor value={editAnswerHtml} onChange={setEditAnswerHtml} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeEdit} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={editSaving}
            onClick={saveEdit}
          >
            {editSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
