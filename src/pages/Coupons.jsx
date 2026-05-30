import { useEffect, useMemo, useState } from 'react'
import { createCoupon, deleteCoupon, listCoupons } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Flat Discount in Percentage' },
  { value: 'fixed', label: 'Flat Discount in Fix Amount' }
]

const emptyForm = {
  code: '',
  isActive: true,
  discountType: 'percentage',
  discountValue: '',
  description: ''
}

export default function Coupons() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', code: '' })

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listCoupons()
      setItems(toArray(res))
    } catch (err) {
      setItems([])
      setError(err?.response?.data?.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const rows = useMemo(() => {
    return [...items].sort((a, b) => getDateValue(b) - getDateValue(a))
  }, [items])

  const validate = () => {
    if (!form.code.trim()) return 'Please enter coupon code name'
    const discountValue = Number(form.discountValue)
    if (!Number.isFinite(discountValue) || discountValue <= 0) return 'Discount must be greater than 0'
    if (form.discountType === 'percentage' && discountValue > 100) return 'Percentage discount cannot be more than 100'
    if (!form.description.trim()) return 'Please enter discount description'
    return ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      code: form.code.trim(),
      isActive: Boolean(form.isActive),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      description: form.description.trim()
    }

    try {
      setSaving(true)
      await createCoupon(payload)
      setOk('Coupon created')
      setForm({ ...emptyForm })
      await fetchCoupons()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      setDeletingId(deleteConfirm.id)
      setError('')
      setOk('')
      await deleteCoupon(deleteConfirm.id)
      setOk('Coupon deleted')
      setDeleteConfirm({ open: false, id: '', code: '' })
      await fetchCoupons()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete coupon')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Coupons System</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {rows.length} {rows.length === 1 ? 'coupon' : 'coupons'}
        </div>
      </div>

      <form onSubmit={submit} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="Coupon code name"
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />

          <select
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={form.discountType}
            onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value, discountValue: '' }))}
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          >
            {DISCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            max={form.discountType === 'percentage' ? 100 : undefined}
            step={form.discountType === 'percentage' ? 1 : 0.01}
            value={form.discountValue}
            onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
            placeholder={form.discountType === 'percentage' ? 'Discount %' : 'Discount amount'}
            className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-60 dark:bg-gray-700"
          >
            {saving ? 'Creating...' : 'Create Code'}
          </button>
        </div>

        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Discount description"
          rows={3}
          className="mt-3 w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </form>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {ok && <div className="text-sm text-green-600">{ok}</div>}

      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No coupons found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <HeaderCell>Coupon Code Name</HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Type of Coupon</HeaderCell>
                <HeaderCell>Discount</HeaderCell>
                <HeaderCell>Code Creation</HeaderCell>
                <HeaderCell>Discount Description</HeaderCell>
                <HeaderCell align="right">Delete Button</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rows.map((item) => {
                const id = getId(item)
                return (
                  <tr key={id || item?.code} className="bg-white dark:bg-gray-800">
                    <BodyCell>{getCode(item)}</BodyCell>
                    <BodyCell><StatusBadge active={getIsActive(item)} /></BodyCell>
                    <BodyCell>{formatDiscountType(getDiscountType(item))}</BodyCell>
                    <BodyCell>{formatDiscount(item)}</BodyCell>
                    <BodyCell>{formatDate(getCreatedAt(item))}</BodyCell>
                    <BodyCell>{getDescription(item)}</BodyCell>
                    <BodyCell align="right">
                      <button
                        type="button"
                        disabled={deletingId === id}
                        onClick={() => setDeleteConfirm({ open: true, id, code: getCode(item) })}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingId === id ? 'Deleting...' : 'Delete'}
                      </button>
                    </BodyCell>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 shadow dark:bg-gray-800">
            <div className="text-lg font-semibold">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Delete coupon <span className="font-medium">{deleteConfirm.code}</span>?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ open: false, id: '', code: '' })}
                disabled={Boolean(deletingId)}
                className="rounded border border-gray-300 px-4 py-2 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderCell({ children, align }) {
  return <th className={`px-4 py-3 text-left text-sm font-medium ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
}

function BodyCell({ children, align }) {
  return <td className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-200 ${align === 'right' ? 'text-right' : ''}`}>{children || '-'}</td>
}

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.coupons)) return value.coupons
  return []
}

function getId(item) {
  return item?._id || item?.id || ''
}

function getCode(item) {
  return item?.code || item?.couponCode || item?.name || '-'
}

function getIsActive(item) {
  if (typeof item?.isActive === 'boolean') return item.isActive
  if (typeof item?.active === 'boolean') return item.active
  return String(item?.status || 'active').toLowerCase() === 'active'
}

function getDiscountType(item) {
  return item?.discountType || item?.type || item?.couponType || ''
}

function getDiscountValue(item) {
  return item?.discountValue ?? item?.discount ?? item?.amount ?? item?.percentage ?? ''
}

function getDescription(item) {
  return item?.description || item?.discountDescription || item?.discountDiscription || '-'
}

function getCreatedAt(item) {
  return item?.createdAt || item?.created_at || item?.codeCreation || item?.createdDate || ''
}

function getDateValue(item) {
  const date = new Date(getCreatedAt(item))
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function formatDiscountType(type) {
  const normalized = String(type || '').toLowerCase()
  if (normalized === 'percentage') return 'Flat Discount in Percentage'
  if (normalized === 'fixed' || normalized === 'fixed_amount') return 'Flat Discount in Fix Amount'
  return type || '-'
}

function formatDiscount(item) {
  const value = getDiscountValue(item)
  if (value === '') return '-'
  const type = String(getDiscountType(item)).toLowerCase()
  return type === 'percentage' ? `${value}%` : `INR ${value}`
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}
