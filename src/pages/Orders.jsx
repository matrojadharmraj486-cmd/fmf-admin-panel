import { useEffect, useMemo, useState } from 'react'
import { getOrderById, listOrders } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

const LIMIT = 50
const STATUS_OPTIONS = ['', 'created', 'paid', 'failed', 'refunded']

export default function Orders() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [page, setPage] = useState(1)
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
    limit: LIMIT,
    status: filters.status || '',
    search: filters.search || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    userId: filters.userId || '',
    subscriptionId: filters.subscriptionId || ''
  }), [page, filters])

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

  const titleCount = items.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {titleCount} (page {page}, limit {LIMIT})
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
              <option key={s || 'all'} value={s}>{s ? s : 'All'}</option>
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
                  <Th>Order ID</Th>
                  <Th>User</Th>
                  <Th>Plan</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Paid/Created</Th>
                  <Th>Method</Th>
                  <Th>Receipt</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((o, idx) => (
                  <tr key={getId(o) || `${getOrderId(o)}-${idx}`} className="bg-white dark:bg-gray-800">
                    <Td mono>{getOrderId(o)}</Td>
                    <Td>
                      <div className="font-medium">{getUserName(o)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{getUserEmail(o)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{getUserMobile(o)}</div>
                    </Td>
                    <Td>{getPlanName(o)}</Td>
                    <Td>{formatAmount(o)}</Td>
                    <Td>{getStatus(o)}</Td>
                    <Td>{formatDate(getPaidOrCreatedAt(o))}</Td>
                    <Td>{getMethod(o)}</Td>
                    <Td mono>{getReceipt(o)}</Td>
                    <Td align="right">
                      <button
                        onClick={() => openView(o)}
                        className="rounded bg-gray-900 px-3 py-1 text-white dark:bg-gray-700"
                      >
                        View
                      </button>
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
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{getOrderId(o)}</div>
                    <div className="font-semibold">{getUserName(o)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{getUserEmail(o)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{getUserMobile(o)}</div>
                  </div>
                  <div className="text-sm">{getStatus(o)}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Meta label="Plan" value={getPlanName(o)} />
                  <Meta label="Amount" value={formatAmount(o)} />
                  <Meta label="Paid/Created" value={formatDate(getPaidOrCreatedAt(o))} />
                  <Meta label="Method" value={getMethod(o)} />
                  <Meta label="Receipt" value={getReceipt(o)} />
                </div>
                <button onClick={() => openView(o)} className="w-full rounded bg-gray-900 px-3 py-2 text-white dark:bg-gray-700">
                  View
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">Page {page}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={items.length < LIMIT}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
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
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-xs text-gray-900 dark:bg-gray-900/40 dark:text-gray-100">
                {JSON.stringify(detail.data, null, 2)}
              </pre>
            )}
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

function formatAmount(o) {
  const amount = o?.amountInr ?? o?.amount ?? o?.amount_inr ?? ''
  const currency = o?.currency || 'INR'
  if (amount === null || typeof amount === 'undefined' || amount === '') return '-'
  const n = Number(amount)
  if (!Number.isFinite(n)) return `${amount} ${currency}`.trim()
  return `${n} ${currency}`.trim()
}

function getStatus(o) {
  return String(o?.status || '-')
}

function getPaidOrCreatedAt(o) {
  return o?.paidAt || o?.paid_at || o?.createdAt || o?.created_at || ''
}

function getMethod(o) {
  return o?.method || o?.paymentMethod || o?.gateway || '-'
}

function getReceipt(o) {
  return o?.receipt || o?.receiptId || o?.receipt_id || '-'
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
