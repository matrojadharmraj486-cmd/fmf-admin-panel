import { useEffect, useMemo, useState } from 'react'
import { listUsers as apiList, blockUser, unblockUser, deleteUser as apiDelete, subscribeUser, unsubscribeUser } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function Users() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState({ id: null, action: '' })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const u = await apiList('')
        console.log("u", u)
        setList(u?.data)
      } catch (e) {
        setError('Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    console.log("list", list)
    return list.filter((u) => u.fullName.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  }, [list, query])

  const toggleBlock = async (_id, blocked) => {
    try {
      setBusy({ id: _id, action: 'block' })
      if (blocked) await unblockUser(_id)
      else await blockUser(_id)
      setList((prev) => prev.map((u) => (u._id === _id ? { ...u, blocked: !u.blocked } : u)))
    } catch {
      setError('Failed to update status')
    } finally {
      setBusy({ id: null, action: '' })
    }
  }
  const remove = async (_id) => {
    try {
      setBusy({ id: _id, action: 'delete' })
      await apiDelete(_id)
      setList((prev) => prev.filter((u) => u._id !== _id))
    } catch {
      setError('Failed to delete user')
    } finally {
      setBusy({ id: null, action: '' })
    }
  }
  const toggleSub = async (_id, subscribed) => {
    try {
      setBusy({ id: _id, action: 'sub' })
      if (subscribed) await unsubscribeUser(_id)
      else await subscribeUser(_id)
      setList((prev) => prev.map((u) => (u._id === _id ? { ...u, subscribed: !u.subscribed } : u)))
    } catch {
      setError('Failed to update subscription')
    } finally {
      setBusy({ id: null, action: '' })
    }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Subscription</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((u) => (
              <tr key={u._id} className="bg-white dark:bg-gray-800">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.blocked ? 'Blocked' : 'Active'}</td>
                <td className="px-4 py-2">{u.subscribed ? 'Subscribed' : 'Unsubscribed'}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button disabled={busy.id === u._id} onClick={() => toggleBlock(u._id, u.blocked)} className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                    {busy.id === u._id && busy.action === 'block' ? 'Updating...' : (u.blocked ? 'Unblock' : 'Block')}
                  </button>
                  <button disabled={busy.id === u._id} onClick={() => toggleSub(u._id, u.subscribed)} className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60">
                    {busy.id === u._id && busy.action === 'sub' ? 'Updating...' : (u.subscribed ? 'Unsubscribe' : 'Subscribe')}
                  </button>
                  <button disabled={busy.id === u._id} onClick={() => remove(u._id)} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-60">
                    {busy.id === u._id && busy.action === 'delete' ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
