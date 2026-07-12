import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getStructuredQuestionsFiltered,
  api,
  updateStructuredParent,
  updateStructuredSub,
  deleteStructuredParent
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'
import { AnswerBlocksEditor } from '../shared/AnswerBlocksEditor.jsx'
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
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'

const emptyEditState = {
  open: false,
  pid: null,
  questionHtml: '',
  isDirect: false,
  parentAnswerBlocks: [],
  mainQuestionAnswerBlocks: [],
  subs: []
}

export default function StructuredDetail() {
  const { year, part, paper } = useParams()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editState, setEditState] = useState(emptyEditState)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' })
  const [qotdSavingId, setQotdSavingId] = useState(null)

  const baseUrl = import.meta.env.VITE_API_BASE_URL || api?.defaults?.baseURL || ''
  const abs = (url) => {
    if (!url) return ''
    const s = String(url)
    if (s.startsWith('http') || s.startsWith('//') || s.startsWith('data:') || s.startsWith('blob:')) return s
    const base = String(baseUrl).replace(/\/+$/, '')
    const path = s.startsWith('/') ? s : `/${s}`
    return `${base}${path}`
  }

  const answerArrayToHtml = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return ''
    if (arr.length === 1) return arr[0] || ''
    return `<ul>${arr.map((a) => `<li>${a || ''}</li>`).join('')}</ul>`
  }

  const extractQuestionNumber = (val) => {
    if (val === null || typeof val === 'undefined') return null
    const match = String(val).match(/(\d+)/)
    if (!match) return null
    const num = Number.parseInt(match[1], 10)
    return Number.isFinite(num) ? num : null
  }

  const norm = (p) => ({
    id: p?.id || p?._id || String(p?.id || p?._id || ''),
    dbid: p?._id || p?.id || '',
    year: String(p?.year ?? ''),
    part: String(p?.part ?? '').toLowerCase().includes('2') ? 'part2' : 'part1',
    paper: String(p?.paper ?? ''),
    question_text: p?.question_text || p?.questionText || p?.title || '',
    questionId: p?.questionId || p?.question_id || p?.qid || p?.questionNo || p?.question_no || '',
    isDirect: Boolean(p?.isDirect) || (Array.isArray(p?.sub_questions) ? p.sub_questions.length === 0 : false),
    answerType: p?.answerType || (Array.isArray(p?.answerBlocks) || Array.isArray(p?.answer_blocks) ? 'rich' : (p?.answerImage ? 'image' : 'text')),
    answer: Array.isArray(p?.answer) ? p.answer : [],
    answerHtml: answerArrayToHtml(Array.isArray(p?.answer) ? p.answer : []),
    answerImage: abs(p?.answerImage || ''),
    answerBlocks: Array.isArray(p?.answerBlocks) ? p.answerBlocks : Array.isArray(p?.answer_blocks) ? p.answer_blocks : [],
    mainQuestionAnswer: Array.isArray(p?.main_question_answer) ? p.main_question_answer : [],
    mainQuestionAnswerHtml: answerArrayToHtml(Array.isArray(p?.main_question_answer) ? p.main_question_answer : []),
    mainQuestionAnswerBlocks: Array.isArray(p?.mainQuestionAnswerBlocks) ? p.mainQuestionAnswerBlocks : Array.isArray(p?.main_question_answer_blocks) ? p.main_question_answer_blocks : [],
    sub_questions: (Array.isArray(p?.sub_questions) ? p.sub_questions : []).map((s) => ({
      id: s?.id || s?._id || String(s?.id || s?._id || ''),
      subDbid: s?._id || s?.id || '',
      part: String(s?.part ?? ''),
      text: s?.text || s?.title || '',
      answerType: s?.answerType || (Array.isArray(s?.answerBlocks) || Array.isArray(s?.answer_blocks) ? 'rich' : (s?.answerImage ? 'image' : 'text')),
      answer: Array.isArray(s?.answer) ? s.answer : [],
      answerHtml: answerArrayToHtml(Array.isArray(s?.answer) ? s.answer : []),
      answerImage: abs(s?.answerImage || ''),
      answerBlocks: Array.isArray(s?.answerBlocks) ? s.answerBlocks : Array.isArray(s?.answer_blocks) ? s.answer_blocks : []
    }))
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await getStructuredQuestionsFiltered(year, part, paper)
        const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
        const arr = data.map(norm).map((item, index) => ({
          ...item,
          __index: index,
          __qnum: extractQuestionNumber(item.questionId)
        }))
        const hasQnum = arr.some((p) => Number.isFinite(p.__qnum))
        const sorted = hasQnum
          ? [...arr].sort((a, b) => {
            const aHas = Number.isFinite(a.__qnum)
            const bHas = Number.isFinite(b.__qnum)
            if (aHas && bHas) return a.__qnum - b.__qnum
            if (aHas && !bHas) return -1
            if (!aHas && bHas) return 1
            return a.__index - b.__index
          })
          : arr
        const cleaned = sorted.map(({ __index, __qnum, ...rest }) => rest)
        if (mounted) setList(cleaned)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [year, part])

  const editParent = async (id, payload) => {
    await updateStructuredParent(id, payload)
    setList((prev) => prev.map((p) => (p.dbid === id ? { ...p, ...payload } : p)))
  }

  const editSub = async (id, subId, payload) => {
    await updateStructuredSub(id, subId, payload)
    setList((prev) => prev.map((p) => {
      if (p.dbid !== id) return p
      const subs = (p.sub_questions || []).map((s) => {
        if (s.subDbid !== subId) return s
        const next = { ...s, ...payload }
        if (payload.answerType === 'text') next.answerHtml = answerArrayToHtml(payload.answer || [])
        if (payload.answerType === 'image') next.answerImage = abs(payload.answerImage || '')
        if (payload.answerType === 'rich') next.answerBlocks = Array.isArray(payload.answerBlocks) ? payload.answerBlocks : []
        return next
      })
      return { ...p, sub_questions: subs }
    }))
  }

  const removeParent = async (id) => {
    setError('')
    setOk('')
    setDeleting(true)
    try {
      await deleteStructuredParent(id)
      setList((prev) => prev.filter((p) => p.dbid !== id))
      setOk('Deleted')
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteConfirm = (parent) => {
    const text = String(parent?.question_text || '').replace(/<[^>]*>/g, '').trim()
    setDeleteConfirm({
      open: true,
      id: parent?.dbid || parent?.id || null,
      title: text || 'this question'
    })
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, id: null, title: '' })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    await removeParent(deleteConfirm.id)
    closeDeleteConfirm()
  }

  const htmlToArray = (html) => {
    const container = document.createElement('div')
    container.innerHTML = html || ''
    const items = Array.from(container.querySelectorAll('li')).map((el) => el.innerHTML?.trim()).filter(Boolean)
    const arr = items.length ? items : (container.innerHTML || '').split('<br>').map((t) => t.trim()).filter(Boolean)
    return arr
  }

  const setAsQotd = async (parent) => {
    if (!parent?.dbid) return
    setError('')
    setOk('')
    setQotdSavingId(parent.dbid)
    try {
      await updateStructuredParent(parent.dbid, { QOTD: true })
      setList((prev) => prev.map((p) => (p.dbid === parent.dbid ? { ...p, QOTD: true, qotd: true } : p)))
      setOk('QOTD updated')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to set QOTD')
    } finally {
      setQotdSavingId(null)
    }
  }

  const startEdit = (parent) => {
    const blocksFrom = (item) => {
      if (Array.isArray(item?.answerBlocks) && item.answerBlocks.length) return item.answerBlocks
      if (item?.answerType === 'image' && item?.answerImage) return [{ type: 'image', url: item.answerImage }]
      if (item?.answerHtml) return [{ type: 'text', text: item.answerHtml }]
      return []
    }
    const blocksFromMain = (item) => {
      if (Array.isArray(item?.mainQuestionAnswerBlocks) && item.mainQuestionAnswerBlocks.length) return item.mainQuestionAnswerBlocks
      if (item?.mainQuestionAnswerHtml) return [{ type: 'text', text: item.mainQuestionAnswerHtml }]
      return []
    }
    const blocksFromSub = (sub) => {
      if (Array.isArray(sub?.answerBlocks) && sub.answerBlocks.length) return sub.answerBlocks
      if (sub?.answerType === 'image' && sub?.answerImage) return [{ type: 'image', url: sub.answerImage }]
      if (sub?.answerHtml) return [{ type: 'text', text: sub.answerHtml }]
      return []
    }

    setEditState({
      open: true,
      pid: parent.dbid,
      questionHtml: parent.question_text || '',
      isDirect: Boolean(parent.isDirect) || (parent.sub_questions || []).length === 0,
      parentAnswerBlocks: blocksFrom(parent),
      mainQuestionAnswerBlocks: blocksFromMain(parent),
      subs: (parent.sub_questions || []).map((s) => ({
        sid: s.subDbid || s.id,
        part: s.part || '',
        textHtml: s.text || '',
        answerBlocks: blocksFromSub(s)
      }))
    })
  }

  const closeEdit = () => {
    setEditState(emptyEditState)
  }

  const updateEditSub = (sid, patch) => {
    setEditState((prev) => ({
      ...prev,
      subs: prev.subs.map((s) => (s.sid === sid ? { ...s, ...patch } : s))
    }))
  }

  const saveEdit = async () => {
    if (!editState.pid) return
    setError('')
    setOk('')
    setSaving(true)
    try {
      const parentPayload = { question_text: editState.questionHtml }
      if (editState.isDirect) {
        parentPayload.answerType = 'rich'
        parentPayload.answerBlocks = Array.isArray(editState.parentAnswerBlocks) ? editState.parentAnswerBlocks : []
        parentPayload.answer_blocks = parentPayload.answerBlocks
      } else {
        const blocks = Array.isArray(editState.mainQuestionAnswerBlocks) ? editState.mainQuestionAnswerBlocks : []
        parentPayload.mainQuestionAnswerType = 'rich'
        parentPayload.mainQuestionAnswerBlocks = blocks
        parentPayload.main_question_answer_type = 'rich'
        parentPayload.main_question_answer_blocks = blocks
      }
      await editParent(editState.pid, parentPayload)
      for (const sub of editState.subs) {
        const blocks = Array.isArray(sub.answerBlocks) ? sub.answerBlocks : []
        const payload = { text: sub.textHtml, answerType: 'rich', answerBlocks: blocks, answer_blocks: blocks }
        await editSub(editState.pid, sub.sid, payload)
      }
      setOk('Saved')
      closeEdit()
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" fontWeight={600}>
          Structured | {year} | {String(part).toUpperCase()} {paper ? `| ${paper}` : ''}
        </Typography>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" onClose={() => setOk('')}>{ok}</Alert>}

      {/* Question list */}
      {loading ? <Loader /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {list.map((parent, pIdx) => (
            <Card key={parent.dbid || `${parent.id}-${pIdx}`} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Question header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="h6" fontWeight={600} lineHeight={1.4}>
                      {parent.questionId && (
                        <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>{parent.questionId}.</Box>
                      )}
                      <span dangerouslySetInnerHTML={{ __html: parent.question_text }} />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {parent.year} | {String(parent.part).toUpperCase()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => startEdit(parent)}
                      startIcon={<Icon icon="mdi:pencil-outline" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => setAsQotd(parent)}
                      disabled={qotdSavingId === parent.dbid}
                      startIcon={qotdSavingId === parent.dbid ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:star-outline" />}
                    >
                      {qotdSavingId === parent.dbid ? 'Setting...' : 'Add QOTD'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => openDeleteConfirm(parent)}
                      startIcon={<Icon icon="mdi:delete-outline" />}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>

                {/* Direct answer */}
                {parent.isDirect && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">
                      Main Answer | {parent.answerType || 'text'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {(parent.answerType || 'text') === 'text' && Array.isArray(parent.answer) && (
                        <Box component="ul" sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {parent.answer.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />)}
                        </Box>
                      )}
                      {(parent.answerType || 'text') === 'image' && parent.answerImage && (
                        <Box
                          component="img"
                          src={parent.answerImage}
                          alt="answer"
                          sx={{ mt: 1, maxHeight: 192, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                        />
                      )}
                      {(parent.answerType || 'text') === 'rich' && Array.isArray(parent.answerBlocks) && parent.answerBlocks.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {parent.answerBlocks.map((b, idx) => (
                            <Box key={`${b?.type || 'block'}-${idx}`}>
                              {b?.type === 'image' ? (
                                b?.url ? (
                                  <Box
                                    component="img"
                                    src={abs(b.url)}
                                    alt="answer"
                                    sx={{ maxHeight: 224, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                                  />
                                ) : null
                              ) : (
                                <Box dangerouslySetInnerHTML={{ __html: b?.text || '' }} />
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )}

                {/* Main question answer (non-direct with answer blocks) */}
                {!parent.isDirect && ((Array.isArray(parent.mainQuestionAnswer) && parent.mainQuestionAnswer.length > 0) || (Array.isArray(parent.mainQuestionAnswerBlocks) && parent.mainQuestionAnswerBlocks.length > 0)) && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="caption" color="text.secondary">Main Question Answer</Typography>
                    <Box sx={{ mt: 1 }}>
                      {Array.isArray(parent.mainQuestionAnswerBlocks) && parent.mainQuestionAnswerBlocks.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {parent.mainQuestionAnswerBlocks.map((b, idx) => (
                            <Box key={`${b?.type || 'block'}-${idx}`}>
                              {b?.type === 'image' ? (
                                b?.url ? (
                                  <Box
                                    component="img"
                                    src={abs(b.url)}
                                    alt="answer"
                                    sx={{ maxHeight: 224, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                                  />
                                ) : null
                              ) : (
                                <Box dangerouslySetInnerHTML={{ __html: b?.text || '' }} />
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : parent.mainQuestionAnswer.length === 1 ? (
                        <Box dangerouslySetInnerHTML={{ __html: parent.mainQuestionAnswer[0] || '' }} />
                      ) : (
                        <Box component="ul" sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {parent.mainQuestionAnswer.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />)}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )}

                {/* Sub questions */}
                {(parent.sub_questions || []).map((sub, sIdx) => (
                  <Paper key={`${sub.id}-${sIdx}`} variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                      <Box>
                        <Box fontWeight={500} dangerouslySetInnerHTML={{ __html: sub.text }} />
                        <Typography variant="caption" color="text.secondary">
                          {String(sub.part).toUpperCase()} | {sub.answerType}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      {sub.answerType === 'text' && Array.isArray(sub.answer) && (
                        <Box component="ul" sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {sub.answer.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />)}
                        </Box>
                      )}
                      {sub.answerType === 'image' && sub.answerImage && (
                        <Box
                          component="img"
                          src={sub.answerImage}
                          alt="answer"
                          sx={{ mt: 1, maxHeight: 192, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                        />
                      )}
                      {sub.answerType === 'rich' && Array.isArray(sub.answerBlocks) && sub.answerBlocks.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {sub.answerBlocks.map((b, idx) => (
                            <Box key={`${b?.type || 'block'}-${idx}`}>
                              {b?.type === 'image' ? (
                                b?.url ? (
                                  <Box
                                    component="img"
                                    src={abs(b.url)}
                                    alt="answer"
                                    sx={{ maxHeight: 224, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                                  />
                                ) : null
                              ) : (
                                <Box dangerouslySetInnerHTML={{ __html: b?.text || '' }} />
                              )}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm.open} onClose={closeDeleteConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this question?
          </Typography>
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {deleteConfirm.title}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" disabled={deleting} onClick={closeDeleteConfirm}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={confirmDelete}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:delete" />}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editState.open} onClose={closeEdit} maxWidth="lg" fullWidth PaperProps={{ sx: { maxHeight: '90vh' } }}>
        <DialogTitle>Edit Question and Answers</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="body2" gutterBottom>Question</Typography>
            <RichEditor value={editState.questionHtml} onChange={(html) => setEditState((s) => ({ ...s, questionHtml: html }))} />
          </Box>

          {editState.isDirect && (
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Direct Answer</Typography>
              <AnswerBlocksEditor
                value={editState.parentAnswerBlocks}
                onChange={(blocks) => setEditState((s) => ({ ...s, parentAnswerBlocks: blocks }))}
              />
            </Paper>
          )}

          {!editState.isDirect && (
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>Main Question Answer</Typography>
              <AnswerBlocksEditor
                value={editState.mainQuestionAnswerBlocks}
                onChange={(blocks) => setEditState((s) => ({ ...s, mainQuestionAnswerBlocks: blocks }))}
              />
            </Paper>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editState.subs.map((sub, index) => (
              <Paper key={sub.sid || index} variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Sub Question {index + 1}</Typography>

                <Box>
                  <Typography variant="body2" gutterBottom>Sub Question Text</Typography>
                  <RichEditor value={sub.textHtml} onChange={(html) => updateEditSub(sub.sid, { textHtml: html })} />
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>Answer</Typography>
                  <AnswerBlocksEditor
                    value={sub.answerBlocks}
                    onChange={(blocks) => updateEditSub(sub.sid, { answerBlocks: blocks })}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" onClick={closeEdit}>Cancel</Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={saveEdit}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:content-save-outline" />}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
