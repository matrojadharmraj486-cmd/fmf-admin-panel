import { useEffect, useState } from 'react'
import { getQOTD, setQOTD } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'

export default function Qotd() {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ question: '', answerType: 'text', answerHtml: '', answerImage: null })
  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || ''
  const abs = (url) => (url && !String(url).startsWith('http') && baseUrl) ? `${baseUrl}${url}` : url

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await getQOTD()
        if (mounted) setCurrent(data)
      } catch {
        // ignore if backend not ready
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setSubmitting(true)
      const payload = {
        question: form.question,
        answerType: form.answerType,
        answer: form.answerType === 'text' ? form.answerHtml : undefined,
        answerImage: form.answerType === 'image' ? form.answerImage : undefined
      }
      const saved = await setQOTD(payload)
      setCurrent(saved)
      setForm({ question: '', answerType: 'text', answerHtml: '', answerImage: null })
    } catch {
      setError('Failed to save QOTD')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Question of the Day</h2>
      {loading ? <Loader /> : (
        <div className="space-y-3">
          {current && (
            <div className="p-4 rounded bg-white dark:bg-gray-800 shadow">
              <div className="font-medium" dangerouslySetInnerHTML={{ __html: current.question || '' }} />
              {current.answerType === 'text' && current.answer && <div className="mt-2 text-sm" dangerouslySetInnerHTML={{ __html: current.answer }} />}
              {current.answerType === 'image' && (current.answerImage || current.answerImageUrl) && <img alt="qotd" src={abs(current.answerImage || current.answerImageUrl)} className="mt-2 max-h-40 object-contain" />}
            </div>
          )}
        </div>
      )}
      <form onSubmit={submit} className="grid md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <div className="md:col-span-4 space-y-2">
          <label className="block text-sm">Question</label>
          <RichEditor value={form.question} onChange={(html) => setForm((s) => ({ ...s, question: html }))} />
        </div>
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={form.answerType} onChange={(e) => setForm({ ...form, answerType: e.target.value })}>
          <option value="text">Answer Text</option>
          <option value="image">Answer Image</option>
        </select>
        {form.answerType === 'text' ? (
          <div className="md:col-span-3 space-y-2">
            <label className="block text-sm">Answer</label>
            <RichEditor value={form.answerHtml} onChange={(html) => setForm((s) => ({ ...s, answerHtml: html }))} />
          </div>
        ) : (
          <div className="md:col-span-3 space-y-2">
            <label className="block text-sm">Answer Image</label>
            <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, answerImage: e.target.files?.[0] || null })} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" required />
          </div>
        )}
        <div className="md:col-span-4">
          <button disabled={submitting} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save QOTD'}
          </button>
        </div>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  )
}
