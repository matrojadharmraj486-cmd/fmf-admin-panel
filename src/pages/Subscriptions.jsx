import { useEffect, useMemo, useState } from 'react'
import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  deleteSubscription
} from '../services/api.js'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  gstPercent: 0,
  durationDays: '',
  currency: 'INR',
  isActive: true
}

export default function Subscriptions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState({ id: null, action: '' })
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })

  const pushToast = (type, message) => {
    const id = `${Date.now()}_${Math.random()}`
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3000)
  }

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const res = await listSubscriptions(true)
      setItems(Array.isArray(res) ? res : res?.data || [])
      setError('')
    } catch {
      setItems([])
      setError('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setForm({
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price ?? '',
      gstPercent: Number.isFinite(Number(item?.gstPercent)) ? Number(item.gstPercent) : 0,
      durationDays: item?.durationDays ?? '',
      currency: item?.currency || 'INR',
      isActive: typeof item?.isActive === 'boolean' ? item.isActive : true
    })
    setEditingId(item?._id || item?.id || null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSaving(false)
    resetForm()
  }

  const validateForm = () => {
    if (!form.name.trim()) return 'Please enter name'
    const priceValue = Number(form.price)
    if (!Number.isFinite(priceValue) || priceValue <= 0) return 'Price must be greater than 0'
    const gstValue = Number(form.gstPercent)
    if (![0, 5, 18].includes(gstValue)) return 'Please select a valid GST %'
    const durationValue = Number(form.durationDays)
    if (!Number.isFinite(durationValue) || durationValue <= 0) return 'Duration must be greater than 0'
    return ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      pushToast('error', validationError)
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      gstPercent: Number(form.gstPercent),
      durationDays: Number(form.durationDays),
      currency: form.currency.trim() || 'INR',
      isActive: !!form.isActive
    }

    try {
      setSaving(true)
      if (editingId) {
        await updateSubscription(editingId, payload)
        pushToast('success', 'Subscription updated')
      } else {
        await createSubscription(payload)
        pushToast('success', 'Subscription created')
      }
      await fetchSubscriptions()
      closeModal()
    } catch {
      const msg = editingId ? 'Failed to update subscription' : 'Failed to create subscription'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item) => {
    const id = item?._id || item?.id
    if (!id) return
    try {
      setBusy({ id, action: 'toggle' })
      await updateSubscriptionStatus(id, !item.isActive)
      setItems((prev) =>
        prev.map((p) => ((p._id || p.id) === id ? { ...p, isActive: !p.isActive } : p))
      )
      pushToast('success', `Subscription ${item.isActive ? 'deactivated' : 'activated'}`)
    } catch {
      const msg = 'Failed to update status'
      setError(msg)
      pushToast('error', msg)
    } finally {
      setBusy({ id: null, action: '' })
    }
  }

  const rows = useMemo(() => items, [items])

  const basePriceValue = Number(form.price)
  const gstPercentValue = Number(form.gstPercent)
  const gstAmount = Number.isFinite(basePriceValue) && Number.isFinite(gstPercentValue)
    ? (basePriceValue * gstPercentValue) / 100
    : 0
  const totalPlanPrice = Number.isFinite(basePriceValue) ? basePriceValue + gstAmount : 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Subscriptions</h2>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700"
        >
          New Plan
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500">No subscriptions found</div>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Base Price (INR)</th>
                <th className="px-4 py-2 text-left">GST %</th>
                <th className="px-4 py-2 text-left">Total Price (INR)</th>
                <th className="px-4 py-2 text-left">Duration (days)</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">CreatedAt</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((item) => {
                const id = item?._id || item?.id
                const createdAt = item?.createdAt ? new Date(item.createdAt) : null
                return (
                  <tr key={id} className="bg-white dark:bg-gray-800">
                    <td className="px-4 py-2">{item?.name || '—'}</td>
                    <td className="px-4 py-2">INR {item?.price ?? '—'}</td>
                    <td className="px-4 py-2">{Number.isFinite(Number(item?.gstPercent)) ? Number(item.gstPercent) : '—'}</td>
                    <td className="px-4 py-2">
                      INR {item?.totalPrice ?? (
                        Number.isFinite(Number(item?.price)) && Number.isFinite(Number(item?.gstPercent))
                          ? (Number(item.price) + (Number(item.price) * Number(item.gstPercent)) / 100).toFixed(2)
                          : '—'
                      )}
                    </td>
                    <td className="px-4 py-2">{item?.durationDays ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className={item?.isActive ? 'text-emerald-600' : 'text-gray-500'}>
                        {item?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {createdAt && !Number.isNaN(createdAt.getTime())
                        ? createdAt.toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy.id === id}
                        onClick={() => toggleActive(item)}
                        className="px-3 py-1 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60"
                      >
                        {busy.id === id && busy.action === 'toggle'
                          ? 'Updating...'
                          : item?.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                      <button
                        type="button"
                        disabled={busy.id === id}
                        onClick={() => setDeleteConfirm({ open: true, id, name: item?.name || 'this plan' })}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Delete subscription <span className="font-medium">{deleteConfirm.name}</span>?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
                onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}
                className="px-4 py-2 rounded border dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
                onClick={async () => {
                  if (!deleteConfirm.id) return
                  try {
                    setBusy({ id: deleteConfirm.id, action: 'delete' })
                    await deleteSubscription(deleteConfirm.id)
                    pushToast('success', 'Subscription deleted')
                    setDeleteConfirm({ open: false, id: null, name: '' })
                    await fetchSubscriptions()
                  } catch {
                    pushToast('error', 'Failed to delete subscription')
                    setError('Failed to delete subscription')
                  } finally {
                    setBusy({ id: null, action: '' })
                  }
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy.id === deleteConfirm.id && busy.action === 'delete' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">{editingId ? 'Edit Plan' : 'Create Plan'}</div>
              <button type="button" onClick={closeModal} className="text-gray-500">Close</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Name"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                required
              />
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                placeholder="Currency (INR)"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="Base Price"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                required
              />
              <div className="space-y-1">
                <label className="text-sm text-gray-600 dark:text-gray-300">GST %</label>
                <select
                  value={form.gstPercent}
                  onChange={(e) => setForm((f) => ({ ...f, gstPercent: Number(e.target.value) }))}
                  className="w-full rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                >
                  <option value={0}>0</option>
                  <option value={5}>5</option>
                  <option value={18}>18</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">Total Plan Price (INR)</label>
                <input
                  type="text"
                  value={`INR ${Number.isFinite(totalPlanPrice) ? totalPlanPrice.toFixed(2) : '0.00'}`}
                  readOnly
                  className="w-full rounded border bg-gray-50 dark:bg-gray-900/40 border-gray-300 dark:border-gray-700 px-3 py-2"
                />
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                placeholder="Duration (days)"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
                required
              />
            </div>

            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={3}
              className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                {saving ? 'Saving...' : (editingId ? 'Save' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow text-white ${t.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
