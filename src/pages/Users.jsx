import { useEffect, useMemo, useState } from 'react'
import {
  listUsers as apiList,
  blockUser,
  unblockUser,
  deleteUser as apiDelete,
  subscribeUser,
  unsubscribeUser,
  listPayments,
  sendNotification
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function Users() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState({ id: null, action: '' })

  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details | transactions
  const [selectedUser, setSelectedUser] = useState(null)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifySending, setNotifySending] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ title: '', body: '', dataText: '{}' })

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

  const openDetails = (u) => {
    setSelectedUser(u)
    setActiveTab('details')
    setPayments([])
    setOk('')
    setError('')
    setDetailOpen(true)
  }

  const closeDetails = () => {
    setDetailOpen(false)
    setSelectedUser(null)
    setPayments([])
    setPaymentsLoading(false)
    setNotifyOpen(false)
    setNotifySending(false)
  }

  const fetchPayments = async (userId) => {
    if (!userId) return
    try {
      setPaymentsLoading(true)
      setError('')
      const res = await listPayments({ userId })
      setPayments(toArray(res))
    } catch (e) {
      setPayments([])
      setError(e?.response?.data?.message || 'Failed to load transactions')
    } finally {
      setPaymentsLoading(false)
    }
  }

  const onTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'transactions') fetchPayments(selectedUser?._id)
  }

  const openNotify = () => {
    if (!selectedUser?._id) return
    setNotifyForm({ title: '', body: '', dataText: '{}' })
    setOk('')
    setError('')
    setNotifyOpen(true)
  }

  const closeNotify = () => {
    setNotifyOpen(false)
    setNotifySending(false)
  }

  const submitNotify = async (e) => {
    e.preventDefault()
    if (!selectedUser?._id) return
    setOk('')
    setError('')
    if (!notifyForm.title.trim()) return setError('Please enter notification title')
    if (!notifyForm.body.trim()) return setError('Please enter notification body')
    let dataObj = {}
    try {
      const parsed = JSON.parse(notifyForm.dataText || '{}')
      dataObj = parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return setError('Data must be valid JSON (example: {"type":"promo"})')
    }
    try {
      setNotifySending(true)
      await sendNotification({
        userId: selectedUser._id,
        title: notifyForm.title.trim(),
        body: notifyForm.body.trim(),
        data: dataObj
      })
      setOk('Notification sent')
      closeNotify()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send notification')
    } finally {
      setNotifySending(false)
    }
  }

  const toggleBlock = async (_id, blocked) => {
    try {
      setOk(''); setError('')
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
      setOk(''); setError('')
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
      setOk(''); setError('')
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
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
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
                <td className="px-4 py-2">{u.fullName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.blocked ? 'Blocked' : 'Active'}</td>
                <td className="px-4 py-2">{u.subscribed ? 'Subscribed' : 'Unsubscribed'}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button onClick={() => openDetails(u)} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600">
                    Details
                  </button>
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

      {detailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-5xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">{selectedUser.fullName || 'User'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email || '-'}</div>
              </div>
              <button onClick={closeDetails} className="px-3 py-1.5 rounded border dark:border-gray-600">Close</button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
              <TabButton active={activeTab === 'details'} onClick={() => onTabChange('details')}>Details</TabButton>
              <TabButton active={activeTab === 'transactions'} onClick={() => onTabChange('transactions')}>Transactions</TabButton>
              <div className="flex-1" />
              <button onClick={openNotify} className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">
                Send Notification
              </button>
            </div>

            {activeTab === 'details' ? (
              <div className="grid md:grid-cols-2 gap-4">
                <InfoCard title="Profile">
                  <InfoRow label="User ID" value={selectedUser._id} />
                  <InfoRow label="Name" value={selectedUser.fullName} />
                  <InfoRow label="Email" value={selectedUser.email} />
                  <InfoRow label="Phone" value={selectedUser.mobileNumber || selectedUser.phone || selectedUser.mobile || '-'} />
                </InfoCard>
                <InfoCard title="Status">
                  <InfoRow label="Blocked" value={selectedUser.blocked ? 'Yes' : 'No'} />
                  <InfoRow label="Subscribed" value={selectedUser.subscribed ? 'Yes' : 'No'} />
                </InfoCard>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentsLoading ? (
                  <Loader />
                ) : payments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    No transactions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left">Payment ID</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Method</th>
                          <th className="px-4 py-2 text-left">Plan</th>
                          <th className="px-4 py-2 text-left">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {payments.map((p, idx) => (
                          <tr key={getPaymentId(p) || idx} className="bg-white dark:bg-gray-800">
                            <td className="px-4 py-2 text-sm">{getPaymentId(p) || '-'}</td>
                            <td className="px-4 py-2 text-sm">{formatAmount(p)}</td>
                            <td className="px-4 py-2 text-sm">{formatAny(getPaymentStatus(p))}</td>
                            <td className="px-4 py-2 text-sm">{formatAny(getPaymentMethod(p))}</td>
                            <td className="px-4 py-2 text-sm">{formatAny(getPaymentPlan(p))}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(getPaymentCreatedAt(p))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {notifyOpen && (
              <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-lg">Send Notification</div>
                    <button onClick={closeNotify} className="px-3 py-1.5 rounded border dark:border-gray-600">Close</button>
                  </div>
                  <form onSubmit={submitNotify} className="space-y-3">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Title</div>
                      <input
                        value={notifyForm.title}
                        onChange={(e) => setNotifyForm((s) => ({ ...s, title: e.target.value }))}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Body</div>
                      <textarea
                        value={notifyForm.body}
                        onChange={(e) => setNotifyForm((s) => ({ ...s, body: e.target.value }))}
                        rows={4}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600 dark:text-gray-300">Data (JSON)</div>
                      <textarea
                        value={notifyForm.dataText}
                        onChange={(e) => setNotifyForm((s) => ({ ...s, dataText: e.target.value }))}
                        rows={4}
                        className="w-full font-mono text-sm rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={closeNotify} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
                      <button disabled={notifySending} className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
                        {notifySending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm ${active ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-600'}`}
    >
      {children}
    </button>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-right text-gray-900 dark:text-gray-100 break-all">{value || '-'}</div>
    </div>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.payments)) return value.payments
  if (Array.isArray(value?.transactions)) return value.transactions
  return []
}

function getPaymentId(p) {
  return p?._id || p?.id || p?.paymentId || p?.txnId || p?.transactionId || ''
}

function getPaymentStatus(p) {
  return p?.status || p?.paymentStatus || p?.state || ''
}

function getPaymentMethod(p) {
  return p?.method || p?.paymentMethod || p?.gateway || p?.provider || ''
}

function getPaymentPlan(p) {
  return p?.planName || p?.plan || p?.productName || p?.subscriptionPlan || ''
}

function getPaymentCreatedAt(p) {
  return p?.createdAt || p?.created_at || p?.date || p?.paidAt || p?.updatedAt || ''
}

function formatAny(v) {
  if (v === null || typeof v === 'undefined') return '-'
  const s = String(v).trim()
  return s ? s : '-'
}

function formatAmount(p) {
  const amount = p?.amount ?? p?.price ?? p?.total ?? p?.value ?? ''
  const currency = p?.currency || p?.currencyCode || 'INR'
  if (amount === null || typeof amount === 'undefined' || amount === '') return '-'
  const n = Number(amount)
  if (!Number.isFinite(n)) return String(amount)
  return `${n} ${currency}`
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}
