import { useEffect, useMemo, useState } from 'react'
import { listSupportTickets, updateSupportTicket } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'

const STATUS_OPTIONS = ['open', 'in_progress', 'pending_user', 'resolved', 'closed']
const CATEGORY_OPTIONS = ['']
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'urgent']

const statusBadgeClass = {
  open: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  pending_user: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  closed: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  })
  const [updateForm, setUpdateForm] = useState({
    status: 'open',
    assignedTo: '',
    adminNote: '',
    statusNote: ''
  })

  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || ''

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listSupportTickets()
      setTickets(toArray(res))
    } catch (err) {
      setTickets([])
      setError(err?.response?.data?.message || 'Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(tickets.map((ticket) => getCategory(ticket)).filter(Boolean)))
    return [...CATEGORY_OPTIONS, ...dynamic]
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const byStatus = filters.status ? getStatus(ticket) === filters.status : true
      const byCategory = filters.category ? getCategory(ticket) === filters.category : true
      const byPriority = filters.priority ? getPriority(ticket) === filters.priority : true
      const haystack = [
        getTicketNumber(ticket),
        getSubject(ticket),
        getDescription(ticket)
      ].join(' ').toLowerCase()
      const bySearch = search ? haystack.includes(search) : true
      return byStatus && byCategory && byPriority && bySearch
    })
  }, [tickets, filters])

  const openDetail = (ticket) => {
    setSelectedTicket(ticket)
    setUpdateForm({
      status: getStatus(ticket) || 'open',
      assignedTo: getAssignedToName(ticket),
      adminNote: getAdminNote(ticket),
      statusNote: ''
    })
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedTicket(null)
    setSaving(false)
  }

  const saveTicketUpdate = async (e) => {
    e.preventDefault()
    if (!selectedTicket) return
    const id = getTicketId(selectedTicket)
    if (!id) {
      setError('Unable to update this ticket because it has no id')
      return
    }
    try {
      setSaving(true)
      setError('')
      const payload = {
        status: updateForm.status,
        assignedTo: updateForm.assignedTo,
        adminNote: updateForm.adminNote,
        statusNote: updateForm.statusNote
      }
      const updated = await updateSupportTicket(id, payload)
      const nextTicket = extractTicket(updated) || {
        ...selectedTicket,
        status: updateForm.status,
        assignedTo: updateForm.assignedTo,
        adminNote: updateForm.adminNote
      }
      setTickets((prev) => prev.map((ticket) => (getTicketId(ticket) === id ? nextTicket : ticket)))
      setSelectedTicket(nextTicket)
      setUpdateForm((prev) => ({ ...prev, statusNote: '' }))
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update support ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Support Tickets</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
        </div>
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow dark:bg-gray-800 md:grid-cols-2 xl:grid-cols-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{formatLabel(status)}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Categories</option>
          {categories.filter(Boolean).map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((priority) => (
            <option key={priority} value={priority}>{formatLabel(priority)}</option>
          ))}
        </select>

        <input
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Search ticket no / subject / description"
          className="rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <Loader />
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No support tickets found for the current filters.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 xl:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <HeaderCell>Ticket Number</HeaderCell>
                  <HeaderCell>Subject</HeaderCell>
                  <HeaderCell>Category</HeaderCell>
                  <HeaderCell>Priority</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>User Name</HeaderCell>
                  <HeaderCell>User Email</HeaderCell>
                  <HeaderCell>Created At</HeaderCell>
                  <HeaderCell>Assigned To</HeaderCell>
                  <HeaderCell align="right">Action</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={getTicketId(ticket) || getTicketNumber(ticket)} className="bg-white dark:bg-gray-800">
                    <BodyCell>{getTicketNumber(ticket)}</BodyCell>
                    <BodyCell>{getSubject(ticket)}</BodyCell>
                    <BodyCell>{getCategory(ticket)}</BodyCell>
                    <BodyCell>{formatLabel(getPriority(ticket))}</BodyCell>
                    <BodyCell><StatusBadge status={getStatus(ticket)} /></BodyCell>
                    <BodyCell>{getUserName(ticket)}</BodyCell>
                    <BodyCell>{getUserEmail(ticket)}</BodyCell>
                    <BodyCell>{formatDate(getCreatedAt(ticket))}</BodyCell>
                    <BodyCell>{getAssignedToName(ticket) || '-'}</BodyCell>
                    <BodyCell align="right">
                      <button onClick={() => openDetail(ticket)} className="rounded bg-gray-900 px-3 py-1 text-white dark:bg-gray-700">
                        View
                      </button>
                    </BodyCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 xl:hidden">
            {filteredTickets.map((ticket) => (
              <div key={getTicketId(ticket) || getTicketNumber(ticket)} className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{getTicketNumber(ticket)}</div>
                    <div className="font-semibold">{getSubject(ticket)}</div>
                  </div>
                  <StatusBadge status={getStatus(ticket)} />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                  <MobileMeta label="Category" value={getCategory(ticket)} />
                  <MobileMeta label="Priority" value={formatLabel(getPriority(ticket))} />
                  <MobileMeta label="User" value={getUserName(ticket)} />
                  <MobileMeta label="Email" value={getUserEmail(ticket)} />
                  <MobileMeta label="Assigned To" value={getAssignedToName(ticket) || '-'} />
                  <MobileMeta label="Created" value={formatDate(getCreatedAt(ticket))} />
                </div>
                <div className="mt-4">
                  <button onClick={() => openDetail(ticket)} className="w-full rounded bg-gray-900 px-3 py-2 text-white dark:bg-gray-700">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {detailOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{getTicketNumber(selectedTicket)}</div>
                <h3 className="text-xl font-semibold">{getSubject(selectedTicket)}</h3>
              </div>
              <button type="button" onClick={closeDetail} className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-5">
                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailField label="Category" value={getCategory(selectedTicket)} />
                    <DetailField label="Priority" value={formatLabel(getPriority(selectedTicket))} />
                    <DetailField label="Current Status" value={<StatusBadge status={getStatus(selectedTicket)} />} />
                    <DetailField label="Assigned To" value={getAssignedToName(selectedTicket) || '-'} />
                    <DetailField label="Created Date" value={formatDate(getCreatedAt(selectedTicket))} />
                    <DetailField label="Updated Date" value={formatDate(getUpdatedAt(selectedTicket))} />
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Description</div>
                  <div className="whitespace-pre-wrap text-sm leading-6 text-gray-800 dark:text-gray-100">
                    {getDescription(selectedTicket) || 'No description provided.'}
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Attachment</div>
                  <AttachmentBlock ticket={selectedTicket} baseUrl={baseUrl} />
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status History</div>
                  <StatusTimeline history={getStatusHistory(selectedTicket)} />
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">User Info</div>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Name" value={getUserName(selectedTicket)} />
                    <DetailRow label="Email" value={getUserEmail(selectedTicket)} />
                    <DetailRow label="Phone" value={pickValue(getUser(selectedTicket), ['phone', 'mobile', 'contactNumber']) || '-'} />
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Admin</div>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Name" value={getAssignedToName(selectedTicket) || '-'} />
                    <DetailRow label="Email" value={getAssignedToEmail(selectedTicket) || '-'} />
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Admin Note</div>
                  <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
                    {getAdminNote(selectedTicket) || 'No admin note yet.'}
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Update Ticket</div>
                  <form onSubmit={saveTicketUpdate} className="space-y-3">
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{formatLabel(status)}</option>
                      ))}
                    </select>

                    <input
                      value={updateForm.assignedTo}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                      placeholder="Assigned to"
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    />

                    <textarea
                      value={updateForm.adminNote}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, adminNote: e.target.value }))}
                      placeholder="Admin note"
                      rows={4}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    />

                    <textarea
                      value={updateForm.statusNote}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, statusNote: e.target.value }))}
                      placeholder="Status note"
                      rows={3}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    />

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-60 dark:bg-gray-700"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                </section>
              </div>
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
  return <td className={`px-4 py-3 text-sm ${align === 'right' ? 'text-right' : ''}`}>{children || '-'}</td>
}

function MobileMeta({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div>{value || '-'}</div>
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || '-'}</div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-right text-gray-900 dark:text-gray-100">{value || '-'}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass[normalized] || statusBadgeClass.open}`}>
      {formatLabel(normalized)}
    </span>
  )
}

function AttachmentBlock({ ticket, baseUrl }) {
  const attachment = getAttachment(ticket)
  if (!attachment?.url) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">No attachment uploaded.</div>
  }
  const href = toAbsoluteUrl(attachment.url, baseUrl)
  const lower = href.toLowerCase()
  const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].some((ext) => lower.includes(ext))
  return (
    <div className="space-y-3">
      {isImage ? (
        <img src={href} alt={attachment.name || 'attachment'} className="max-h-64 rounded border border-gray-200 object-contain dark:border-gray-700" />
      ) : null}
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex rounded bg-blue-600 px-3 py-2 text-sm text-white">
        {isImage ? 'Open / Download Attachment' : `Download ${attachment.name || 'Attachment'}`}
      </a>
    </div>
  )
}

function StatusTimeline({ history }) {
  if (!Array.isArray(history) || history.length === 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">No status history available.</div>
  }
  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const status = normalizeStatus(pickValue(entry, ['status', 'toStatus', 'currentStatus']) || 'open')
        const note = pickValue(entry, ['note', 'statusNote', 'message', 'remark'])
        const by = pickValue(entry, ['changedByName', 'updatedByName', 'adminName']) || pickValue(pickValue(entry, ['changedBy', 'updatedBy', 'admin']), ['name', 'fullName', 'email'])
        const changedAt = pickValue(entry, ['createdAt', 'updatedAt', 'changedAt', 'date'])
        return (
          <div key={`${status}-${changedAt || index}`} className="relative pl-6">
            <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            {index !== history.length - 1 && <div className="absolute left-[5px] top-4 h-full w-px bg-gray-200 dark:bg-gray-700" />}
            <div className="space-y-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
              <StatusBadge status={status} />
              <div className="text-sm text-gray-800 dark:text-gray-100">{note || 'No note provided.'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {by ? `By ${by}` : 'Updated'} {changedAt ? `• ${formatDate(changedAt)}` : ''}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.data?.data)) return value.data.data
  if (Array.isArray(value?.tickets)) return value.tickets
  if (Array.isArray(value?.supportTickets)) return value.supportTickets
  return []
}

function extractTicket(value) {
  if (!value) return null
  if (Array.isArray(value?.data)) return value.data[0] || null
  return value?.data || value?.ticket || value?.supportTicket || value
}

function pickValue(source, keys) {
  if (!source || typeof source !== 'object') return ''
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function getTicketId(ticket) {
  return pickValue(ticket, ['_id', 'id'])
}

function getTicketNumber(ticket) {
  return pickValue(ticket, ['ticketNumber', 'ticketNo', 'number', 'code']) || '-'
}

function getSubject(ticket) {
  return pickValue(ticket, ['subject', 'title']) || '-'
}

function getCategory(ticket) {
  return pickValue(ticket, ['category', 'type']) || '-'
}

function getPriority(ticket) {
  return String(pickValue(ticket, ['priority']) || '-').toLowerCase()
}

function normalizeStatus(status) {
  return String(status || 'open').toLowerCase()
}

function getStatus(ticket) {
  return normalizeStatus(pickValue(ticket, ['status']))
}

function getDescription(ticket) {
  return pickValue(ticket, ['description', 'message', 'details']) || ''
}

function getUser(ticket) {
  return pickValue(ticket, ['user', 'createdBy']) || {}
}

function getUserName(ticket) {
  const user = getUser(ticket)
  if (typeof user === 'string') return user
  return pickValue(user, ['name', 'fullName', 'username']) || pickValue(ticket, ['userName']) || '-'
}

function getUserEmail(ticket) {
  const user = getUser(ticket)
  if (typeof user === 'string') return '-'
  return pickValue(user, ['email']) || pickValue(ticket, ['userEmail']) || '-'
}

function getAssignedTo(ticket) {
  return pickValue(ticket, ['assignedTo', 'assignedAdmin', 'admin']) || {}
}

function getAssignedToName(ticket) {
  const assigned = getAssignedTo(ticket)
  if (typeof assigned === 'string') return assigned
  return pickValue(assigned, ['name', 'fullName', 'email']) || ''
}

function getAssignedToEmail(ticket) {
  const assigned = getAssignedTo(ticket)
  if (typeof assigned === 'string') return ''
  return pickValue(assigned, ['email']) || ''
}

function getAdminNote(ticket) {
  return pickValue(ticket, ['adminNote', 'noteForAdmin', 'internalNote']) || ''
}

function getStatusHistory(ticket) {
  const history = pickValue(ticket, ['statusHistory', 'history', 'timeline'])
  return Array.isArray(history) ? history : []
}

function getCreatedAt(ticket) {
  return pickValue(ticket, ['createdAt', 'created_at'])
}

function getUpdatedAt(ticket) {
  return pickValue(ticket, ['updatedAt', 'updated_at'])
}

function getAttachment(ticket) {
  const raw = pickValue(ticket, ['attachment', 'file', 'document'])
  if (typeof raw === 'string') return { url: raw, name: raw.split('/').pop() }
  if (raw && typeof raw === 'object') {
    return {
      url: pickValue(raw, ['url', 'path', 'fileUrl', 'attachmentUrl']),
      name: pickValue(raw, ['name', 'fileName', 'originalName'])
    }
  }
  const url = pickValue(ticket, ['attachmentUrl', 'fileUrl'])
  if (url) return { url, name: url.split('/').pop() }
  return null
}

function toAbsoluteUrl(url, baseUrl) {
  if (!url) return ''
  if (String(url).startsWith('http')) return url
  const base = String(baseUrl || '').replace(/\/+$/, '')
  const path = String(url).startsWith('/') ? url : `/${url}`
  return `${base}${path}`
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatLabel(value) {
  return String(value || '-')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
