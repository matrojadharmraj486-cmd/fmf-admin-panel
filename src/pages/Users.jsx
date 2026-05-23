import { useEffect, useMemo, useRef, useState } from 'react'
import {
  listUsers as apiList,
  blockUser,
  unblockUser,
  deleteAdminUser,
  getAdminUser,
  listPayments,
  sendNotification,
  updateAdminUser,
  bulkDeleteAdminUsers
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

export default function Users() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState({ id: null, action: '' })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const selectAllRef = useRef(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details | transactions
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifySending, setNotifySending] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ title: '', body: '', dataText: '{}' })

  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editOriginal, setEditOriginal] = useState(null)
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    isVerified: false,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', name: '' })
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState({ open: false, count: 0 })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const u = await apiList({ q: '' })
        setList(extractUsers(u))
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
    const q = String(query || '').toLowerCase()
    return list.filter((u) => {
      const name = String(u?.fullName || '').toLowerCase()
      const email = String(u?.email || '').toLowerCase()
      const mobile = String(u?.mobileNumber || u?.phone || u?.mobile || '').toLowerCase()
      return name.includes(q) || email.includes(q) || mobile.includes(q)
    })
  }, [list, query])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize])
  const safePage = useMemo(() => Math.min(page, totalPages), [page, totalPages])
  const start = useMemo(() => (safePage - 1) * pageSize, [safePage, pageSize])
  const currentItems = useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize])

  useEffect(() => {
    setPage(1)
  }, [query, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const currentPageIds = useMemo(() => currentItems.map((u) => u?._id).filter(Boolean), [currentItems])

  const isAllVisibleSelected = useMemo(() => {
    if (currentPageIds.length === 0) return false
    return currentPageIds.every((id) => selectedIds.has(id))
  }, [currentPageIds, selectedIds])

  const isSomeVisibleSelected = useMemo(() => {
    if (currentPageIds.length === 0) return false
    return currentPageIds.some((id) => selectedIds.has(id)) && !isAllVisibleSelected
  }, [currentPageIds, selectedIds, isAllVisibleSelected])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeVisibleSelected
    }
  }, [isSomeVisibleSelected])

  const refetchUsers = async () => {
    const res = await apiList({ q: query || '' })
    setList(extractUsers(res))
  }

  const openDetails = async (u) => {
    const id = u?._id
    if (!id) return
    setSelectedUser(u)
    setActiveTab('details')
    setPayments([])
    setOk('')
    setError('')
    setDetailOpen(true)
    try {
      setDetailLoading(true)
      const res = await getAdminUser(id)
      const full = extractUser(res) || u
      setSelectedUser(full)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetails = () => {
    setDetailOpen(false)
    setSelectedUser(null)
    setDetailLoading(false)
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

  const openEdit = async (u) => {
    const id = u?._id
    if (!id) return
    setOk(''); setError('')
    setEditOpen(true)
    setEditLoading(true)
    try {
      const res = await getAdminUser(id)
      const user = extractUser(res) || u
      const addr = normalizeAddress(user)
      const normalized = {
        _id: user?._id || id,
        fullName: user?.fullName || '',
        email: user?.email || '',
        mobileNumber: user?.mobileNumber || user?.phone || user?.mobile || '',
        isVerified: Boolean(pickBool(user, ['isVerified', 'verified'])),
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        city: addr.city,
        state: addr.state,
        country: addr.country,
        pincode: addr.pincode
      }
      setEditOriginal(normalized)
      setEditForm({
        fullName: normalized.fullName,
        email: normalized.email,
        mobileNumber: normalized.mobileNumber,
        isVerified: normalized.isVerified,
        addressLine1: normalized.addressLine1,
        addressLine2: normalized.addressLine2,
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
        pincode: normalized.pincode
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load user')
      setEditOpen(false)
    } finally {
      setEditLoading(false)
    }
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditLoading(false)
    setEditSaving(false)
    setEditOriginal(null)
  }

  const buildDiff = (original, next) => {
    const diff = {}
    if (!original) return diff
    const fields = ['fullName', 'email', 'mobileNumber', 'isVerified']
    for (const f of fields) {
      const a = original?.[f]
      const b = next?.[f]
      const same = typeof b === 'string' ? String(a || '') === b : Boolean(a) === Boolean(b)
      if (!same) diff[f] = b
    }

    const addressKeys = ['addressLine1', 'addressLine2', 'city', 'state', 'country', 'pincode']
    const addressChanged = addressKeys.some((k) => String(original?.[k] || '') !== String(next?.[k] || ''))
    if (addressChanged) {
      diff.address = {
        addressLine1: next?.addressLine1 || '',
        addressLine2: next?.addressLine2 || '',
        city: next?.city || '',
        state: next?.state || '',
        country: next?.country || '',
        pincode: next?.pincode || ''
      }
    }
    return diff
  }

  const saveEdit = async () => {
    if (!editOriginal?._id) return
    setOk(''); setError('')
    const diff = buildDiff(editOriginal, editForm)
    if (Object.keys(diff).length === 0) {
      setOk('No changes')
      closeEdit()
      return
    }
    try {
      setEditSaving(true)
      await updateAdminUser(editOriginal._id, diff)
      setOk('User updated')
      closeEdit()
      await refetchUsers()
    } catch (err) {
      if (err?.response?.status === 409) {
        const msg = String(err?.response?.data?.message || '').toLowerCase()
        if (msg.includes('email')) return setError('email already exists')
        if (msg.includes('mobile')) return setError('mobileNumber already exists')
        return setError('Duplicate value already exists')
      }
      setError(err?.response?.data?.message || 'Failed to update user')
    } finally {
      setEditSaving(false)
    }
  }

  const openDeleteConfirm = (u) => {
    const id = u?._id
    if (!id) return
    setOk(''); setError('')
    setDeleteConfirm({ open: true, id, name: u?.fullName || u?.email || 'this user' })
  }

  const closeDeleteConfirm = () => setDeleteConfirm({ open: false, id: '', name: '' })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    setOk(''); setError('')
    try {
      setBusy({ id: deleteConfirm.id, action: 'delete' })
      await deleteAdminUser(deleteConfirm.id)
      setOk('User deleted')
      closeDeleteConfirm()
      await refetchUsers()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete user'
      setError(msg)
    } finally {
      setBusy({ id: null, action: '' })
    }
  }

  const toggleSelect = (id) => {
    if (!id) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const shouldSelectAll = !currentPageIds.every((id) => next.has(id))
      for (const id of currentPageIds) {
        if (shouldSelectAll) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const openBulkDeleteConfirm = () => {
    if (selectedIds.size === 0) return
    setOk(''); setError('')
    setBulkDeleteConfirm({ open: true, count: selectedIds.size })
  }

  const closeBulkDeleteConfirm = () => setBulkDeleteConfirm({ open: false, count: 0 })

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setOk(''); setError('')
    try {
      setBusy({ id: 'bulk', action: 'bulk-delete' })
      try {
        await bulkDeleteAdminUsers(ids)
      } catch (err) {
        // Fallback if backend bulk endpoint is not implemented yet.
        for (const id of ids) await deleteAdminUser(id)
      }
      setOk(`Deleted ${ids.length} users`)
      closeBulkDeleteConfirm()
      clearSelection()
      await refetchUsers()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete users')
    } finally {
      setBusy({ id: null, action: '' })
    }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Users</h2>
          <button
            disabled={selectedIds.size === 0 || (busy.id === 'bulk' && busy.action === 'bulk-delete')}
            onClick={openBulkDeleteConfirm}
            className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-60"
          >
            {busy.id === 'bulk' && busy.action === 'bulk-delete' ? 'Deleting...' : `Bulk Delete${selectedIds.size ? ` (${selectedIds.size})` : ''}`}
          </button>
          {selectedIds.size > 0 && (
            <button onClick={clearSelection} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600">
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <div>Per page</div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) || 10)}
              className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}
      <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={isAllVisibleSelected}
                  onChange={toggleSelectAllVisible}
                />
              </th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Mobile</th>
              <th className="px-4 py-2 text-left">isVerified</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentItems.map((u) => (
              <tr key={u._id} className="bg-white dark:bg-gray-800">
                <td className="px-4 py-2">
                  <input type="checkbox" checked={selectedIds.has(u._id)} onChange={() => toggleSelect(u._id)} />
                </td>
                <td className="px-4 py-2">{u.fullName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.mobileNumber || u.phone || u.mobile || '-'}</td>
                <td className="px-4 py-2">{pickBool(u, ['isVerified', 'verified']) ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2">{u.blocked ? 'Blocked' : 'Active'}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button onClick={() => openDetails(u)} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600">
                    Details
                  </button>
                  <button onClick={() => openEdit(u)} className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60">
                    Edit
                  </button>
                  <button disabled={busy.id === u._id} onClick={() => toggleBlock(u._id, u.blocked)} className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                    {busy.id === u._id && busy.action === 'block' ? 'Updating...' : (u.blocked ? 'Unblock' : 'Block')}
                  </button>
                  <button disabled={busy.id === u._id && busy.action === 'delete'} onClick={() => openDeleteConfirm(u)} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-60">
                    {busy.id === u._id && busy.action === 'delete' ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {safePage} of {totalPages}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded px-3 py-1.5 text-sm ${p === safePage ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-700'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
              detailLoading ? (
                <Loader />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <InfoCard title="Profile">
                    <InfoRow label="User ID" value={selectedUser._id} />
                    <InfoRow label="Name" value={selectedUser.fullName} />
                    <InfoRow label="Email" value={selectedUser.email} />
                    <InfoRow label="Phone" value={selectedUser.mobileNumber || selectedUser.phone || selectedUser.mobile || '-'} />
                    <InfoRow label="Verified" value={pickBool(selectedUser, ['isVerified', 'verified']) ? 'Yes' : 'No'} />
                  </InfoCard>
                  <InfoCard title="Address">
                    {renderAddressRows(selectedUser)}
                  </InfoCard>
                  <InfoCard title="Status">
                    <InfoRow label="Blocked" value={selectedUser.blocked ? 'Yes' : 'No'} />
                    <InfoRow label="Created" value={formatDate(selectedUser.createdAt || selectedUser.created_at)} />
                    <InfoRow label="Updated" value={formatDate(selectedUser.updatedAt || selectedUser.updated_at)} />
                  </InfoCard>
                  <InfoCard title="Other">
                    {renderOtherRows(selectedUser)}
                  </InfoCard>
                </div>
              )
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

      {editOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-lg">Edit User</div>
              <button onClick={closeEdit} className="px-3 py-1.5 rounded border dark:border-gray-600">Close</button>
            </div>
            {editLoading ? (
              <Loader />
            ) : (
              <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Full Name</div>
                    <input
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Email</div>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Mobile Number</div>
                    <input
                      value={editForm.mobileNumber}
                      onChange={(e) => setEditForm((s) => ({ ...s, mobileNumber: e.target.value }))}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <BoolSelect
                    label="isVerified"
                    value={editForm.isVerified}
                    onChange={(v) => setEditForm((s) => ({ ...s, isVerified: v }))}
                  />
                </div>

                <div className="pt-2">
                  <div className="font-medium text-sm text-gray-700 dark:text-gray-200 mb-2">Address</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <TextField label="Address Line 1" value={editForm.addressLine1} onChange={(v) => setEditForm((s) => ({ ...s, addressLine1: v }))} />
                    <TextField label="Address Line 2" value={editForm.addressLine2} onChange={(v) => setEditForm((s) => ({ ...s, addressLine2: v }))} />
                    <TextField label="City" value={editForm.city} onChange={(v) => setEditForm((s) => ({ ...s, city: v }))} />
                    <TextField label="State" value={editForm.state} onChange={(v) => setEditForm((s) => ({ ...s, state: v }))} />
                    <TextField label="Country" value={editForm.country} onChange={(v) => setEditForm((s) => ({ ...s, country: v }))} />
                    <TextField label="Pincode" value={editForm.pincode} onChange={(v) => setEditForm((s) => ({ ...s, pincode: v }))} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeEdit} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
                  <button
                    disabled={editSaving}
                    onClick={saveEdit}
                    className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60"
                  >
                    {editSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete {deleteConfirm.name}?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={closeDeleteConfirm} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button
                disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy.id === deleteConfirm.id && busy.action === 'delete' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm.open && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Bulk Delete</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Delete {bulkDeleteConfirm.count} selected users?
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={closeBulkDeleteConfirm} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button
                disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
                onClick={confirmBulkDelete}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-60"
              >
                {busy.id === 'bulk' && busy.action === 'bulk-delete' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
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

function extractUser(res) {
  if (!res) return null
  if (res?.data && typeof res.data === 'object') {
    if (Array.isArray(res.data)) return res.data[0] || null
    return res.data
  }
  return res?.user || res?.data?.user || res
}

function pickBool(source, keys) {
  for (const key of keys) {
    const v = source?.[key]
    if (typeof v === 'boolean') return v
    if (v === 1 || v === 0) return Boolean(v)
    if (typeof v === 'string' && (v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) return v.toLowerCase() === 'true'
  }
  return null
}

function BoolSelect({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
      <select
        value={value ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    </div>
  )
}

function TextField({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      />
    </div>
  )
}

function normalizeAddress(user) {
  const addr = user?.address && typeof user.address === 'object' ? user.address : {}
  return {
    addressLine1: pickValue(user, ['addressLine1', 'address1', 'line1']) || pickValue(addr, ['addressLine1', 'address1', 'line1']) || '',
    addressLine2: pickValue(user, ['addressLine2', 'address2', 'line2']) || pickValue(addr, ['addressLine2', 'address2', 'line2']) || '',
    city: pickValue(user, ['city']) || pickValue(addr, ['city']) || '',
    state: pickValue(user, ['state']) || pickValue(addr, ['state']) || '',
    country: pickValue(user, ['country']) || pickValue(addr, ['country']) || '',
    pincode: pickValue(user, ['pincode', 'pinCode', 'zip']) || pickValue(addr, ['pincode', 'pinCode', 'zip']) || ''
  }
}

function renderAddressRows(user) {
  const addr = normalizeAddress(user)
  const hasAny = Object.values(addr).some((v) => String(v || '').trim())
  if (!hasAny) return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
  return (
    <>
      <InfoRow label="Line 1" value={addr.addressLine1} />
      <InfoRow label="Line 2" value={addr.addressLine2} />
      <InfoRow label="City" value={addr.city} />
      <InfoRow label="State" value={addr.state} />
      <InfoRow label="Country" value={addr.country} />
      <InfoRow label="Pincode" value={addr.pincode} />
    </>
  )
}

function renderOtherRows(user) {
  const blacklist = new Set([
    '_id',
    '__v',
    'password',
    'hash',
    'salt',
    'isActive',
    'active',
    'isDeleted',
    'deleted',
    'fullName',
    'email',
    'mobileNumber',
    'mobile',
    'phone',
    'address',
    'addressLine1',
    'addressLine2',
    'address1',
    'address2',
    'line1',
    'line2',
    'city',
    'state',
    'country',
    'pincode',
    'pinCode',
    'zip',
    'blocked',
    'isVerified',
    'verified',
    'createdAt',
    'created_at',
    'updatedAt',
    'updated_at'
  ])
  const entries = Object.entries(user || {}).filter(([k]) => !blacklist.has(k))
  if (entries.length === 0) return <div className="text-sm text-gray-500 dark:text-gray-400">-</div>
  return (
    <>
      {entries.map(([k, v]) => (
        <InfoRow key={k} label={k} value={formatValue(v)} />
      ))}
    </>
  )
}

function pickValue(source, keys) {
  for (const key of keys) {
    const v = source?.[key]
    if (typeof v === 'string' && v.trim()) return v
    if (typeof v === 'number') return String(v)
  }
  return ''
}

function formatValue(v) {
  if (v === null || typeof v === 'undefined') return '-'
  if (typeof v === 'string') return v || '-'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toLocaleString()
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function extractUsers(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data?.users)) return res.data.users
  if (Array.isArray(res?.users)) return res.users
  if (Array.isArray(res?.data?.result)) return res.data.result
  return []
}
