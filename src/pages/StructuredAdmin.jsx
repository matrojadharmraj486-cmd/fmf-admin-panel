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
  console
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Structured Questions</h2>
        <button onClick={openCreateModal} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Add Question
        </button>
      </div>
      <form onSubmit={onUpload} className="grid md:grid-cols-5 gap-3 bg-white dark:bg-gray-800 p-3 rounded shadow">
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" />
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={year} onChange={(e) => setYear(e.target.value)} required>
          <option value="">Select year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={part} onChange={(e) => setPart(e.target.value)} required>
          <option value="">Select part</option>
          {parts.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          value={paper}
          onChange={(e) => setPaper(e.target.value)}
          disabled={!part}
          required
        >
          <option value="">{part ? 'Select paper' : 'Select part first'}</option>
          {papers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button disabled={uploading} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60 w-full">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Sample file: <a href={sampleStructuredFile} download className="text-blue-600 hover:underline">Download .xlsx template</a>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
      {loading ? <Loader /> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Selected: {selectedKeys.size}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm select-none">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
                  checked={selectedKeys.size > 0 && selectedKeys.size === getSortedGroups(list).length}
                  onChange={(e) => {
                    const groups = getSortedGroups(list)
                    const allKeys = groups.map(groupKeyFromGroup)
                    setSelectedKeys(e.target.checked ? new Set(allKeys) : new Set())
                  }}
                />
                Select all
              </label>
              <button
                type="button"
                disabled={purging || selectedKeys.size === 0}
                onClick={openBulkDeleteConfirm}
                className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                Delete selected
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getSortedGroups(list).map((g) => (
              <div key={groupKeyFromGroup(g)} className="relative rounded bg-white dark:bg-gray-800 shadow p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/structured-questions/${g.year}/${g.part}${g.paper ? `/${encodeURIComponent(g.paper)}` : ''}`)}>
                <div className="flex items-start gap-3 pr-14">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900"
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
                  />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                  {g.year} • {String(g.part).toUpperCase()} {g.paper ? `• ${g.paper}` : ''}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{g.countParents} parent • {g.countSubs} sub</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm({ open: true, year: String(g.year), part: String(g.part), paper: String(g.paper || "") })
                  }}
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-5xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="font-semibold text-lg">Add Structured Question</div>
            <div className="grid md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="block text-sm">Year</label>
                <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full" value={createForm.year} onChange={(e) => setCreateForm((s) => ({ ...s, year: e.target.value }))} required>
                  <option value="">Select year</option>
                  {[
                      '2011','2012','2013','2014','2015',
  '2016','2017','2018','2019','2020',
  '2021','2022','2023','2024','2025',
  '2026',
  '2027','2028','2029','2030','2031',
  '2032','2033','2034','2035','2036',
  '2037','2038','2039','2040','2041'
].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Part</label>
                <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full" value={createForm.part} onChange={(e) => setCreateForm((s) => ({ ...s, part: e.target.value }))} required>
                  <option value="">Select part</option>
                  <option value="part1">Part 1</option>
                  <option value="part2">Part 2</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Paper (optional)</label>
                <select
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full"
                  value={createForm.paper}
                  onChange={(e) => setCreateForm((s) => ({ ...s, paper: e.target.value }))}
                  disabled={!createForm.part || !createForm.year}
                >
                  <option value="">{createForm.part && createForm.year ? 'Select paper' : 'Select year/part first'}</option>
                  {createPapers.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Question Type</label>
                <label className="flex items-center gap-2 text-sm select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(createForm.isDirect)}
                    onChange={(e) => setCreateForm((s) => ({ ...s, isDirect: e.target.checked }))}
                  />
                  Direct (no sub-questions)
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm">Question</label>
              <RichEditor value={createForm.questionHtml} onChange={(html) => setCreateForm((s) => ({ ...s, questionHtml: html }))} />
            </div>

            {createForm.isDirect ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Direct Answer (Rich)</div>
                <AnswerBlocksEditor
                  value={createForm.directAnswerBlocks}
                  onChange={(blocks) => setCreateForm((s) => ({ ...s, directAnswerBlocks: blocks }))}
                />
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Main Question Answer (Rich)</div>
                  <AnswerBlocksEditor
                    value={createForm.mainQuestionAnswerBlocks}
                    onChange={(blocks) => setCreateForm((s) => ({ ...s, mainQuestionAnswerBlocks: blocks }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Sub Questions</div>
                  <button type="button" onClick={addCreateSub} className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm">
                    + Add Sub Question
                  </button>
                </div>

                <div className="space-y-4">
                  {(Array.isArray(createForm.subs) ? createForm.subs : []).map((sub, index) => (
                    <div key={sub.sid || index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Sub Question {index + 1}</div>
                        <button
                          type="button"
                          onClick={() => removeCreateSub(sub.sid)}
                          className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className="block text-sm">Sub Part</label>
                          <input
                            className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full"
                            value={sub.part}
                            onChange={(e) => updateCreateSub(sub.sid, { part: e.target.value })}
                            placeholder="a"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm">Sub Question</label>
                        <RichEditor value={sub.textHtml} onChange={(html) => updateCreateSub(sub.sid, { textHtml: html })} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm">Answer</label>
                        <AnswerBlocksEditor
                          value={sub.answerBlocks}
                          onChange={(blocks) => updateCreateSub(sub.sid, { answerBlocks: blocks })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={closeCreateModal} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button disabled={creating} onClick={onCreateSingleQuestion} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                {creating ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete all structured questions for:
            </p>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {deleteConfirm.year} | {String(deleteConfirm.part).toUpperCase()} {deleteConfirm.paper ? `| ${deleteConfirm.paper}` : ""}
            </div>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button disabled={purging} onClick={closeDeleteConfirm} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button
                disabled={purging}
                onClick={confirmDeleteByYearPart}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {purging ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Bulk Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This will permanently delete all structured questions for {bulkConfirm.groups.length} selected group(s).
            </p>
            <div className="max-h-48 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-1">
              {(bulkConfirm.groups || []).map((g) => (
                <div key={groupKeyFromGroup(g)} className="text-gray-900 dark:text-gray-100">
                  {g.year} | {String(g.part).toUpperCase()} {g.paper ? `| ${g.paper}` : ''}
                </div>
              ))}
            </div>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button disabled={purging} onClick={closeBulkConfirm} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button
                disabled={purging}
                onClick={confirmBulkDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {purging ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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





