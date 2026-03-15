import { useEffect, useState } from 'react'
import {
  uploadStructuredQuestions,
  createStructuredQuestion,
  getStructuredQuestions,
  uploadEditorImage
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { useNavigate } from 'react-router-dom'
import { RichEditor } from '../shared/RichEditor.jsx'
import sampleStructuredFile from '../assets/files/questions-structured-hybrid-18.xlsx'

export default function StructuredAdmin() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [file, setFile] = useState(null)
  const [year, setYear] = useState(localStorage.getItem('sq_year') || '')
  const [part, setPart] = useState(localStorage.getItem('sq_part') || '')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    year: localStorage.getItem('sq_year') || '',
    part: localStorage.getItem('sq_part') || 'part1',
    questionHtml: '',
    subPart: 'a',
    subQuestionHtml: '',
    answerType: 'text',
    answerHtml: '',
    answerImageUrl: ''
  })
  const toArray = (x) => Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : Array.isArray(x?.data?.data) ? x.data.data : []
  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || ''
  const canonicalPart = (val) => {
    const s = String(val || '').toLowerCase().replace(/\s+/g, '')
    if (s.includes('part2') || s === '2' || /2$/.test(s)) return 'part2'
    return 'part1'
  }
  const abs = (url) => (url && !String(url).startsWith('http') && baseUrl) ? `${baseUrl}${url}` : url
  const normalize = (p) => ({
    id: p?.id || p?._id || String(p?.id || p?._id || ''),
    year: String(p?.year ?? ''),
    part: canonicalPart(p?.part),
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
        if (!year && arr[0]?.year) setYear(String(arr[0].year))
        if (!part && arr[0]?.part) setPart(arr[0].part)
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
    localStorage.setItem('sq_year', year)
  }, [year])
  useEffect(() => {
    localStorage.setItem('sq_part', part)
  }, [part])

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
    try {
      setUploading(true)
      await uploadStructuredQuestions({ file, year, part })
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
      year: year || localStorage.getItem('sq_year') || '',
      part: part || localStorage.getItem('sq_part') || 'part1',
      questionHtml: '',
      subPart: 'a',
      subQuestionHtml: '',
      answerType: 'text',
      answerHtml: '',
      answerImageUrl: ''
    })
    setCreateOpen(true)
  }

  const closeCreateModal = () => setCreateOpen(false)

  const uploadImageForCreate = async (file) => {
    if (!file) return
    setError('')
    setOk('')
    try {
      const res = await uploadEditorImage(file)
      const url = res?.url || res?.imageUrl || res?.absoluteUrl
      if (url) setCreateForm((prev) => ({ ...prev, answerImageUrl: url }))
    } catch (err) {
      setError(err?.response?.data?.message || 'Image upload failed')
    }
  }

  const onCreateSingleQuestion = async () => {
    setError('')
    setOk('')
    if (!createForm.year) {
      setError('Please select year')
      return
    }
    if (!createForm.questionHtml.trim()) {
      setError('Please enter question')
      return
    }
    if (!createForm.subQuestionHtml.trim()) {
      setError('Please enter sub question')
      return
    }
    if (createForm.answerType === 'text' && !createForm.answerHtml.trim()) {
      setError('Please enter answer')
      return
    }
    if (createForm.answerType === 'image' && !createForm.answerImageUrl.trim()) {
      setError('Please add answer image URL or upload image')
      return
    }
    const payload = {
      year: Number(createForm.year),
      part: createForm.part === 'part2' ? 'Part 2' : 'Part 1',
      question_text: createForm.questionHtml,
      sub_questions: [{
        part: createForm.subPart || 'a',
        text: createForm.subQuestionHtml,
        answerType: createForm.answerType,
        answer: createForm.answerType === 'text' ? htmlToArray(createForm.answerHtml) : [],
        answerImage: createForm.answerType === 'image' ? createForm.answerImageUrl : ''
      }]
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Structured Questions</h2>
        <button onClick={openCreateModal} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Add Question
        </button>
      </div>
      <form onSubmit={onUpload} className="grid md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" />
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Year (optional)</option>
          {['2027','2026','2025','2024','2023','2022'].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={part} onChange={(e) => setPart(e.target.value)}>
          <option value="">Part (optional)</option>
          <option value="part1">Part 1</option>
          <option value="part2">Part 2</option>
        </select>
        <button disabled={uploading} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Sample file: <a href={sampleStructuredFile} download className="text-blue-600 hover:underline">Download .xlsx template</a>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
      {loading ? <Loader /> : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.values(groupByYearPart(list)).map((g) => (
              <div key={`${g.year}-${g.part}`} className="rounded bg-white dark:bg-gray-800 shadow p-4 cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/structured-questions/${g.year}/${g.part}`)}>
                <div className="font-semibold">{g.year} • {String(g.part).toUpperCase()}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{g.countParents} parent • {g.countSubs} sub</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-5xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="font-semibold text-lg">Add Structured Question</div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="block text-sm">Year</label>
                <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full" value={createForm.year} onChange={(e) => setCreateForm((s) => ({ ...s, year: e.target.value }))}>
                  <option value="">Select year</option>
                  {['2027','2026','2025','2024','2023','2022'].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Part</label>
                <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full" value={createForm.part} onChange={(e) => setCreateForm((s) => ({ ...s, part: e.target.value }))}>
                  <option value="part1">Part 1</option>
                  <option value="part2">Part 2</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Sub Part</label>
                <input
                  className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full"
                  value={createForm.subPart}
                  onChange={(e) => setCreateForm((s) => ({ ...s, subPart: e.target.value }))}
                  placeholder="a"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm">Question</label>
              <RichEditor value={createForm.questionHtml} onChange={(html) => setCreateForm((s) => ({ ...s, questionHtml: html }))} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm">Sub Question</label>
              <RichEditor value={createForm.subQuestionHtml} onChange={(html) => setCreateForm((s) => ({ ...s, subQuestionHtml: html }))} />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="block text-sm">Answer Type</label>
                <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full" value={createForm.answerType} onChange={(e) => setCreateForm((s) => ({ ...s, answerType: e.target.value }))}>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                </select>
              </div>
              {createForm.answerType === 'text' ? (
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm">Answer</label>
                  <RichEditor value={createForm.answerHtml} onChange={(html) => setCreateForm((s) => ({ ...s, answerHtml: html }))} />
                </div>
              ) : (
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm">Answer Image</label>
                  <input
                    className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full"
                    value={createForm.answerImageUrl}
                    onChange={(e) => setCreateForm((s) => ({ ...s, answerImageUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 w-full"
                    onChange={(e) => uploadImageForCreate(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={closeCreateModal} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button disabled={creating} onClick={onCreateSingleQuestion} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                {creating ? 'Adding...' : 'Add Question'}
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
    const key = `${p.year}-${p.part}`
    if (!map[key]) map[key] = { year: p.year, part: p.part, countParents: 0, countSubs: 0 }
    map[key].countParents += 1
    map[key].countSubs += (Array.isArray(p.sub_questions) ? p.sub_questions.length : 0)
  }
  return map
}
