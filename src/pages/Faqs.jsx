import { useEffect, useMemo, useState } from 'react'
import { createFaq, deleteFaq, listFaqsAdmin, updateFaq } from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'

export default function Faqs() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [search, setSearch] = useState('')
  const [createQuestion, setCreateQuestion] = useState('')
  const [createAnswerHtml, setCreateAnswerHtml] = useState('')
  const [createIsActive, setCreateIsActive] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editId, setEditId] = useState('')
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswerHtml, setEditAnswerHtml] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: '', label: '' })

  const toArray = (value) => Array.isArray(value)
    ? value
    : Array.isArray(value?.data)
    ? value.data
    : Array.isArray(value?.data?.data)
    ? value.data.data
    : Array.isArray(value?.faqs)
    ? value.faqs
    : []

  const getId = (f) => f?._id || f?.id || ''
  const getQuestion = (f) => f?.question || f?.title || f?.q || ''
  const getAnswer = (f) => f?.answer || f?.answerHtml || f?.answer_html || f?.a || ''
  const getIsActive = (f) => {
    if (typeof f?.isActive === 'boolean') return f.isActive
    if (typeof f?.active === 'boolean') return f.active
    if (typeof f?.is_active === 'boolean') return f.is_active
    return true
  }
  const getOrder = (f) => f?.order ?? f?.position ?? f?.sortOrder ?? null

  const stripHtml = (html) => {
    const div = document.createElement('div')
    div.innerHTML = html || ''
    return (div.textContent || div.innerText || '').trim()
  }

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listFaqsAdmin()
      setItems(toArray(res))
    } catch (err) {
      setItems([])
      setError(err?.response?.data?.message || 'Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = !q
      ? items
      : items.filter((f) => {
        const hay = `${getQuestion(f)} ${stripHtml(getAnswer(f))}`.toLowerCase()
        return hay.includes(q)
      })
    return [...filtered].sort((a, b) => {
      const ao = getOrder(a)
      const bo = getOrder(b)
      const aHas = Number.isFinite(Number(ao))
      const bHas = Number.isFinite(Number(bo))
      if (aHas && bHas) return Number(ao) - Number(bo)
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      const at = new Date(a?.createdAt || a?.updatedAt || 0).getTime()
      const bt = new Date(b?.createdAt || b?.updatedAt || 0).getTime()
      return at - bt
    })
  }, [items, search])

  const resetCreate = () => {
    setCreateQuestion('')
    setCreateAnswerHtml('')
    setCreateIsActive(true)
  }

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    if (!createQuestion.trim()) return setError('Please enter question')
    if (!createAnswerHtml.trim()) return setError('Please enter answer')
    try {
      setSaving(true)
      await createFaq({ question: createQuestion.trim(), answer: createAnswerHtml, isActive: createIsActive })
      setOk('FAQ added')
      resetCreate()
      await fetchFaqs()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create FAQ')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (f) => {
    setOk('')
    setError('')
    setEditId(getId(f))
    setEditQuestion(getQuestion(f))
    setEditAnswerHtml(getAnswer(f))
    setEditIsActive(getIsActive(f))
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditSaving(false)
    setEditId('')
    setEditQuestion('')
    setEditAnswerHtml('')
    setEditIsActive(true)
  }

  const saveEdit = async () => {
    if (!editId) return
    setError('')
    setOk('')
    if (!editQuestion.trim()) return setError('Please enter question')
    if (!editAnswerHtml.trim()) return setError('Please enter answer')
    try {
      setEditSaving(true)
      await updateFaq(editId, { question: editQuestion.trim(), answer: editAnswerHtml, isActive: editIsActive })
      setOk('Saved')
      closeEdit()
      await fetchFaqs()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update FAQ')
    } finally {
      setEditSaving(false)
    }
  }

  const openDelete = (f) => {
    setOk('')
    setError('')
    setDeleteConfirm({ open: true, id: getId(f), label: getQuestion(f) || 'this FAQ' })
  }

  const closeDelete = () => setDeleteConfirm({ open: false, id: '', label: '' })

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    setError('')
    setOk('')
    try {
      await deleteFaq(deleteConfirm.id)
      setOk('Deleted')
      closeDelete()
      await fetchFaqs()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete FAQ')
    }
  }

  const toggleActive = async (f) => {
    const id = getId(f)
    if (!id) return
    setError('')
    setOk('')
    try {
      await updateFaq(id, { isActive: !getIsActive(f) })
      setItems((prev) => prev.map((x) => (getId(x) === id ? { ...x, isActive: !getIsActive(f) } : x)))
      setOk('Updated')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">{sorted.length} items</div>
      </div>

      <form onSubmit={onCreate} className="rounded-xl bg-white p-4 shadow space-y-3 dark:bg-gray-800">
        <div className="grid md:grid-cols-3 gap-3 items-start">
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm">Question</label>
            <input
              value={createQuestion}
              onChange={(e) => setCreateQuestion(e.target.value)}
              placeholder="Enter FAQ question"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Visible in App</label>
            <select
              value={createIsActive ? 'yes' : 'no'}
              onChange={(e) => setCreateIsActive(e.target.value === 'yes')}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Answer</label>
          <RichEditor value={createAnswerHtml} onChange={setCreateAnswerHtml} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={resetCreate}
            className="px-4 py-2 rounded border dark:border-gray-600"
          >
            Clear
          </button>
          <button
            disabled={saving}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Adding...' : 'Add FAQ'}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white p-4 shadow flex flex-wrap items-center gap-3 dark:bg-gray-800">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQ"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 md:max-w-md"
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {ok && <div className="text-sm text-green-600">{ok}</div>}

      {loading ? (
        <Loader />
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          No FAQs found.
        </div>
      ) : (
        <div className="grid gap-3">
          {sorted.map((f) => (
            <div key={getId(f) || Math.random()} className="rounded-xl bg-white p-4 shadow space-y-2 dark:bg-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{getQuestion(f) || '-'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getIsActive(f) ? 'Visible in App' : 'Hidden'}{Number.isFinite(Number(getOrder(f))) ? ` • Order: ${getOrder(f)}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(f)}
                    className={`px-3 py-1.5 rounded text-sm ${getIsActive(f) ? 'bg-gray-900 text-white dark:bg-gray-700' : 'border border-gray-300 dark:border-gray-700'}`}
                  >
                    {getIsActive(f) ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(f)}
                    className="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openDelete(f)}
                    className="px-3 py-1.5 rounded text-sm bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3">
                {stripHtml(getAnswer(f)) || '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-md p-5 space-y-4">
            <div className="font-semibold text-lg">Confirm Delete</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete {deleteConfirm.label}?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={closeDelete} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-4xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="font-semibold text-lg">Edit FAQ</div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm">Question</label>
                <input
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm">Visible in App</label>
                <select
                  value={editIsActive ? 'yes' : 'no'}
                  onChange={(e) => setEditIsActive(e.target.value === 'yes')}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm">Answer</label>
              <RichEditor value={editAnswerHtml} onChange={setEditAnswerHtml} />
            </div>

            <div className="flex gap-2 justify-end">
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
        </div>
      )}
    </div>
  )
}
