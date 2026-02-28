import { useEffect, useMemo, useState } from 'react'
import {
  uploadStructuredQuestions,
  getStructuredQuestions,
  updateStructuredParent,
  updateStructuredSub,
  deleteStructuredParent,
  deleteStructuredSub,
  uploadStructuredSubImage
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function StructuredAdmin() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [file, setFile] = useState(null)
  const [year, setYear] = useState(localStorage.getItem('sq_year') || '')
  const [part, setPart] = useState(localStorage.getItem('sq_part') || '')
  const [bulkEdit, setBulkEdit] = useState({ id: null, text: '' })
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

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const byYear = year ? String(p.year) === String(year) : true
      const byPart = part ? String(p.part).toLowerCase() === String(part).toLowerCase() : true
      return byYear && byPart
    })
  }, [list, year, part])

  const [uploading, setUploading] = useState(false)
  const onUpload = async (e) => {
    e.preventDefault()
    setError(''); setOk('')
    if (!file) { setError('Select .xlsx file'); return }
    try {
      setUploading(true)
      const res = await uploadStructuredQuestions({ file, year, part })
      setOk('Uploaded')
      const data = await getStructuredQuestions()
      setList(data || [])
      setFile(null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const editParent = async (id, payload) => {
    setError(''); setOk('')
    try {
      const saved = await updateStructuredParent(id, payload)
      setList((prev) => prev.map((p) => (p.id === id ? saved : p)))
      setOk('Saved')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }
  const editSub = async (id, subId, payload) => {
    setError(''); setOk('')
    try {
      const saved = await updateStructuredSub(id, subId, payload)
      setList((prev) => prev.map((p) => {
        if (p.id !== id) return p
        const subs = (p.sub_questions || []).map((s) => s.id === subId ? saved : s)
        return { ...p, sub_questions: subs }
      }))
      setOk('Saved')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }
  const removeParent = async (id) => {
    setError(''); setOk('')
    try {
      await deleteStructuredParent(id)
      setList((prev) => prev.filter((p) => p.id !== id))
      setOk('Deleted')
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }
  const removeSub = async (id, subId) => {
    setError(''); setOk('')
    try {
      await deleteStructuredSub(id, subId)
      setList((prev) => prev.map((p) => {
        if (p.id !== id) return p
        const subs = (p.sub_questions || []).filter((s) => s.id !== subId)
        return { ...p, sub_questions: subs }
      }))
      setOk('Deleted')
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }

  const onUploadSubImage = async (id, subId, file) => {
    setError(''); setOk('')
    if (!file) return
    try {
      const res = await uploadStructuredSubImage(id, subId, file)
      const url = res?.url || res?.imageUrl || res?.absoluteUrl
      if (url) await editSub(id, subId, { answerType: 'image', answerImage: url })
    } catch (err) {
      setError(err?.response?.data?.message || 'Image upload failed')
    }
  }

  const startBulkEdit = (parent) => {
    const text = JSON.stringify(parent?.sub_questions || [], null, 2)
    setBulkEdit({ id: parent.id, text })
  }
  const saveBulkEdit = async () => {
    try {
      const arr = JSON.parse(bulkEdit.text)
      await editParent(bulkEdit.id, { sub_questions: arr })
      setBulkEdit({ id: null, text: '' })
    } catch (err) {
      setError('Invalid JSON or save failed')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Structured Questions</h2>
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
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
      {loading ? <Loader /> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Filter Year</option>
              {['2027','2026','2025','2024','2023','2022'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={part} onChange={(e) => setPart(e.target.value)}>
              <option value="">Filter Part</option>
              <option value="part1">Part 1</option>
              <option value="part2">Part 2</option>
            </select>
          </div>
          {(!year || !part) && (
            <div className="rounded bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4">
              Select Year and Part to view structured questions.
            </div>
          )}
          {year && part && filtered.map((parent) => (
            <div key={parent.id} className="rounded bg-white dark:bg-gray-800 shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{parent.question_text}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{parent.year} • {String(parent.part).toUpperCase?.() || parent.part}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => editParent(parent.id, { question_text: prompt('Question text', parent.question_text) || parent.question_text })} className="px-3 py-1 rounded bg-indigo-600 text-white">Edit</button>
                  <button onClick={() => startBulkEdit(parent)} className="px-3 py-1 rounded bg-purple-600 text-white">Bulk Edit Subs</button>
                  <button onClick={() => removeParent(parent.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
              <div className="space-y-2">
                {(parent.sub_questions || []).map((sub) => (
                  <div key={sub.id} className="rounded border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{sub.text}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{String(sub.part).toUpperCase?.() || sub.part} • {sub.answerType}</div>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            const val = prompt('Text', sub.text) || sub.text
                            editSub(parent.id, sub.id, { text: val })
                          }}
                          className="px-3 py-1 rounded bg-indigo-600 text-white"
                        >
                          Edit
                        </button>
                        <button onClick={() => removeSub(parent.id, sub.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                      </div>
                    </div>
                    <div className="mt-2">
                      {sub.answerType === 'text' && Array.isArray(sub.answer) && (
                        <ul className="list-disc ml-5">
                          {sub.answer.map((a, idx) => <li key={idx}>{a}</li>)}
                        </ul>
                      )}
                      {sub.answerType === 'image' && sub.answerImage && (
                        <img src={sub.answerImage} alt="answer" className="mt-2 max-h-40 object-contain rounded border border-gray-200 dark:border-gray-700" />
                      )}
                    </div>
                    <div className="mt-3 grid md:grid-cols-3 gap-2">
                      <select
                        value={sub.answerType}
                        onChange={(e) => editSub(parent.id, sub.id, { answerType: e.target.value })}
                        className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                      >
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                      </select>
                      {sub.answerType === 'text' ? (
                        <input
                          placeholder="Answers (; separated)"
                          defaultValue={Array.isArray(sub.answer) ? sub.answer.join('; ') : ''}
                          onBlur={(e) => {
                            const arr = e.target.value.split(';').map((x) => x.trim()).filter(Boolean)
                            editSub(parent.id, sub.id, { answer: arr })
                          }}
                          className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            placeholder="Image URL"
                            defaultValue={sub.answerImage || ''}
                            onBlur={(e) => editSub(parent.id, sub.id, { answerImage: e.target.value })}
                            className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 flex-1"
                          />
                          <input type="file" accept="image/*" onChange={(e) => onUploadSubImage(parent.id, sub.id, e.target.files?.[0] || null)} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {bulkEdit.id && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow w-full max-w-2xl p-4 space-y-3">
            <div className="font-medium">Bulk Edit Sub Questions JSON</div>
            <textarea
              value={bulkEdit.text}
              onChange={(e) => setBulkEdit({ ...bulkEdit, text: e.target.value })}
              className="w-full h-64 rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkEdit({ id: null, text: '' })} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button onClick={saveBulkEdit} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
