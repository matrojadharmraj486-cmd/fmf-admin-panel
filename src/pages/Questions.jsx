import { useEffect, useState } from 'react'
import { createQuestion, listQuestions, deleteQuestion } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    text: '',
    year: '',
    part: 'part1',
    subject: '',
    answerType: 'text',
    answerText: '',
    answerImage: null
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await listQuestions()
        if (mounted) setQuestions(data)
      } catch {
        // optional: ignore for now if backend not ready
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const add = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        text: form.text,
        year: form.year,
        part: form.part,
        answerType: form.answerType,
        answerText: form.answerType === 'text' ? form.answerText : undefined,
        answerImage: form.answerType === 'image' ? form.answerImage : undefined
      }
      const created = await createQuestion(payload)
      const item = Array.isArray(created) ? created[0] : created
      setQuestions((prev) => [item, ...prev])
      setForm({ text: '', year: '', part: 'part1', subject: '', answerType: 'text', answerText: '', answerImage: null })
    } catch {
      setError('Failed to add question')
    } finally {
      setSubmitting(false)
    }
  }
  const remove = async (_id) => {
    try {
      await deleteQuestion(_id)
      setQuestions((q) => q.filter((x) => (x._id || x.id) !== _id))
    } catch {
      setError('Failed to delete question')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Questions</h2>

      <form onSubmit={add} className="grid md:grid-cols-6 gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <input className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 md:col-span-3" placeholder="Question text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required>
          <option value="">Year</option>
          {['2027','2026','2025','2024','2023','2022'].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={form.part} onChange={(e) => setForm({ ...form, part: e.target.value })}>
          <option value="part1">Part 1</option>
          <option value="part2">Part 2</option>
        </select>
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={form.answerType} onChange={(e) => setForm({ ...form, answerType: e.target.value })}>
          <option value="text">Answer Text</option>
          <option value="image">Answer Image</option>
        </select>
        {form.answerType === 'text' ? (
          <textarea className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 md:col-span-6" placeholder="Answer text" value={form.answerText} onChange={(e) => setForm({ ...form, answerText: e.target.value })} required />
        ) : (
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, answerImage: e.target.files?.[0] || null })} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 md:col-span-3" required />
        )}
        <div className="md:col-span-6">
          <button disabled={submitting} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
            {submitting ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? <Loader /> : (
        <div className="grid gap-3">
          {questions.map((q) => (
            <div key={q._id || q.id} className="p-4 rounded bg-white dark:bg-gray-800 shadow">
              <div className="font-medium">{q.text}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{q.part?.toUpperCase?.() || 'Part'} • {q.year}</div>
              {q.answerType === 'image' && q.answerImageUrl && (
                <img alt="answer" src={q.answerImageUrl} className="mt-2 max-h-40 object-contain" />
              )}
              {q.answerType === 'text' && q.answerText && (
                <div className="mt-2 text-sm">{q.answerText}</div>
              )}
              <div className="mt-2">
                <button onClick={() => remove(q._id || q.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
