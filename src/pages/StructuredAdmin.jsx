import { useEffect, useRef, useState } from 'react'
import {
  uploadStructuredQuestions,
  createStructuredQuestion,
  getStructuredQuestions,
  uploadEditorImage,
  deleteStructuredQuestionsByYearPart,
  bulkDeleteStructuredQuestions,
  getQuestionYears,
  getQuestionParts,
  getQuestionPapers
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { useNavigate } from 'react-router-dom'
import { RichEditor } from '../shared/RichEditor.jsx'
import { AnswerBlocksEditor } from '../shared/AnswerBlocksEditor.jsx'
import sampleStructuredFile from '../assets/files/questions-structured-hybrid-18.xlsx'
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
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { Icon } from '@iconify/react'

export default function StructuredAdmin() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [file, setFile] = useState(null)
  const [year, setYear] = useState('')
  const [part, setPart] = useState('')
  const [paper, setPaper] = useState('')
  const [years, setYears] = useState([])
  const [parts, setParts] = useState([])
  const [papers, setPapers] = useState([])
  const [createPapers, setCreatePapers] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [purging, setPurging] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, year: '', part: '', paper: '' })
  const [bulkConfirm, setBulkConfirm] = useState({ open: false, groups: [] })
  const [selectedKeys, setSelectedKeys] = useState(() => new Set())
  const prevYearRef = useRef(year)
  const prevPartRef = useRef(part)
  const didInitYearRef = useRef(false)
  const didInitPartRef = useRef(false)
  const [createForm, setCreateForm] = useState({
    year: '',
    part: '',
    paper: '',
    questionHtml: '',
    isDirect: false,
    directAnswerBlocks: [],
    mainQuestionAnswerBlocks: [],
    subs: [{ sid: 'sub-1', part: 'a', textHtml: '', answerBlocks: [] }]
  })
  const toArray = (x) => Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : Array.isArray(x?.data?.data) ? x.data.data : []
  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || ''
  const canonicalPart = (val) => {
    const s = String(val || '').toLowerCase().replace(/\s+/g, '')
    if (s.includes('part2') || s === '2' || /2$/.test(s)) return 'part2'
    return 'part1'
  }
  const partToApi = (val) => {
    const s = String(val || '').trim()
    if (!s) return ''
    const lower = s.toLowerCase().replace(/\s+/g, '')
    if (lower.includes('part2') || lower === '2') return 'Part 2'
    if (lower.includes('part1') || lower === '1') return 'Part 1'
    return s
  }
  const normalizeYear = (val) => {
    if (val === null || typeof val === 'undefined') return ''
    if (typeof val === 'object') {
      return String(val?.value || val?.label || val?.name || '').trim()
    }
    return String(val).trim()
  }
  const normalizePartOption = (val) => {
    if (val === null || typeof val === 'undefined') return null
    const raw = typeof val === 'object'
      ? String(val?.value || val?.label || val?.name || '').trim()
      : String(val).trim()
    if (!raw) return null
    const apiValue = partToApi(raw)
    const is2 = apiValue.toLowerCase().includes('2')
    return { value: is2 ? 'part2' : 'part1', label: is2 ? 'Part 2' : 'Part 1', apiValue }
  }
  const normalizePaper = (val) => {
    if (val === null || typeof val === 'undefined') return ''
    if (typeof val === 'object') {
      return String(val?.value || val?.label || val?.name || '').trim()
    }
    return String(val).trim()
  }
  const abs = (url) => {
    if (!url) return url
    const s = String(url)
    if (s.startsWith('http') || s.startsWith('//') || s.startsWith('data:') || s.startsWith('blob:')) return s
    return baseUrl ? `${baseUrl}${s}` : s
  }
  const normalize = (p) => ({
    id: p?.id || p?._id || String(p?.id || p?._id || ''),
    year: String(p?.year ?? ''),
    part: canonicalPart(p?.part),
    paper: String(p?.paper ?? ''),
    question_text: p?.question_text || p?.questionText || p?.title || '',
    sub_questions: toArray(p?.sub_questions || p?.subQuestions).map((s) => ({
      id: s?.id || s?._id || String(s?.id || s?._id || ''),
      part: String(s?.part ?? '').toLowerCase(),
      text: s?.text || s?.title || '',
      answerType: s?.answerType || (s?.answerImage || s?.answerImageUrl || s?.imageUrl ? 'image' : 'text'),
      answer: Array.isArray(s?.answer)
        ? s.answer
        : Array.isArray(s?.answers)
        ? s.answers
        : typeof s?.answer === 'string'
        ? s.answer.split(';').map((v) => v.trim()).filter(Boolean)
        : [],
      answerImage: abs(s?.answerImage || s?.answerImageUrl || s?.imageUrl || '')
    }))
  })

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await getStructuredQuestions()

        const arr = toArray(res).map(normalize)

        if (mounted) {
          setList(arr)
        }

      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load')
        if (mounted) setList([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // Drop selections that no longer exist after refresh/upload/delete
    const allowed = new Set(getSortedGroups(list).map(groupKeyFromGroup))
    setSelectedKeys((prev) => {
      const next = new Set()
      for (const k of prev) if (allowed.has(k)) next.add(k)
      return next
    })
  }, [list])

  useEffect(() => {
    let mounted = true
    const loadCreatePapers = async () => {
      const y = String(createForm.year || '').trim()
      const p = String(createForm.part || '').trim()
      if (!y || !p) {
        if (mounted) setCreatePapers([])
        return
      }
      try {
        const res = await getQuestionPapers(y, p)
        const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.papers) ? res.papers : []
        if (mounted) setCreatePapers(arr.map(String))
      } catch {
        if (mounted) setCreatePapers([])
      }
    }
    loadCreatePapers()
    return () => { mounted = false }
  }, [createForm.year, createForm.part])

  useEffect(() => {
    let mounted = true
    const loadYears = async () => {
      try {
        const res = await getQuestionYears()
        const arr = toArray(res).map(normalizeYear).filter(Boolean)
        if (mounted) {
          setYears(arr)
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load years')
        if (mounted) setYears([])
      }
    }
    loadYears()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    const loadParts = async () => {
      if (!year) {
        if (mounted) setParts([])
        return
      }
      if (didInitYearRef.current && prevYearRef.current !== year) {
        setPart('')
        setPaper('')
        setPapers([])
      }
      try {
        const res = await getQuestionParts(year)
        const arr = toArray(res).map(normalizePartOption).filter(Boolean)
        if (mounted) setParts(arr)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load parts')
        if (mounted) setParts([])
      } finally {
        prevYearRef.current = year
        didInitYearRef.current = true
      }
    }
    loadParts()
    return () => { mounted = false }
  }, [year])

  useEffect(() => {
    let mounted = true
    const loadPapers = async () => {
      if (!year || !part) {
        if (mounted) setPapers([])
        return
      }
      if (didInitPartRef.current && prevPartRef.current !== part) {
        setPaper('')
      }
      const partApi = parts.find((p) => p.value === part)?.apiValue || partToApi(part)
      try {
        const res = await getQuestionPapers(year, partApi)
        const arr = toArray(res).map(normalizePaper).filter(Boolean)
        if (mounted) setPapers(arr)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load papers')
        if (mounted) setPapers([])
      } finally {
        prevPartRef.current = part
        didInitPartRef.current = true
      }
    }
    loadPapers()
    return () => { mounted = false }
  }, [year, part, parts])

  // Intentionally not persisting year/part/paper between sessions.

  const [uploading, setUploading] = useState(false)
  const htmlToArray = (html) => {
    const container = document.createElement('div')
    container.innerHTML = html || ''
    const items = Array.from(container.querySelectorAll('li')).map((el) => el.innerHTML?.trim()).filter(Boolean)
    const arr = items.length ? items : (container.innerHTML || '').split('<br>').map((t) => t.trim()).filter(Boolean)
    return arr
  }

  const onUpload = async (e) => {
    e.preventDefault()
    setError(''); setOk('')
    if (!file) { setError('Select .xlsx file'); return }
    if (!String(year || '').trim()) { setError('Select year'); return }
    if (!String(part || '').trim()) { setError('Select part'); return }
    if (!String(paper || '').trim()) { setError('Select paper'); return }
    if (!String(file?.name || '').toLowerCase().endsWith('.xlsx')) { setError('Only .xlsx file allowed'); return }
    try {
      setUploading(true)
      const partApi = parts.find((p) => p.value === part)?.apiValue || partToApi(part)
      await uploadStructuredQuestions({ file, year, part: partApi, paper })
      setOk('Uploaded')
      const res = await getStructuredQuestions()
      const arr = toArray(res).map(normalize)
      setList(arr)
      setFile(null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const openCreateModal = () => {
    setError('')
    setOk('')
    setCreateForm({
      year: year || '',
      part: part || '',
      paper: paper || '',
      questionHtml: '',
      isDirect: false,
      directAnswerBlocks: [],
      mainQuestionAnswerBlocks: [],
      subs: [{ sid: 'sub-1', part: 'a', textHtml: '', answerBlocks: [] }]
    })
    setCreateOpen(true)
  }

  const closeCreateModal = () => setCreateOpen(false)

  const updateCreateSub = (sid, patch) => {
    setCreateForm((prev) => ({
      ...prev,
      subs: (Array.isArray(prev.subs) ? prev.subs : []).map((s) => (s.sid === sid ? { ...s, ...patch } : s))
    }))
  }

  const addCreateSub = () => {
    setCreateForm((prev) => {
      const subs = Array.isArray(prev.subs) ? prev.subs : []
      const nextIndex = subs.length + 1
      return {
        ...prev,
        subs: [...subs, { sid: `sub-${Date.now()}-${nextIndex}`, part: '', textHtml: '', answerBlocks: [] }]
      }
    })
  }

  const removeCreateSub = (sid) => {
    setCreateForm((prev) => {
      const subs = Array.isArray(prev.subs) ? prev.subs : []
      const next = subs.filter((s) => s.sid !== sid)
      return { ...prev, subs: next.length ? next : [{ sid: `sub-${Date.now()}-1`, part: 'a', textHtml: '', answerBlocks: [] }] }
    })
  }

  const onCreateSingleQuestion = async () => {
    setError('')
    setOk('')
    if (!createForm.year) {
      setError('Please select year')
      return
    }
    if (!createForm.part) {
      setError('Please select part')
      return
    }
    if (!createForm.questionHtml.trim()) {
      setError('Please enter question')
      return
    }

    if (createForm.isDirect) {
      const blocks = Array.isArray(createForm.directAnswerBlocks) ? createForm.directAnswerBlocks : []
      if (blocks.length === 0) {
        setError('Please add at least one answer block')
        return
      }
      const payload = {
        year: Number(createForm.year),
        part: createForm.part === 'part2' ? 'Part 2' : 'Part 1',
        paper: String(createForm.paper || '').trim() || undefined,
        question_text: createForm.questionHtml,
        isDirect: true,
        answerType: 'rich',
        answerBlocks: blocks,
        answer_blocks: blocks,
        sub_questions: []
      }
      try {
        setCreating(true)
        await createStructuredQuestion(payload)
        const res = await getStructuredQuestions()
        setList(toArray(res).map(normalize))
        setOk('Question added')
        setCreateOpen(false)
      } catch (err) {
        setError(err?.response?.data?.message || 'Create failed')
      } finally {
        setCreating(false)
      }
      return
    }

    const subs = Array.isArray(createForm.subs) ? createForm.subs : []
    if (subs.length === 0) {
      setError('Please add at least one sub question')
      return
    }
    for (let i = 0; i < subs.length; i++) {
      const s = subs[i]
      if (!String(s?.part || '').trim()) return setError(`Please enter sub part for sub question ${i + 1}`)
      if (!String(s?.textHtml || '').trim()) return setError(`Please enter sub question text for sub question ${i + 1}`)
      const blocks = Array.isArray(s?.answerBlocks) ? s.answerBlocks : []
      if (blocks.length === 0) return setError(`Please add at least one answer block for sub question ${i + 1}`)
    }

    const payload = {
      year: Number(createForm.year),
      part: createForm.part === 'part2' ? 'Part 2' : 'Part 1',
      paper: String(createForm.paper || '').trim() || undefined,
      question_text: createForm.questionHtml,
      mainQuestionAnswerBlocks: Array.isArray(createForm.mainQuestionAnswerBlocks) ? createForm.mainQuestionAnswerBlocks : [],
      main_question_answer_blocks: Array.isArray(createForm.mainQuestionAnswerBlocks) ? createForm.mainQuestionAnswerBlocks : [],
      sub_questions: subs.map((s) => ({
        part: String(s.part || 'a').trim(),
        text: s.textHtml,
        answerType: 'rich',
        answerBlocks: Array.isArray(s.answerBlocks) ? s.answerBlocks : [],
        answer_blocks: Array.isArray(s.answerBlocks) ? s.answerBlocks : []
      }))
    }
    try {
      setCreating(true)
      await createStructuredQuestion(payload)
      const res = await getStructuredQuestions()
      setList(toArray(res).map(normalize))
      setOk('Question added')
      setCreateOpen(false)
    } catch (err) {
      setError(err?.response?.data?.message || 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const onDeleteByYearPart = async () => {
    setError('')
    setOk('')
    if (!String(year || '').trim()) { setError('Select year to delete'); return }
    if (!String(part || '').trim()) { setError('Select part to delete'); return }
    setDeleteConfirm({ open: true, year, part, paper })
  }

  const closeDeleteConfirm = () => setDeleteConfirm({ open: false, year: '', part: '', paper: '' })
  const closeBulkConfirm = () => setBulkConfirm({ open: false, groups: [] })

  const confirmDeleteByYearPart = async () => {
    if (!deleteConfirm.year || !deleteConfirm.part) return
    try {
      setPurging(true)
      await deleteStructuredQuestionsByYearPart(deleteConfirm.year, deleteConfirm.part, deleteConfirm.paper)
      const res = await getStructuredQuestions()
      setList(toArray(res).map(normalize))
      setOk('Deleted questions for selected year/part')
      closeDeleteConfirm()
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setPurging(false)
    }
  }

  const openBulkDeleteConfirm = () => {
    setError('')
    setOk('')
    const groups = getSortedGroups(list)
    const selected = groups.filter((g) => selectedKeys.has(groupKeyFromGroup(g)))
    if (selected.length === 0) {
      setError('Select at least one card to delete')
      return
    }
    setBulkConfirm({ open: true, groups: selected })
  }

  const confirmBulkDelete = async () => {
    const groups = Array.isArray(bulkConfirm.groups) ? bulkConfirm.groups : []
    if (groups.length === 0) return
    try {
      setPurging(true)
      const payloadGroups = groups.map((g) => ({
        year: g.year,
        part: toAdminPartLabel(g.part),
        paper: g.paper || undefined
      }))
      await bulkDeleteStructuredQuestions(payloadGroups)
      const res = await getStructuredQuestions()
      setList(toArray(res).map(normalize))
      setSelectedKeys(new Set())
      setOk(`Deleted ${groups.length} group(s)`)
      closeBulkConfirm()
    } catch (err) {
      setError(err?.response?.data?.message || 'Bulk delete failed')
    } finally {
      setPurging(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Structured Questions</Typography>
        <Button
          variant="contained"
          startIcon={<Icon icon="mdi:plus" />}
          onClick={openCreateModal}
        >
          Add Question
        </Button>
      </Box>

      {/* Upload Form */}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={onUpload} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Icon icon="mdi:file-upload-outline" />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {file ? file.name : 'Choose .xlsx'}
              <input type="file" accept=".xlsx" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={(e) => setYear(e.target.value)} required>
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Part</InputLabel>
              <Select value={part} label="Part" onChange={(e) => setPart(e.target.value)} required>
                {parts.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }} disabled={!part}>
              <InputLabel>Paper</InputLabel>
              <Select value={paper} label="Paper" onChange={(e) => setPaper(e.target.value)} required>
                {papers.map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:upload" />}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Sample Download */}
      <Typography variant="body2" color="text.secondary">
        Sample file:{' '}
        <Box component="a" href={sampleStructuredFile} download sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Download .xlsx template
        </Box>
      </Typography>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" onClose={() => setOk('')}>{ok}</Alert>}

      {/* List */}
      {loading ? <Loader /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Bulk actions bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selected: {selectedKeys.size}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedKeys.size > 0 && selectedKeys.size === getSortedGroups(list).length}
                    onChange={(e) => {
                      const groups = getSortedGroups(list)
                      const allKeys = groups.map(groupKeyFromGroup)
                      setSelectedKeys(e.target.checked ? new Set(allKeys) : new Set())
                    }}
                    size="small"
                  />
                }
                label={<Typography variant="body2">Select all</Typography>}
              />
              <Button
                variant="contained"
                color="error"
                size="small"
                disabled={purging || selectedKeys.size === 0}
                onClick={openBulkDeleteConfirm}
                startIcon={<Icon icon="mdi:delete-outline" />}
              >
                Delete selected
              </Button>
            </Box>
          </Box>

          {/* Group cards grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {getSortedGroups(list).map((g) => (
              <Box key={groupKeyFromGroup(g)}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    position: 'relative',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    height: '100%',
                  }}
                  onClick={() => navigate(`/structured-questions/${g.year}/${g.part}${g.paper ? `/${encodeURIComponent(g.paper)}` : ''}`)}
                >
                  <CardContent sx={{ p: '18px !important', pr: '48px !important', minHeight: 80 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox
                        size="small"
                        checked={selectedKeys.has(groupKeyFromGroup(g))}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const key = groupKeyFromGroup(g)
                          setSelectedKeys((prev) => {
                            const next = new Set(prev)
                            if (e.target.checked) next.add(key)
                            else next.delete(key)
                            return next
                          })
                        }}
                        sx={{ mt: -0.5, p: 0.25 }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ mb: 0.75, letterSpacing: '0.01em', fontSize: '0.875rem' }}>
                          {g.year} &bull; {String(g.part).replace('part', 'PART').toUpperCase()}
                          {g.paper ? <> &bull; Paper {String(g.paper).replace(/^paper\s*/i, '')}</> : null}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ bgcolor: 'primary.main', color: '#fff', px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, fontSize: '0.72rem' }}>
                            {g.countParents} Q
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                            {g.countSubs} sub-questions
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                  <Tooltip title="Delete group">
                    <IconButton
                      size="small"
                      color="error"
                      sx={{ position: 'absolute', top: 6, right: 6 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm({ open: true, year: String(g.year), part: String(g.part), paper: String(g.paper || '') })
                      }}
                    >
                      <Icon icon="mdi:delete" />
                    </IconButton>
                  </Tooltip>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Create Question Dialog */}
      <Dialog open={createOpen} onClose={closeCreateModal} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle>Add Structured Question</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={createForm.year}
                  label="Year"
                  onChange={(e) => setCreateForm((s) => ({ ...s, year: e.target.value }))}
                  required
                >
                  {[
                    '2011','2012','2013','2014','2015',
                    '2016','2017','2018','2019','2020',
                    '2021','2022','2023','2024','2025',
                    '2026',
                    '2027','2028','2029','2030','2031',
                    '2032','2033','2034','2035','2036',
                    '2037','2038','2039','2040','2041'
                  ].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Part</InputLabel>
                <Select
                  value={createForm.part}
                  label="Part"
                  onChange={(e) => setCreateForm((s) => ({ ...s, part: e.target.value }))}
                  required
                >
                  <MenuItem value="part1">Part 1</MenuItem>
                  <MenuItem value="part2">Part 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" disabled={!createForm.part || !createForm.year}>
                <InputLabel>Paper (optional)</InputLabel>
                <Select
                  value={createForm.paper}
                  label="Paper (optional)"
                  onChange={(e) => setCreateForm((s) => ({ ...s, paper: e.target.value }))}
                >
                  <MenuItem value="">
                    {createForm.part && createForm.year ? 'Select paper' : 'Select year/part first'}
                  </MenuItem>
                  {createPapers.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ pt: 0.5 }}>
                <Typography variant="body2" gutterBottom>Question Type</Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(createForm.isDirect)}
                      onChange={(e) => setCreateForm((s) => ({ ...s, isDirect: e.target.checked }))}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Direct (no sub-questions)</Typography>}
                />
              </Box>
            </Grid>
          </Grid>

          <Box>
            <Typography variant="body2" gutterBottom>Question</Typography>
            <RichEditor value={createForm.questionHtml} onChange={(html) => setCreateForm((s) => ({ ...s, questionHtml: html }))} />
          </Box>

          {createForm.isDirect ? (
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Direct Answer (Rich)</Typography>
              <AnswerBlocksEditor
                value={createForm.directAnswerBlocks}
                onChange={(blocks) => setCreateForm((s) => ({ ...s, directAnswerBlocks: blocks }))}
              />
            </Paper>
          ) : (
            <>
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Main Question Answer (Rich)</Typography>
                <AnswerBlocksEditor
                  value={createForm.mainQuestionAnswerBlocks}
                  onChange={(blocks) => setCreateForm((s) => ({ ...s, mainQuestionAnswerBlocks: blocks }))}
                />
              </Paper>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Sub Questions</Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={addCreateSub}
                  startIcon={<Icon icon="mdi:plus" />}
                >
                  Add Sub Question
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(Array.isArray(createForm.subs) ? createForm.subs : []).map((sub, index) => (
                  <Paper key={sub.sid || index} variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>Sub Question {index + 1}</Typography>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => removeCreateSub(sub.sid)}
                        startIcon={<Icon icon="mdi:minus" />}
                      >
                        Remove
                      </Button>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Sub Part"
                          size="small"
                          fullWidth
                          value={sub.part}
                          onChange={(e) => updateCreateSub(sub.sid, { part: e.target.value })}
                          placeholder="a"
                        />
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="body2" gutterBottom>Sub Question</Typography>
                      <RichEditor value={sub.textHtml} onChange={(html) => updateCreateSub(sub.sid, { textHtml: html })} />
                    </Box>

                    <Box>
                      <Typography variant="body2" gutterBottom>Answer</Typography>
                      <AnswerBlocksEditor
                        value={sub.answerBlocks}
                        onChange={(blocks) => updateCreateSub(sub.sid, { answerBlocks: blocks })}
                      />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={closeCreateModal}>Cancel</Button>
          <Button
            variant="contained"
            disabled={creating}
            onClick={onCreateSingleQuestion}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:check" />}
          >
            {creating ? 'Adding...' : 'Add Question'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm.open} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete all structured questions for:
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {deleteConfirm.year} | {String(deleteConfirm.part).toUpperCase()} {deleteConfirm.paper ? `| ${deleteConfirm.paper}` : ''}
          </Typography>
          <Alert severity="error">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" disabled={purging} onClick={closeDeleteConfirm}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={purging}
            onClick={confirmDeleteByYearPart}
            startIcon={purging ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:delete" />}
          >
            {purging ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirm Dialog */}
      <Dialog open={bulkConfirm.open} onClose={closeBulkConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete all structured questions for {bulkConfirm.groups.length} selected group(s).
          </Typography>
          <Paper
            variant="outlined"
            sx={{ maxHeight: 192, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            {(bulkConfirm.groups || []).map((g) => (
              <Typography key={groupKeyFromGroup(g)} variant="body2">
                {g.year} | {String(g.part).toUpperCase()} {g.paper ? `| ${g.paper}` : ''}
              </Typography>
            ))}
          </Paper>
          <Alert severity="error">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" disabled={purging} onClick={closeBulkConfirm}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={purging}
            onClick={confirmBulkDelete}
            startIcon={purging ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:delete" />}
          >
            {purging ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function groupByYearPart(list) {
  const map = {}
  for (const p of list) {
    const key = `${p.year}-${p.part}-${p.paper || ''}`
    if (!map[key]) map[key] = { year: p.year, part: p.part, paper: p.paper || '', countParents: 0, countSubs: 0 }
    map[key].countParents += 1
    map[key].countSubs += (Array.isArray(p.sub_questions) ? p.sub_questions.length : 0)
  }
  return map
}

function groupKeyFromGroup(g) {
  return `${g.year}-${g.part}-${g.paper || ''}`
}

function toAdminPartLabel(part) {
  return String(part || '').toLowerCase().includes('2') ? 'Part 2' : 'Part 1'
}

function parsePaperNumber(paper) {
  const m = String(paper || '').match(/(\d+)/)
  return m ? Number(m[1]) : NaN
}

function getSortedGroups(list) {
  const groups = Object.values(groupByYearPart(list))
  return groups.sort((a, b) => {
    const ay = Number(a.year); const by = Number(b.year)
    if (Number.isFinite(ay) && Number.isFinite(by) && ay !== by) return ay - by
    if (String(a.year) !== String(b.year)) return String(a.year).localeCompare(String(b.year))

    const ap = String(a.part || '').toLowerCase().includes('2') ? 2 : 1
    const bp = String(b.part || '').toLowerCase().includes('2') ? 2 : 1
    if (ap !== bp) return ap - bp

    const an = parsePaperNumber(a.paper)
    const bn = parsePaperNumber(b.paper)
    if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn
    return String(a.paper || '').localeCompare(String(b.paper || ''))
  })
}
