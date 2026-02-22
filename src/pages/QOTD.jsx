import { useEffect, useState } from 'react'
import { getQOTD, setQOTD } from '../services/api.js'

export default function Qotd() {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ text: '', answerType: 'text', answerText: '', answerImage: null })

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

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        text: form.text,
        answerType: form.answerType,
        answerText: form.answerType === 'text' ? form.answerText : undefined,
        answerImage: form.answerType === 'image' ? form.answerImage : undefined
      }
      const saved = await setQOTD(payload)
      setCurrent(saved)
      setForm({ text: '', answerType: 'text', answerText: '', answerImage: null })
    } catch {
      setError('Failed to save QOTD')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Question of the Day</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-3">
          {current && (
            <div className="p-4 rounded bg-white dark:bg-gray-800 shadow">
              <div className="font-medium">{current.text}</div>
              {current.answerType === 'text' && current.answerText && <div className="mt-2 text-sm">{current.answerText}</div>}
              {current.answerType === 'image' && current.answerImageUrl && <img alt="qotd" src={current.answerImageUrl} className="mt-2 max-h-40 object-contain" />}
            </div>
          )}
        </div>
      )}
      <form onSubmit={submit} className="grid md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <input className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 md:col-span-4" placeholder="Question text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={form.answerType} onChange={(e) => setForm({ ...form, answerType: e.target.value })}>
          <option value="text">Answer Text</option>
          <option value="image">Answer Image</option>
        </select>
        {form.answerType === 'text' ? (
          <textarea className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 md:col-span-3" placeholder="Answer text" value={form.answerText} onChange={(e) => setForm({ ...form, answerText: e.target.value })} required />
        ) : (
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, answerImage: e.target.files?.[0] || null })} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 md:col-span-3" required />
        )}
        <div className="md:col-span-4">
          <button className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700">Save QOTD</button>
        </div>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  )
}
