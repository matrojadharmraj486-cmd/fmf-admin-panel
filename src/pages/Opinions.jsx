import { useEffect, useMemo, useState } from 'react'
import { listOpinions } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

const PAGE_SIZE = 10

export default function Opinions() {
  const [opinions, setOpinions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchOpinions = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listOpinions()
      setOpinions(toArray(res))
    } catch (err) {
      setOpinions([])
      setError(err?.response?.data?.message || 'Failed to load opinions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpinions()
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return opinions
    return opinions.filter((item) => {
      const haystack = [getName(item), getOpinion(item)].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [opinions, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aTime = getCreatedAt(a)
      const bTime = getCreatedAt(b)
      return bTime - aTime
    })
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const currentItems = sorted.slice(start, start + PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Opinions</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {sorted.length} {sorted.length === 1 ? 'opinion' : 'opinions'}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or opinion"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 md:max-w-md"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No opinions found.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 lg:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <HeaderCell>Name</HeaderCell>
                  <HeaderCell>Opinion</HeaderCell>
                  <HeaderCell>Created At</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map((item) => (
                  <tr key={getId(item)} className="bg-white dark:bg-gray-800">
                    <BodyCell>{getName(item)}</BodyCell>
                    <BodyCell>{getOpinion(item)}</BodyCell>
                    <BodyCell>{formatDate(getCreatedAtRaw(item))}</BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {currentItems.map((item) => (
              <div key={getId(item)} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                  <div className="font-semibold">{getName(item)}</div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Opinion</div>
                  <div className="text-sm text-gray-700 dark:text-gray-200">{getOpinion(item)}</div>
                </div>
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Created {formatDate(getCreatedAtRaw(item))}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            current={safePage}
            total={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onJump={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  )
}

function HeaderCell({ children }) {
  return <th className="px-4 py-3 text-left text-sm font-medium">{children}</th>
}

function BodyCell({ children }) {
  return <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{children || '-'}</td>
}

function Pagination({ current, total, onPrev, onNext, onJump }) {
  if (total <= 1) return null
  const pages = Array.from({ length: total }).map((_, i) => i + 1)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Page {current} of {total}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onPrev}
          disabled={current === 1}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
        >
          Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onJump(p)}
            className={`rounded px-3 py-1.5 text-sm ${p === current ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-700'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={onNext}
          disabled={current === total}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.opinions)) return value.opinions
  return []
}

function getId(item) {
  return item?._id || item?.id || `${getName(item)}-${getCreatedAtRaw(item) || Math.random()}`
}

function getName(item) {
  if (!item) return '-'
  if (item.name) return item.name
  if (item.fullName) return item.fullName
  if (item.userName) return item.userName
  if (item.user?.name) return item.user.name
  if (item.user?.fullName) return item.user.fullName
  return '-'
}

function getOpinion(item) {
  if (!item) return '-'
  return item.opinion || item.text || item.message || item.feedback || item.content || item.body || '-'
}

function getCreatedAtRaw(item) {
  return item?.createdAt || item?.created_at || item?.date || item?.submittedAt || ''
}

function getCreatedAt(item) {
  const value = getCreatedAtRaw(item)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0
  return date.getTime()
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}
