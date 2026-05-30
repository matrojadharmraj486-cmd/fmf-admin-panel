import { useEffect, useMemo, useRef, useState } from 'react'
import { listUsers, sendBulkNotification } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

const emptyForm = {
  title: '',
  body: '',
  dataText: '{}'
}

export default function Notifications() {
  const [mode, setMode] = useState('selected')
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [form, setForm] = useState({ ...emptyForm })
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const selectAllRef = useRef(null)

  useEffect(() => {
    let alive = true
    const timeout = setTimeout(async () => {
      try {
        setLoadingUsers(true)
        setError('')
        const res = await listUsers({ q: query || '', limit: 100 })
        if (!alive) return
        setUsers(toArray(res))
      } catch (err) {
        if (!alive) return
        setUsers([])
        setError(err?.response?.data?.message || 'Failed to load users')
      } finally {
        if (alive) setLoadingUsers(false)
      }
    }, 250)

    return () => {
      alive = false
      clearTimeout(timeout)
    }
  }, [query])

  const visibleUserIds = useMemo(() => users.map(getUserId).filter(Boolean), [users])
  const allVisibleSelected = visibleUserIds.length > 0 && visibleUserIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = visibleUserIds.some((id) => selectedIds.has(id)) && !allVisibleSelected

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected])

  const toggleUser = (id) => {
    if (!id) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const shouldSelectAll = !visibleUserIds.every((id) => next.has(id))
      for (const id of visibleUserIds) {
        if (shouldSelectAll) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const parseData = () => {
    try {
      const parsed = JSON.parse(form.dataText || '{}')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
      return parsed
    } catch {
      throw new Error('Data must be valid JSON')
    }
  }

  const validate = () => {
    if (!form.title.trim()) return 'Please enter notification title'
    if (!form.body.trim()) return 'Please enter notification body'
    if (mode === 'selected' && selectedIds.size === 0) return 'Please select at least one user'
    return ''
  }

  const submit = async (forceAll = false) => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    if (mode === 'all' && !forceAll) {
      setConfirmAllOpen(true)
      return
    }

    let data = {}
    try {
      data = parseData()
    } catch (err) {
      setError(err.message)
      return
    }

    try {
      setSending(true)
      setError('')
      setOk('')
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        data,
        sendToAll: mode === 'all',
        userIds: mode === 'selected' ? Array.from(selectedIds) : []
      }
      const res = await sendBulkNotification(payload)
      const sent = res?.sent ?? res?.data?.sent ?? res?.successCount ?? (mode === 'selected' ? selectedIds.size : 'all')
      setOk(mode === 'all' ? 'Notification sent to all users' : `Notification sent to ${sent} selected users`)
      setConfirmAllOpen(false)
      setForm({ ...emptyForm })
      if (mode === 'selected') setSelectedIds(new Set())
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {mode === 'all' ? 'All users' : `${selectedIds.size} selected`}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('selected')}
            className={`rounded px-4 py-2 text-sm ${mode === 'selected' ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-700'}`}
          >
            Send to Selected Users
          </button>
          <button
            type="button"
            onClick={() => setMode('all')}
            className={`rounded px-4 py-2 text-sm ${mode === 'all' ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-700'}`}
          >
            Send to All Users
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Notification title"
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
          <textarea
            value={form.dataText}
            onChange={(e) => setForm((prev) => ({ ...prev, dataText: e.target.value }))}
            placeholder='Data JSON, example: {"screen":"home"}'
            rows={1}
            className="rounded border border-gray-300 bg-white px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
            placeholder="Notification body"
            rows={4}
            className="md:col-span-2 rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...emptyForm })}
            disabled={sending}
            className="rounded border border-gray-300 px-4 py-2 dark:border-gray-700"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={sending}
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {sending ? 'Sending...' : mode === 'all' ? 'Send to All' : 'Send to Selected'}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {ok && <div className="text-sm text-green-600">{ok}</div>}

      {mode === 'selected' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name, email or mobile"
              className="min-w-[260px] flex-1 rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
              className="rounded border border-gray-300 px-4 py-2 disabled:opacity-50 dark:border-gray-700"
            >
              Clear Selection
            </button>
          </div>

          {loadingUsers ? (
            <Loader />
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <Th>
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAllVisible}
                      />
                    </Th>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Mobile</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => {
                    const id = getUserId(user)
                    return (
                      <tr key={id || getUserEmail(user)} className="bg-white dark:bg-gray-800">
                        <Td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(id)}
                            onChange={() => toggleUser(id)}
                          />
                        </Td>
                        <Td>{getUserName(user)}</Td>
                        <Td>{getUserEmail(user)}</Td>
                        <Td>{getUserMobile(user)}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {confirmAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow dark:bg-gray-800">
            <div className="text-lg font-semibold">Send to All Users</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              This notification will be sent to every user with a valid device token.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAllOpen(false)}
                disabled={sending}
                className="rounded border border-gray-300 px-4 py-2 dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={sending}
                className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Yes, Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-sm font-medium">{children}</th>
}

function Td({ children }) {
  return <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{children || '-'}</td>
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.data?.users)) return value.data.users
  if (Array.isArray(value?.users)) return value.users
  return []
}

function getUserId(user) {
  return user?._id || user?.id || ''
}

function getUserName(user) {
  return user?.fullName || user?.name || user?.username || '-'
}

function getUserEmail(user) {
  return user?.email || '-'
}

function getUserMobile(user) {
  return user?.mobileNumber || user?.phone || user?.mobile || '-'
}
