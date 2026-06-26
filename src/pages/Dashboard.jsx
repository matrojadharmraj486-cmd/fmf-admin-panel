import { useEffect, useState } from 'react'
import { getDashboardStats, getDashboardTimeseries } from '../services/api.js'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import {
  Box, Card, CardContent, Grid, Typography, Button,
  Alert, CircularProgress, Avatar, alpha, useTheme, Chip
} from '@mui/material'
import { Icon } from '@iconify/react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const STAT_CARDS = [
  { key: 'users', label: 'Total Users', icon: 'mdi:account-multiple-outline', color: '#666CFF' },
  { key: 'questions', label: 'Questions', icon: 'mdi:help-circle-outline', color: '#26C6F9' },
  { key: 'papers', label: 'Papers', icon: 'mdi:file-document-multiple-outline', color: '#72E128' },
  { key: 'bookmarks', label: 'Bookmarks', icon: 'mdi:bookmark-multiple-outline', color: '#FDB528' },
]

export default function Dashboard() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const pollMs = Number(import.meta?.env?.VITE_DASHBOARD_POLL_MS || 30000)
  const months = Number(import.meta?.env?.VITE_DASHBOARD_MONTHS || 12)
  const [stats, setStats] = useState(null)
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  const normalizeStats = (raw) => {
    const s = raw?.stats || raw?.data || raw || {}
    const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
    return {
      users: toNumber(s.users ?? s.totalUsers ?? s.userCount),
      questions: toNumber(s.questions ?? s.totalQuestions ?? s.questionCount),
      papers: toNumber(s.papers ?? s.totalPapers ?? s.paperCount),
      bookmarks: toNumber(s.bookmarks ?? s.totalBookmarks ?? s.bookmarkCount)
    }
  }

  const normalizeTimeseries = (raw) => {
    const arr = raw?.points || raw?.data?.points || raw?.data || []
    if (!Array.isArray(arr)) return []
    const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
    const mapped = arr
      .map((p) => ({
        month: String(p?.month || p?.date || '').slice(0, 7),
        users: toNumber(p?.users),
        questions: toNumber(p?.questions),
        papers: toNumber(p?.papers),
        bookmarks: toNumber(p?.bookmarks)
      }))
      .filter((p) => p.month && /^\d{4}-\d{2}$/.test(p.month))

    const byMonth = new Map()
    for (const p of mapped) {
      const cur = byMonth.get(p.month) || { month: p.month, users: 0, questions: 0, papers: 0, bookmarks: 0 }
      cur.users += p.users
      cur.questions += p.questions
      cur.papers += p.papers
      cur.bookmarks += p.bookmarks
      byMonth.set(p.month, cur)
    }

    return Array.from(byMonth.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-Math.max(1, Number.isFinite(months) ? months : 12))
  }

  const formatMonth = (yyyyMm) => {
    try {
      const dt = new Date(`${yyyyMm}-01T00:00:00Z`)
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dt)
    } catch {
      return yyyyMm
    }
  }

  const fetchData = async ({ isInitial } = {}) => {
    try {
      if (isInitial) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const [statsRes, seriesRes] = await Promise.allSettled([
        getDashboardStats(),
        getDashboardTimeseries({ granularity: 'month', months })
      ])

      const raw = statsRes.status === 'fulfilled' ? statsRes.value : null
      const seriesRaw = seriesRes.status === 'fulfilled' ? seriesRes.value : null

      setStats(normalizeStats(raw))
      setPoints(normalizeTimeseries(seriesRaw))
      setLastUpdatedAt(new Date())
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async ({ isInitial } = { isInitial: false }) => {
      if (!mounted) return
      await fetchData({ isInitial })
    }
    load({ isInitial: true })
    const interval = setInterval(() => load({ isInitial: false }), pollMs)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pollMs, months])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" mb={1}>Dashboard</Typography>
          <Alert severity="error" sx={{ mb: 2 }}>{error || 'No data'}</Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const chartData = points?.length
    ? {
        labels: points.map((p) => formatMonth(p.month)),
        datasets: [
          { label: 'Users', backgroundColor: '#666CFF', data: points.map((p) => p.users) },
          { label: 'Questions', backgroundColor: '#26C6F9', data: points.map((p) => p.questions) },
          { label: 'Papers', backgroundColor: '#72E128', data: points.map((p) => p.papers) },
          { label: 'Bookmarks', backgroundColor: '#FDB528', data: points.map((p) => p.bookmarks) }
        ]
      }
    : {
        labels: ['Users', 'Questions', 'Papers', 'Bookmarks'],
        datasets: [{
          label: 'Totals',
          backgroundColor: ['#666CFF', '#26C6F9', '#72E128', '#FDB528'],
          data: [stats.users, stats.questions, stats.papers, stats.bookmarks]
        }]
      }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleTimeString()}` : 'Loading...'}
            {refreshing && ' · Refreshing...'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={refreshing ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:refresh" />}
          onClick={() => fetchData({ isInitial: false })}
          disabled={refreshing}
          sx={{ minWidth: 120 }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 4 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Stat Cards */}
      <Grid container spacing={6} sx={{ mb: 6 }}>
        {STAT_CARDS.map(({ key, label, icon, color }) => (
          <Grid item xs={12} sm={6} lg={3} key={key}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {label}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {stats[key]?.toLocaleString?.() ?? stats[key]}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: alpha(color, 0.12),
                      color: color,
                    }}
                  >
                    <Icon icon={icon} fontSize={22} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {points?.length ? `Monthly Overview` : 'Overview'}
              </Typography>
              {points?.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Last {months} months
                </Typography>
              )}
            </Box>
            <Chip label="Bar Chart" size="small" color="primary" variant="tonal" />
          </Box>
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: isDark ? 'rgba(231,227,252,0.68)' : 'rgba(47,51,73,0.68)',
                    padding: 16,
                    font: { family: 'Inter', size: 12 },
                  },
                },
              },
              scales: {
                x: {
                  stacked: points?.length > 0,
                  ticks: { color: isDark ? 'rgba(231,227,252,0.5)' : 'rgba(47,51,73,0.5)', font: { family: 'Inter', size: 11 } },
                  grid: { color: isDark ? 'rgba(231,227,252,0.05)' : 'rgba(47,51,73,0.05)' },
                },
                y: {
                  stacked: points?.length > 0,
                  beginAtZero: true,
                  ticks: { color: isDark ? 'rgba(231,227,252,0.5)' : 'rgba(47,51,73,0.5)', font: { family: 'Inter', size: 11 } },
                  grid: { color: isDark ? 'rgba(231,227,252,0.05)' : 'rgba(47,51,73,0.05)' },
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
