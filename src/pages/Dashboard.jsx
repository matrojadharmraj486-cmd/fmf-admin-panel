import { useEffect, useState } from 'react'
import { mockApi } from '../services/api.js'
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
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    mockApi.getStats().then((s) => {
      if (mounted) {
        setStats(s)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading...</div>

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Users" value={stats.users} />
        <StatCard title="Questions" value={stats.questions} />
        <StatCard title="Papers" value={stats.papers} />
        <StatCard title="Bookmarks" value={stats.bookmarks} />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-lg font-medium mb-4">Overview</div>
        <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
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
