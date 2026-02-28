import { useEffect, useMemo, useState } from 'react'
import { getPublicQuestions } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function PublicQuestions() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [year, setYear] = useState(localStorage.getItem('pq_year') || '')
  const [part, setPart] = useState(localStorage.getItem('pq_part') || '')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await getPublicQuestions({ year, part })
        if (mounted) setList(data || [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [year, part])

  useEffect(() => {
    localStorage.setItem('pq_year', year)
  }, [year])
  useEffect(() => {
    localStorage.setItem('pq_part', part)
  }, [part])

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const byYear = year ? String(p.year) === String(year) : true
      const byPart = part ? String(p.part).toLowerCase() === String(part).toLowerCase() : true
      return byYear && byPart
    })
  }, [list, year, part])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Public Questions</h2>
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
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? <Loader /> : (
        <div className="space-y-4">
          {filtered.map((parent) => (
            <div key={parent.id} className="rounded bg-white dark:bg-gray-800 shadow p-4 space-y-3">
              <div>
                <div className="font-medium">{parent.question_text}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{parent.year} • {String(parent.part).toUpperCase?.() || parent.part}</div>
              </div>
              <div className="space-y-2">
                {(parent.sub_questions || []).map((sub) => (
                  <div key={sub.id} className="rounded border border-gray-200 dark:border-gray-700 p-3">
                    <div className="font-medium">{sub.text}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{String(sub.part).toUpperCase?.() || sub.part} • {sub.answerType}</div>
                    <div className="mt-2">
                      {sub.answerType === 'text' && Array.isArray(sub.answer) && (
                        <ul className="list-disc ml-5">
                          {sub.answer.map((a, idx) => <li key={idx}>{a}</li>)}
                        </ul>
                      )}
                      {sub.answerType === 'image' && sub.answerImage && (
                        <img src={sub.answerImage} alt="answer" className="mt-2 max-h-40 object-contain" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
