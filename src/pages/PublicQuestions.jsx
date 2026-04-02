import { useEffect, useMemo, useRef, useState } from 'react'
import { getPublicQuestions, getQuestionYears, getQuestionParts, getQuestionPapers } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function PublicQuestions() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [year, setYear] = useState(localStorage.getItem('pq_year') || '')
  const [part, setPart] = useState(localStorage.getItem('pq_part') || '')
  const [paper, setPaper] = useState(localStorage.getItem('pq_paper') || '')
  const [years, setYears] = useState([])
  const [parts, setParts] = useState([])
  const [papers, setPapers] = useState([])
  const prevYearRef = useRef(year)
  const prevPartRef = useRef(part)
  const didInitYearRef = useRef(false)
  const didInitPartRef = useRef(false)

  const toArray = (x) => Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : Array.isArray(x?.data?.data) ? x.data.data : []
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

  useEffect(() => {
    let mounted = true
    const loadYears = async () => {
      try {
        const res = await getQuestionYears()
        const arr = toArray(res).map(normalizeYear).filter(Boolean)
        if (mounted) {
          setYears(arr)
          if (!year && arr[0]) setYear(String(arr[0]))
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

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const partApi = part ? (parts.find((p) => p.value === part)?.apiValue || partToApi(part)) : ''
        const data = await getPublicQuestions({ year, part: partApi || undefined, paper: paper || undefined })
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
  useEffect(() => {
    localStorage.setItem('pq_paper', paper)
  }, [paper])

  const filtered = useMemo(() => {
    const normPart = part ? partToApi(part).toLowerCase().replace(/\s+/g, '') : ''
    return list.filter((p) => {
      const byYear = year ? String(p.year) === String(year) : true
      const byPart = normPart ? String(p.part || '').toLowerCase().replace(/\s+/g, '') === normPart : true
      const byPaper = paper ? String(p.paper) === String(paper) : true
      return byYear && byPart && byPaper
    })
  }, [list, year, part, paper])

  const renderAnswerList = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null
    if (arr.length === 1) return <div>{arr[0]}</div>
    return (
      <ul className="list-disc ml-5">
        {arr.map((a, idx) => <li key={idx}>{a}</li>)}
      </ul>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Public Questions</h2>
      <div className="flex items-center gap-3 flex-wrap">
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Filter Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" value={part} onChange={(e) => setPart(e.target.value)}>
          <option value="">Filter Part</option>
          {parts.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          value={paper}
          onChange={(e) => setPaper(e.target.value)}
          disabled={!part}
        >
          <option value="">{part ? 'Filter Paper' : 'Select part first'}</option>
          {papers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? <Loader /> : (
        <div className="space-y-4">
          {filtered.map((parent) => (
            <div key={parent.id} className="rounded bg-white dark:bg-gray-800 shadow p-4 space-y-3">
              <div>
                <div className="font-medium">
                  {parent.questionId && <span className="mr-2 text-indigo-700 dark:text-indigo-300">{parent.questionId}.</span>}
                  {parent.question_text}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{parent.year} • {String(parent.part).toUpperCase?.() || parent.part}</div>
              </div>
              {parent.isDirect && (parent.answerType === 'image' ? Boolean(parent.answerImage) : Array.isArray(parent.answer) && parent.answer.length > 0) && (
                <div className="rounded border border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Main Answer | {parent.answerType || 'text'}</div>
                  <div className="mt-2">
                    {parent.answerType === 'text' && renderAnswerList(parent.answer)}
                    {parent.answerType === 'image' && parent.answerImage && (
                      <img src={parent.answerImage} alt="answer" className="mt-2 max-h-40 object-contain" />
                    )}
                  </div>
                </div>
              )}
              {!parent.isDirect && Array.isArray(parent.main_question_answer) && parent.main_question_answer.length > 0 && (
                <div className="rounded border border-gray-200 dark:border-gray-700 p-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Main Question Answer</div>
                  <div className="mt-2">
                    {renderAnswerList(parent.main_question_answer)}
                  </div>
                </div>
              )}
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


