import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getStructuredQuestionsFiltered,
  updateStructuredParent,
  updateStructuredSub,
  deleteStructuredParent,
  deleteStructuredSub,
  uploadStructuredSubImage
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'

export default function StructuredDetail() {
  const { year, part } = useParams()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [editParentState, setEditParentState] = useState({ id: null, html: '' })
  const [editSubState, setEditSubState] = useState({ pid: null, sid: null, html: '' })

  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || ''
  const abs = (url) => (url && !String(url).startsWith('http') && baseUrl) ? `${baseUrl}${url}` : url
  const norm = (p) => ({
    id: p?.id || p?._id || String(p?.id || p?._id || ''),
    dbid: p?._id || '',
    year: String(p?.year ?? ''),
    part: String(p?.part ?? '').toLowerCase().includes('2') ? 'part2' : 'part1',
    question_text: p?.question_text || p?.questionText || p?.title || '',
    sub_questions: (Array.isArray(p?.sub_questions) ? p.sub_questions : []).map((s) => ({
      id: s?.id || s?._id || String(s?.id || s?._id || ''),
      part: String(s?.part ?? ''),
      text: s?.text || s?.title || '',
      answerType: s?.answerType || (s?.answerImage ? 'image' : 'text'),
      answer: Array.isArray(s?.answer) ? s.answer : [],
      answerImage: abs(s?.answerImage || '')
    }))
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await getStructuredQuestionsFiltered(year, part)
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
        const arr = data.map(norm)
        if (mounted) setList(arr)
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
    setError(''); setOk('')
    try {
      const saved = await updateStructuredParent(id, payload)
      setList((prev) => prev.map((p) => (p.id === id ? { ...p, ...payload } : p)))
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
        const subs = (p.sub_questions || []).map((s) => s.id === subId ? { ...s, ...payload } : s)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Structured • {year} • {String(part).toUpperCase()}</h2>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
      {loading ? <Loader /> : (
        <div className="space-y-4">
          {list.map((parent, pIdx) => (
            <div key={parent.dbid || `${parent.id}-${pIdx}`} className="rounded bg-white dark:bg-gray-800 shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium" dangerouslySetInnerHTML={{ __html: parent.question_text }} />
                  <div className="text-sm text-gray-500 dark:text-gray-400">{parent.year} • {String(parent.part).toUpperCase()}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => setEditParentState({ id: parent.id, html: parent.question_text })} className="px-3 py-1 rounded bg-indigo-600 text-white">Edit</button>
                  <button onClick={() => removeParent(parent.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
              <div className="space-y-2">
                {(parent.sub_questions || []).map((sub, sIdx) => (
                  <div key={`${sub.id}-${sIdx}`} className="rounded border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium" dangerouslySetInnerHTML={{ __html: sub.text }} />
                        <div className="text-sm text-gray-500 dark:text-gray-400">{String(sub.part).toUpperCase()} • {sub.answerType}</div>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => setEditSubState({ pid: parent.id, sid: sub.id, html: sub.text })}
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
      {editParentState.id && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow w-full max-w-xl p-4 space-y-3">
            <div className="font-medium">Edit Question</div>
            <RichEditor value={editParentState.html} onChange={(html) => setEditParentState((s) => ({ ...s, html }))} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditParentState({ id: null, html: '' })} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button onClick={async () => { await editParent(editParentState.id, { question_text: editParentState.html }); setEditParentState({ id: null, html: '' }) }} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
      {editSubState.sid && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded shadow w-full max-w-xl p-4 space-y-3">
            <div className="font-medium">Edit Sub-question</div>
            <RichEditor value={editSubState.html} onChange={(html) => setEditSubState((s) => ({ ...s, html }))} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditSubState({ pid: null, sid: null, html: '' })} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button onClick={async () => { await editSub(editSubState.pid, editSubState.sid, { text: editSubState.html }); setEditSubState({ pid: null, sid: null, html: '' }) }} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
