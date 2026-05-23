import { useEffect, useMemo, useState } from 'react'
import { bulkDeleteOpinions, deleteOpinion, listOpinions } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function Opinions() {
  const [opinions, setOpinions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState({ open: false })

  const fetchOpinions = async () => {
    try {
      setLoading(true)
      setError('')
      setOk('')
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const currentItems = sorted.slice(start, start + pageSize)

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  useEffect(() => {
    // Keep selection valid after filtering/refetch.
    const allowed = new Set(sorted.map(getId).filter(Boolean))
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)))
  }, [sorted])

  const isSelected = (id) => selectedIds.includes(id)

  const toggleSelected = (id, checked) => {
    if (!id) return
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((x) => x !== id)
    })
  }

  const currentPageIds = useMemo(
    () => currentItems.map(getId).filter(Boolean),
    [currentItems]
  )

  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
  const somePageSelected = currentPageIds.some((id) => selectedIds.includes(id)) && !allPageSelected

  const toggleSelectAllPage = (checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev)
      for (const id of currentPageIds) {
        if (checked) set.add(id)
        else set.delete(id)
      }
      return Array.from(set)
    })
  }

  const onDeleteRow = async (id) => {
    if (!id) return
    setError('')
    setOk('')
    try {
      await deleteOpinion(id)
      setOk('Deleted 1')
      await fetchOpinions()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete opinion')
    }
  }

  const openBulkConfirm = () => setBulkConfirm({ open: true })
  const closeBulkConfirm = () => setBulkConfirm({ open: false })

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setError('')
    setOk('')
    try {
      const data = await bulkDeleteOpinions(selectedIds)
      const deleted = data?.deleted ?? data?.data?.deleted ?? selectedIds.length
      setOk(`Deleted ${deleted}`)
      closeBulkConfirm()
      setSelectedIds([])
      await fetchOpinions()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to bulk delete opinions')
    }
  }

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
        <button
          onClick={openBulkConfirm}
          disabled={selectedIds.length === 0}
          className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          Delete Selected
        </button>
        {selectedIds.length > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.length} selected
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {ok && <div className="text-sm text-green-600">{ok}</div>}

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
                  <HeaderCell>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => {
                        if (!el) return
                        el.indeterminate = somePageSelected
                      }}
                      onChange={(e) => toggleSelectAllPage(e.target.checked)}
                    />
                  </HeaderCell>
                  <HeaderCell>Name</HeaderCell>
                  <HeaderCell>Opinion</HeaderCell>
                  <HeaderCell>Created At</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map((item) => (
                  <tr key={getId(item)} className="bg-white dark:bg-gray-800">
                    <BodyCell>
                      <input
                        type="checkbox"
                        checked={isSelected(getId(item))}
                        onChange={(e) => toggleSelected(getId(item), e.target.checked)}
                      />
                    </BodyCell>
                    <BodyCell>{getName(item)}</BodyCell>
                    <BodyCell>{getOpinion(item)}</BodyCell>
                    <BodyCell>{formatDate(getCreatedAtRaw(item))}</BodyCell>
                    <BodyCell>
                      <button
                        onClick={() => onDeleteRow(getId(item))}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {currentItems.map((item) => (
              <div key={getId(item)} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                    <div className="font-semibold">{getName(item)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected(getId(item))}
                      onChange={(e) => toggleSelected(getId(item), e.target.checked)}
                    />
                    <button
                      onClick={() => onDeleteRow(getId(item))}
                      className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
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
            pageSize={pageSize}
            onPageSize={(n) => setPageSize(n)}
          />
        </>
      )}

      {bulkConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Delete {selectedIds.length} selected {selectedIds.length === 1 ? 'opinion' : 'opinions'}?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={closeBulkConfirm} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button onClick={confirmBulkDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
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

function Pagination({ current, total, onPrev, onNext, onJump, pageSize, onPageSize }) {
  if (total <= 1) return null
  const pages = Array.from({ length: total }).map((_, i) => i + 1)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Page {current} of {total}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <div>Per page</div>
        <select
          value={pageSize}
          onChange={(e) => onPageSize?.(Number(e.target.value) || 10)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
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
