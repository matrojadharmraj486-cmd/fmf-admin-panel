import { useEffect, useMemo, useRef, useState } from 'react'
import { getPublicQuestions, getQuestionYears, getQuestionParts, getQuestionPapers } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import {
  Box, Card, CardContent, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, Paper
} from '@mui/material'

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
    if (arr.length === 1) return <Typography variant="body2">{arr[0]}</Typography>
    return (
      <Box component="ul" sx={{ pl: 3, mt: 0, mb: 0 }}>
        {arr.map((a, idx) => (
          <Typography component="li" variant="body2" key={idx}>{a}</Typography>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h5" fontWeight={600}>Public Questions</Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Filter Year</InputLabel>
          <Select
            value={year}
            label="Filter Year"
            onChange={(e) => setYear(e.target.value)}
          >
            <MenuItem value=""><em>Filter Year</em></MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Filter Part</InputLabel>
          <Select
            value={part}
            label="Filter Part"
            onChange={(e) => setPart(e.target.value)}
          >
            <MenuItem value=""><em>Filter Part</em></MenuItem>
            {parts.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }} disabled={!part}>
          <InputLabel>{part ? 'Filter Paper' : 'Select part first'}</InputLabel>
          <Select
            value={paper}
            label={part ? 'Filter Paper' : 'Select part first'}
            onChange={(e) => setPaper(e.target.value)}
          >
            <MenuItem value=""><em>{part ? 'Filter Paper' : 'Select part first'}</em></MenuItem>
            {papers.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? <Loader /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((parent) => (
            <Card key={parent.id}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography fontWeight={500}>
                    {parent.questionId && (
                      <Typography component="span" color="primary" sx={{ mr: 1 }}>
                        {parent.questionId}.
                      </Typography>
                    )}
                    {parent.question_text}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {parent.year} &bull; {String(parent.part).toUpperCase?.() || parent.part}
                  </Typography>
                </Box>

                {parent.isDirect && (parent.answerType === 'image' ? Boolean(parent.answerImage) : Array.isArray(parent.answer) && parent.answer.length > 0) && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Main Answer | {parent.answerType || 'text'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {parent.answerType === 'text' && renderAnswerList(parent.answer)}
                      {parent.answerType === 'image' && parent.answerImage && (
                        <Box
                          component="img"
                          src={parent.answerImage}
                          alt="answer"
                          sx={{ mt: 1, maxHeight: 160, objectFit: 'contain', display: 'block' }}
                        />
                      )}
                    </Box>
                  </Paper>
                )}

                {!parent.isDirect && Array.isArray(parent.main_question_answer) && parent.main_question_answer.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">Main Question Answer</Typography>
                    <Box sx={{ mt: 1 }}>
                      {renderAnswerList(parent.main_question_answer)}
                    </Box>
                  </Paper>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(parent.sub_questions || []).map((sub) => (
                    <Paper key={sub.id} variant="outlined" sx={{ p: 2 }}>
                      <Typography fontWeight={500}>{sub.text}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {String(sub.part).toUpperCase?.() || sub.part} &bull; {sub.answerType}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {sub.answerType === 'text' && Array.isArray(sub.answer) && (
                          <Box component="ul" sx={{ pl: 3, mt: 0, mb: 0 }}>
                            {sub.answer.map((a, idx) => (
                              <Typography component="li" variant="body2" key={idx}>{a}</Typography>
                            ))}
                          </Box>
                        )}
                        {sub.answerType === 'image' && sub.answerImage && (
                          <Box
                            component="img"
                            src={sub.answerImage}
                            alt="answer"
                            sx={{ mt: 1, maxHeight: 160, objectFit: 'contain', display: 'block' }}
                          />
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
