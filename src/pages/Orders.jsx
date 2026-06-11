import { useEffect, useMemo, useState } from 'react'
import { bulkDeleteOrders, deleteOrder, getOrderById, listOrders } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { GridFooter } from '../shared/GridFooter.jsx'

const DEFAULT_PAGE_SIZE = 50
const STATUS_OPTIONS = ['', 'pending', 'completed']

export default function Orders() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState({ id: '', action: '' })
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', label: '' })
  const [bulkConfirm, setBulkConfirm] = useState({ open: false })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    userId: '',
    subscriptionId: ''
  })

  const [detail, setDetail] = useState({ open: false, id: '', loading: false, data: null })

  const params = useMemo(() => ({
    page,
    limit: pageSize,
    status: filters.status || '',
    search: filters.search || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    userId: filters.userId || '',
    subscriptionId: filters.subscriptionId || ''
  }), [page, pageSize, filters])

  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      try {
        setLoading(true)
        setError('')
        setOk('')
        const res = await listOrders(params)
        if (!alive) return
        setItems(toArray(res))
      } catch (e) {
        if (!alive) return
        setItems([])
        setError(e?.response?.data?.message || 'Failed to load orders')
      } finally {
        if (alive) setLoading(false)
      }
    }, 250)
    return () => { alive = false; clearTimeout(t) }
  }, [params])

  useEffect(() => {
    const allowed = new Set(items.map(getId).filter(Boolean))
    setSelectedIds((prev) => prev.filter((id) => allowed.has(id)))
  }, [items])

  const onChange = (patch) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const openView = async (order) => {
    const id = getId(order)
    if (!id) return
    setError('')
    setOk('')
    setDetail({ open: true, id, loading: true, data: null })
    try {
      const res = await getOrderById(id)
      setDetail({ open: true, id, loading: false, data: unwrap(res) })
    } catch (e) {
      setDetail({ open: true, id, loading: false, data: null })
      setError(e?.response?.data?.message || 'Failed to load order details')
    }
  }

  const closeView = () => setDetail({ open: false, id: '', loading: false, data: null })

  const selectedCount = selectedIds.length
  const currentPageIds = useMemo(() => items.map(getId).filter(Boolean), [items])
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id))
  const somePageSelected = currentPageIds.some((id) => selectedIds.includes(id)) && !allPageSelected

  const reloadOrders = async () => {
    const res = await listOrders(params)
    setItems(toArray(res))
  }

  const toggleSelected = (id, checked) => {
    if (!id) return
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((currentId) => currentId !== id)
    })
  }

  const toggleSelectAllPage = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of currentPageIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return Array.from(next)
    })
  }

  const openDeleteConfirm = (order) => {
    const id = getId(order)
    if (!id) {
      setError('Unable to delete this order because it has no id')
      return
    }
    setDeleteConfirm({ open: true, id, label: getDisplayOrderId(order) || getOrderId(order) || id })
  }

  const closeDeleteConfirm = () => setDeleteConfirm({ open: false, id: '', label: '' })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      setBusy({ id: deleteConfirm.id, action: 'delete' })
      setError('')
      setOk('')
      await deleteOrder(deleteConfirm.id)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirm.id))
      closeDeleteConfirm()
      await reloadOrders()
      setOk('Order deleted')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete order')
    } finally {
      setBusy({ id: '', action: '' })
    }
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const ids = [...selectedIds]
    try {
      setBusy({ id: 'bulk', action: 'bulk-delete' })
      setError('')
      setOk('')
      let deleted = ids.length
      try {
        const data = await bulkDeleteOrders(ids)
        deleted = data?.deleted ?? data?.data?.deleted ?? ids.length
      } catch (err) {
        if (err?.response?.status !== 404) throw err
        for (const id of ids) await deleteOrder(id)
      }
      setBulkConfirm({ open: false })
      setSelectedIds([])
      await reloadOrders()
      setOk(`Deleted ${deleted} ${deleted === 1 ? 'order' : 'orders'}`)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to bulk delete orders')
    } finally {
      setBusy({ id: '', action: '' })
    }
  }

  const titleCount = items.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {titleCount} (page {page}, limit {pageSize})
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800 md:grid-cols-2 xl:grid-cols-6">
        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">Status</div>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || 'all'} value={s}>{s ? formatStatusLabel(s) : 'All'}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1 xl:col-span-2">
          <div className="text-sm text-gray-600 dark:text-gray-300">Search</div>
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="orderId / paymentId / receipt"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">User ID</div>
          <input
            value={filters.userId}
            onChange={(e) => onChange({ userId: e.target.value })}
            placeholder="Optional"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">Subscription ID</div>
          <input
            value={filters.subscriptionId}
            onChange={(e) => onChange({ subscriptionId: e.target.value })}
            placeholder="Optional"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">Date From</div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">Date To</div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>

        <button
          type="button"
          onClick={() => { setPage(1); setFilters({ status: '', search: '', dateFrom: '', dateTo: '', userId: '', subscriptionId: '' }) }}
          className="self-end rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={() => setBulkConfirm({ open: true })}
          disabled={selectedCount === 0 || (busy.id === 'bulk' && busy.action === 'bulk-delete')}
          className="self-end rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy.id === 'bulk' && busy.action === 'bulk-delete' ? 'Deleting...' : `Bulk Delete${selectedCount ? ` (${selectedCount})` : ''}`}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {ok && <div className="text-sm text-green-600">{ok}</div>}

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No orders found.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 xl:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <Th>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      ref={(el) => {
                        if (!el) return
                        el.indeterminate = somePageSelected
                      }}
                      onChange={(e) => toggleSelectAllPage(e.target.checked)}
                    />
                  </Th>
                  <Th>Order ID</Th>
                  <Th>Order Date</Th>
                  <Th>Customer Name</Th>
                  <Th>Payment Status</Th>
                  <Th>Order Status</Th>
                  <Th>Discounted Price</Th>
                  <Th>Download Invoice</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((o, idx) => (
                  <tr key={getId(o) || `${getOrderId(o)}-${idx}`} className="bg-white dark:bg-gray-800">
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(getId(o))}
                        onChange={(e) => toggleSelected(getId(o), e.target.checked)}
                      />
                    </Td>
                    <Td mono>{getDisplayOrderId(o, idx, page, pageSize)}</Td>
                    <Td>{formatDate(getOrderDate(o))}</Td>
                    <Td>{getUserName(o)}</Td>
                    <Td><StatusBadge status={getPaymentStatus(o)} /></Td>
                    <Td><StatusBadge status={getOrderStatus(o)} /></Td>
                    <Td>{formatDiscountedPrice(o)}</Td>
                    <Td><InvoiceLink order={o} /></Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openView(o)}
                          className="rounded bg-gray-900 px-3 py-1 text-white dark:bg-gray-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(o)}
                          disabled={busy.id === getId(o) && busy.action === 'delete'}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {busy.id === getId(o) && busy.action === 'delete' ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 xl:hidden">
            {items.map((o, idx) => (
              <div key={getId(o) || `${getOrderId(o)}-${idx}`} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(getId(o))}
                      onChange={(e) => toggleSelected(getId(o), e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{getDisplayOrderId(o, idx, page, pageSize)}</div>
                      <div className="font-semibold">{getUserName(o)}</div>
                    </div>
                  </div>
                  <StatusBadge status={getOrderStatus(o)} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Meta label="Order Date" value={formatDate(getOrderDate(o))} />
                  <Meta label="Payment Status" value={formatStatusLabel(getPaymentStatus(o))} />
                  <Meta label="Order Status" value={formatStatusLabel(getOrderStatus(o))} />
                  <Meta label="Discounted Price" value={formatDiscountedPrice(o)} />
                  <Meta label="Invoice" value={<InvoiceLink order={o} />} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button onClick={() => openView(o)} className="w-full rounded bg-gray-900 px-3 py-2 text-white dark:bg-gray-700">
                    View
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(o)}
                    disabled={busy.id === getId(o) && busy.action === 'delete'}
                    className="w-full rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy.id === getId(o) && busy.action === 'delete' ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <GridFooter
            page={page}
            pageSize={pageSize}
            onPageSize={(n) => { setPage(1); setPageSize(n) }}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            canNext={items.length >= pageSize}
            totalItems={items.length}
            itemLabel={items.length === 1 ? 'order on this page' : 'orders on this page'}
          />
        </>
      )}

      {detail.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-5xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">Order Details</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{detail.id}</div>
              </div>
              <button onClick={closeView} className="px-3 py-1.5 rounded border dark:border-gray-600">Close</button>
            </div>
            {detail.loading ? (
              <Loader />
            ) : (
              <OrderDetailsView order={detail.data} />
            )}
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Delete order <span className="font-medium">{deleteConfirm.label}</span>?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeDeleteConfirm}
                disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
                className="px-4 py-2 rounded border dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={busy.id === deleteConfirm.id && busy.action === 'delete'}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy.id === deleteConfirm.id && busy.action === 'delete' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Bulk Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Delete {selectedCount} selected {selectedCount === 1 ? 'order' : 'orders'}?
            </p>
            <p className="text-sm text-red-600">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setBulkConfirm({ open: false })}
                disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
                className="px-4 py-2 rounded border dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={busy.id === 'bulk' && busy.action === 'bulk-delete'}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
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

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.data?.items)) return value.data.items
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.orders)) return value.orders
  return []
}

function unwrap(res) {
  if (!res) return null
  if (res?.data && typeof res.data === 'object') return res.data
  return res
}

function getId(o) {
  return o?._id || o?.id || ''
}

function getOrderId(o) {
  return o?.orderId || o?.razorpayOrderId || o?.order_id || o?.razorpay_order_id || getId(o) || '-'
}

function getDisplayOrderId(o, index = 0, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const existing = o?.orderNumber || o?.orderNo || o?.displayOrderId || o?.displayOrderNumber
  if (existing) return String(existing)
  const serial = 1001 + Math.max(0, page - 1) * pageSize + index
  return String(serial).padStart(4, '0')
}

function getOrderNumber(o) {
  return o?.orderNumber || o?.orderNo || o?.displayOrderId || o?.displayOrderNumber || getOrderId(o)
}

function getUser(o) {
  return o?.user || o?.userId || o?.customer || {}
}

function getUserName(o) {
  const u = getUser(o)
  return u?.fullName || u?.name || '-'
}

function getUserEmail(o) {
  const u = getUser(o)
  return u?.email || '-'
}

function getUserMobile(o) {
  const u = getUser(o)
  return u?.mobileNumber || u?.phone || u?.mobile || '-'
}

function getPlanName(o) {
  const s = o?.subscription || o?.plan || o?.subscriptionId || {}
  if (typeof s === 'string') return s
  return s?.name || s?.title || s?.planName || '-'
}

function getCurrency(o) {
  return o?.currency || o?.currencyCode || 'INR'
}

function pickFirstValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && typeof value !== 'undefined' && value !== '') return value
  }
  return ''
}

function getOriginalAmount(o) {
  const subscription = o?.subscription && typeof o.subscription === 'object' ? o.subscription : {}
  return pickFirstValue(o, [
    'originalAmount',
    'originalPrice',
    'baseAmount',
    'basePrice',
    'subtotal',
    'subTotal',
    'planAmount',
    'planPrice'
  ]) || pickFirstValue(subscription, ['totalPrice', 'price', 'amount'])
}

function getDiscountAmount(o) {
  const coupon = o?.coupon && typeof o.coupon === 'object' ? o.coupon : {}
  return pickFirstValue(o, [
    'discountAmount',
    'couponDiscountAmount',
    'discount',
    'discountValueApplied',
    'couponDiscount'
  ]) || pickFirstValue(coupon, ['discountAmount', 'amountOff', 'discountApplied'])
}

function getDiscountedAmount(o) {
  return pickFirstValue(o, [
    'discountedAmount',
    'discountedPrice',
    'finalAmount',
    'finalPrice',
    'payableAmount',
    'paidAmount',
    'totalAmount',
    'amountInr',
    'amount',
    'amount_inr',
    'total'
  ])
}

function getCouponCode(o) {
  const coupon = o?.coupon && typeof o.coupon === 'object' ? o.coupon : {}
  return o?.couponCode || o?.appliedCouponCode || coupon?.code || coupon?.couponCode || '-'
}

function formatMoneyValue(amount, currency = 'INR') {
  if (amount === null || typeof amount === 'undefined' || amount === '') return '-'
  const n = Number(amount)
  if (!Number.isFinite(n)) return `${amount} ${currency}`.trim()
  return `${n.toFixed(2)} ${currency}`.trim()
}

function formatOriginalAmount(o) {
  return formatMoneyValue(getOriginalAmount(o), getCurrency(o))
}

function formatDiscountAmount(o) {
  return formatMoneyValue(getDiscountAmount(o), getCurrency(o))
}

function formatDiscountedPrice(o) {
  return formatMoneyValue(getDiscountedAmount(o), getCurrency(o))
}

function getPaymentStatus(o) {
  const status = String(o?.paymentStatus || o?.payment?.status || o?.status || '').toLowerCase()
  if (['paid', 'success', 'successful', 'completed', 'captured'].includes(status)) return 'completed'
  return 'pending'
}

function getOrderStatus(o) {
  const status = String(o?.orderStatus || o?.status || '').toLowerCase()
  if (['completed', 'paid', 'success', 'successful', 'fulfilled'].includes(status)) return 'completed'
  return 'pending'
}

function getOrderDate(o) {
  return o?.orderDate || o?.createdAt || o?.created_at || o?.date || ''
}

function getInvoiceUrl(o) {
  const invoice = o?.invoice && typeof o.invoice === 'object' ? o.invoice : {}
  return o?.invoiceUrl || o?.invoiceURL || o?.downloadInvoiceUrl || o?.invoiceDownloadUrl || invoice?.url || invoice?.downloadUrl || ''
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function Th({ children, align }) {
  return <th className={`px-4 py-3 text-left text-sm font-medium ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
}

function Td({ children, align, mono }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-200 ${align === 'right' ? 'text-right' : ''} ${mono ? 'font-mono' : ''}`}>
      {children || '-'}
    </td>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm text-gray-900 dark:text-gray-100 break-words">{value || '-'}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase()
  const isCompleted = normalized === 'completed'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'}`}>
      {formatStatusLabel(normalized)}
    </span>
  )
}

function InvoiceLink({ order }) {
  const href = getInvoiceUrl(order)
  if (!href) {
    return <span className="text-sm text-gray-400">Not available</span>
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
    >
      Download
    </a>
  )
}

function formatStatusLabel(value) {
  return String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      {title ? <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</div> : null}
      <div className={title ? 'mt-3 space-y-2' : 'space-y-2'}>{children}</div>
    </div>
  )
}

function OrderDetailsView({ order }) {
  if (!order) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        No order details found.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Card title="Order Information">
          <Meta label="Order ID" value={getOrderId(order)} />
          <Meta label="Order Number" value={getOrderNumber(order)} />
          <Meta label="Order Date" value={formatDate(getOrderDate(order))} />
          <Meta label="Order Status" value={<StatusBadge status={getOrderStatus(order)} />} />
        </Card>
        <Card title="Amount">
          <Meta label="Plan Details" value={getPlanName(order)} />
          <Meta label="Original Price" value={formatOriginalAmount(order)} />
          <Meta label="Coupon Code" value={getCouponCode(order)} />
          <Meta label="Discount" value={formatDiscountAmount(order)} />
          <Meta label="Discounted Price" value={formatDiscountedPrice(order)} />
          <Meta label="Mobile" value={getUserMobile(order)} />
          <Meta label="Email" value={getUserEmail(order)} />
        </Card>
      </div>
    </div>
  )
}
