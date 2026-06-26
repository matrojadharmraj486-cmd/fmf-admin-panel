import { useEffect, useState } from 'react'
import { createQuestion, listQuestions, deleteQuestion } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import {
  Box, Card, CardContent, Typography, Button, Alert, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Grid, CircularProgress, FormControl, InputLabel, Select, MenuItem, Paper
} from '@mui/material'
import { Icon } from '@iconify/react'

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h5" fontWeight={600}>Questions</Typography>
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={add}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Question text"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  required
                  label="Question Text"
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={form.year}
                    label="Year"
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  >
                    <MenuItem value=""><em>Year</em></MenuItem>
                    {[
                      '2011','2012','2013','2014','2015',
                      '2016','2017','2018','2019','2020',
                      '2021','2022','2023','2024','2025',
                      '2026',
                      '2027','2028','2029','2030','2031',
                      '2032','2033','2034','2035','2036',
                      '2037','2038','2039','2040','2041'
                    ].map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Part</InputLabel>
                  <Select
                    value={form.part}
                    label="Part"
                    onChange={(e) => setForm({ ...form, part: e.target.value })}
                  >
                    <MenuItem value="part1">Part 1</MenuItem>
                    <MenuItem value="part2">Part 2</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Answer Type</InputLabel>
                  <Select
                    value={form.answerType}
                    label="Answer Type"
                    onChange={(e) => setForm({ ...form, answerType: e.target.value })}
                  >
                    <MenuItem value="text">Answer Text</MenuItem>
                    <MenuItem value="image">Answer Image</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {form.answerType === 'text' ? (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Answer Text"
                    placeholder="Answer text"
                    value={form.answerText}
                    onChange={(e) => setForm({ ...form, answerText: e.target.value })}
                    required
                    multiline
                    minRows={3}
                  />
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Answer Image
                    </Typography>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setForm({ ...form, answerImage: e.target.files?.[0] || null })}
                      required
                      style={{ display: 'block', width: '100%' }}
                    />
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {submitting ? 'Adding...' : 'Add Question'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? <Loader /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {questions.map((q) => (
            <Card key={q._id || q.id}>
              <CardContent>
                <Typography fontWeight={500}>{q.text}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {q.part?.toUpperCase?.() || 'Part'} &bull; {q.year}
                </Typography>
                {q.answerType === 'image' && q.answerImageUrl && (
                  <Box
                    component="img"
                    alt="answer"
                    src={q.answerImageUrl}
                    sx={{ mt: 2, maxHeight: 160, objectFit: 'contain', display: 'block' }}
                  />
                )}
                {q.answerType === 'text' && q.answerText && (
                  <Typography variant="body2" sx={{ mt: 2 }}>{q.answerText}</Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => remove(q._id || q.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  )
}
