import { useEffect, useState } from 'react'
import { getQOTD, setQOTD } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'
import {
  Box, Card, CardContent, Typography, Button, Alert,
  Grid, CircularProgress, FormControl, InputLabel, Select, MenuItem
} from '@mui/material'

export default function Qotd() {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ question: '', answerType: 'text', answerHtml: '', answerImage: null })
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const abs = (url) => {
    if (!url) return ''
    const s = String(url)
    if (s.startsWith('http') || s.startsWith('//') || s.startsWith('data:') || s.startsWith('blob:')) return s
    const base = String(baseUrl).replace(/\/+$/, '')
    const path = s.startsWith('/') ? s : `/${s}`
    return `${base}${path}`
  }

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h5" fontWeight={600}>Question of the Day</Typography>
      </Box>

      {loading ? <Loader /> : (
        <>
          {current && (
            <Card>
              <CardContent>
                <Typography
                  fontWeight={500}
                  dangerouslySetInnerHTML={{ __html: current.question || '' }}
                />
                {current.answerType === 'text' && current.answer && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 2 }}
                    dangerouslySetInnerHTML={{ __html: current.answer }}
                  />
                )}
                {current.answerType === 'image' && (current.answerImage || current.answerImageUrl) && (
                  <Box
                    component="img"
                    alt="qotd"
                    src={abs(current.answerImage || current.answerImageUrl)}
                    sx={{ mt: 2, maxHeight: 160, objectFit: 'contain', display: 'block' }}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Question</Typography>
                <RichEditor value={form.question} onChange={(html) => setForm((s) => ({ ...s, question: html }))} />
              </Grid>

              <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={9}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Answer</Typography>
                  <RichEditor value={form.answerHtml} onChange={(html) => setForm((s) => ({ ...s, answerHtml: html }))} />
                </Grid>
              ) : (
                <Grid item xs={12} md={9}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Answer Image</Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, answerImage: e.target.files?.[0] || null })}
                    required
                    style={{ display: 'block', width: '100%' }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {submitting ? 'Saving...' : 'Save QOTD'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  )
}
