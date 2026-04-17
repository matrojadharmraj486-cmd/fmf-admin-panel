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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Dashboard() {
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

  useEffect(() => {
    let mounted = true

    const load = async ({ isInitial } = { isInitial: false }) => {
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

        const normalized = normalizeStats(raw)
        const normalizedSeries = normalizeTimeseries(seriesRaw)
        if (mounted) {
          setStats(normalized)
          setPoints(normalizedSeries)
          setLastUpdatedAt(new Date())
        }
      } catch (e) {
        if (mounted) {
          setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard stats')
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    load({ isInitial: true })
    const interval = setInterval(() => load({ isInitial: false }), pollMs)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pollMs, months])

  if (loading) return <div>Loading...</div>

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-lg font-medium mb-2">Dashboard</div>
        <div className="text-sm text-red-600 dark:text-red-400">{error || 'No data'}</div>
        <button
          className="mt-3 px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  const data = {
    labels: ['Users', 'Questions', 'Papers', 'Bookmarks'],
    datasets: [
      {
        label: 'Totals',
        backgroundColor: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b'],
        data: [stats.users, stats.questions, stats.papers, stats.bookmarks]
      }
    ]
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleString()}` : 'Not updated yet'}
          {refreshing ? ' (refreshing...)' : ''}
        </div>
        <button
          className="px-3 py-2 rounded bg-gray-900 text-white text-sm hover:bg-black disabled:opacity-60 dark:bg-gray-700 dark:hover:bg-gray-600"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true)
            Promise.allSettled([getDashboardStats(), getDashboardTimeseries({ granularity: 'month', months })])
              .then(([statsRes, seriesRes]) => {
                if (statsRes.status === 'fulfilled') setStats(normalizeStats(statsRes.value))
                if (seriesRes.status === 'fulfilled') setPoints(normalizeTimeseries(seriesRes.value))
                setLastUpdatedAt(new Date())
                setError(null)
              })
              .catch((e) => {
                setError(e?.response?.data?.message || e?.message || 'Failed to refresh dashboard stats')
              })
              .finally(() => setRefreshing(false))
          }}
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Users" value={stats.users} />
        <StatCard title="Questions" value={stats.questions} />
        <StatCard title="Papers" value={stats.papers} />
        <StatCard title="Bookmarks" value={stats.bookmarks} />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-lg font-medium mb-4">{points?.length ? `Monthly Overview (Last ${months} months)` : 'Overview'}</div>
        <Bar
          data={
            points?.length
              ? {
                  labels: points.map((p) => formatMonth(p.month)),
                  datasets: [
                    { label: 'Users', backgroundColor: '#4f46e5', data: points.map((p) => p.users) },
                    { label: 'Questions', backgroundColor: '#0ea5e9', data: points.map((p) => p.questions) },
                    { label: 'Papers', backgroundColor: '#10b981', data: points.map((p) => p.papers) },
                    { label: 'Bookmarks', backgroundColor: '#f59e0b', data: points.map((p) => p.bookmarks) }
                  ]
                }
              : data
          }
          options={
            points?.length
              ? {
                  responsive: true,
                  plugins: { legend: { position: 'bottom' } },
                  scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
                }
              : { responsive: true, plugins: { legend: { display: false } } }
          }
        />
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-lg p-4 bg-white dark:bg-gray-800 shadow">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
