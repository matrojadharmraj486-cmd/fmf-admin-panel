import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getStructuredQuestionsFiltered,
  api,
  updateStructuredParent,
  updateStructuredSub,
  deleteStructuredParent
} from '../services/api.js'
import { Loader } from '../shared/Loader.jsx'
import { RichEditor } from '../shared/RichEditor.jsx'
import { AnswerBlocksEditor } from '../shared/AnswerBlocksEditor.jsx'

const emptyEditState = {
  open: false,
  pid: null,
  questionHtml: '',
  isDirect: false,
  parentAnswerBlocks: [],
  mainQuestionAnswerBlocks: [],
  subs: []
}

export default function StructuredDetail() {
  const { year, part } = useParams()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editState, setEditState] = useState(emptyEditState)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' })
  const [qotdSavingId, setQotdSavingId] = useState(null)

  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || api?.defaults?.baseURL || ''
  const abs = (url) => {
    if (!url) return ''
    const s = String(url)
    if (s.startsWith('http') || s.startsWith('//') || s.startsWith('data:') || s.startsWith('blob:')) return s
    const base = String(baseUrl).replace(/\/+$/, '')
    const path = s.startsWith('/') ? s : `/${s}`
    return `${base}${path}`
  }

  const answerArrayToHtml = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return ''
    if (arr.length === 1) return arr[0] || ''
    return `<ul>${arr.map((a) => `<li>${a || ''}</li>`).join('')}</ul>`
  }

  const extractQuestionNumber = (val) => {
    if (val === null || typeof val === 'undefined') return null
    const match = String(val).match(/(\d+)/)
    if (!match) return null
    const num = Number.parseInt(match[1], 10)
    return Number.isFinite(num) ? num : null
  }

  const norm = (p) => ({
    id: p?.id || p?._id || String(p?.id || p?._id || ''),
    dbid: p?._id || p?.id || '',
    year: String(p?.year ?? ''),
    part: String(p?.part ?? '').toLowerCase().includes('2') ? 'part2' : 'part1',
    question_text: p?.question_text || p?.questionText || p?.title || '',
    questionId: p?.questionId || p?.question_id || p?.qid || p?.questionNo || p?.question_no || '',
    isDirect: Boolean(p?.isDirect) || (Array.isArray(p?.sub_questions) ? p.sub_questions.length === 0 : false),
    answerType: p?.answerType || (Array.isArray(p?.answerBlocks) || Array.isArray(p?.answer_blocks) ? 'rich' : (p?.answerImage ? 'image' : 'text')),
    answer: Array.isArray(p?.answer) ? p.answer : [],
    answerHtml: answerArrayToHtml(Array.isArray(p?.answer) ? p.answer : []),
    answerImage: abs(p?.answerImage || ''),
    answerBlocks: Array.isArray(p?.answerBlocks) ? p.answerBlocks : Array.isArray(p?.answer_blocks) ? p.answer_blocks : [],
    mainQuestionAnswer: Array.isArray(p?.main_question_answer) ? p.main_question_answer : [],
    mainQuestionAnswerHtml: answerArrayToHtml(Array.isArray(p?.main_question_answer) ? p.main_question_answer : []),
    mainQuestionAnswerBlocks: Array.isArray(p?.mainQuestionAnswerBlocks) ? p.mainQuestionAnswerBlocks : Array.isArray(p?.main_question_answer_blocks) ? p.main_question_answer_blocks : [],
    sub_questions: (Array.isArray(p?.sub_questions) ? p.sub_questions : []).map((s) => ({
      id: s?.id || s?._id || String(s?.id || s?._id || ''),
      subDbid: s?._id || s?.id || '',
      part: String(s?.part ?? ''),
      text: s?.text || s?.title || '',
      answerType: s?.answerType || (Array.isArray(s?.answerBlocks) || Array.isArray(s?.answer_blocks) ? 'rich' : (s?.answerImage ? 'image' : 'text')),
      answer: Array.isArray(s?.answer) ? s.answer : [],
      answerHtml: answerArrayToHtml(Array.isArray(s?.answer) ? s.answer : []),
      answerImage: abs(s?.answerImage || ''),
      answerBlocks: Array.isArray(s?.answerBlocks) ? s.answerBlocks : Array.isArray(s?.answer_blocks) ? s.answer_blocks : []
    }))
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await getStructuredQuestionsFiltered(year, part)
        const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
        const arr = data.map(norm).map((item, index) => ({
          ...item,
          __index: index,
          __qnum: extractQuestionNumber(item.questionId)
        }))
        const hasQnum = arr.some((p) => Number.isFinite(p.__qnum))
        const sorted = hasQnum
          ? [...arr].sort((a, b) => {
            const aHas = Number.isFinite(a.__qnum)
            const bHas = Number.isFinite(b.__qnum)
            if (aHas && bHas) return a.__qnum - b.__qnum
            if (aHas && !bHas) return -1
            if (!aHas && bHas) return 1
            return a.__index - b.__index
          })
          : arr
        const cleaned = sorted.map(({ __index, __qnum, ...rest }) => rest)
        if (mounted) setList(cleaned)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [year, part])

  const editParent = async (id, payload) => {
    await updateStructuredParent(id, payload)
    setList((prev) => prev.map((p) => (p.dbid === id ? { ...p, ...payload } : p)))
  }

  const editSub = async (id, subId, payload) => {
    await updateStructuredSub(id, subId, payload)
    setList((prev) => prev.map((p) => {
      if (p.dbid !== id) return p
      const subs = (p.sub_questions || []).map((s) => {
        if (s.subDbid !== subId) return s
        const next = { ...s, ...payload }
        if (payload.answerType === 'text') next.answerHtml = answerArrayToHtml(payload.answer || [])
        if (payload.answerType === 'image') next.answerImage = abs(payload.answerImage || '')
        if (payload.answerType === 'rich') next.answerBlocks = Array.isArray(payload.answerBlocks) ? payload.answerBlocks : []
        return next
      })
      return { ...p, sub_questions: subs }
    }))
  }

  const removeParent = async (id) => {
    setError('')
    setOk('')
    setDeleting(true)
    try {
      await deleteStructuredParent(id)
      setList((prev) => prev.filter((p) => p.dbid !== id))
      setOk('Deleted')
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteConfirm = (parent) => {
    const text = String(parent?.question_text || '').replace(/<[^>]*>/g, '').trim()
    setDeleteConfirm({
      open: true,
      id: parent?.dbid || parent?.id || null,
      title: text || 'this question'
    })
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ open: false, id: null, title: '' })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    await removeParent(deleteConfirm.id)
    closeDeleteConfirm()
  }

  const htmlToArray = (html) => {
    const container = document.createElement('div')
    container.innerHTML = html || ''
    const items = Array.from(container.querySelectorAll('li')).map((el) => el.innerHTML?.trim()).filter(Boolean)
    const arr = items.length ? items : (container.innerHTML || '').split('<br>').map((t) => t.trim()).filter(Boolean)
    return arr
  }

  const setAsQotd = async (parent) => {
    if (!parent?.dbid) return
    setError('')
    setOk('')
    setQotdSavingId(parent.dbid)
    try {
      await updateStructuredParent(parent.dbid, { QOTD: true })
      setList((prev) => prev.map((p) => (p.dbid === parent.dbid ? { ...p, QOTD: true, qotd: true } : p)))
      setOk('QOTD updated')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to set QOTD')
    } finally {
      setQotdSavingId(null)
    }
  }

  const startEdit = (parent) => {
    const blocksFrom = (item) => {
      if (Array.isArray(item?.answerBlocks) && item.answerBlocks.length) return item.answerBlocks
      if (item?.answerType === 'image' && item?.answerImage) return [{ type: 'image', url: item.answerImage }]
      if (item?.answerHtml) return [{ type: 'text', text: item.answerHtml }]
      return []
    }
    const blocksFromMain = (item) => {
      if (Array.isArray(item?.mainQuestionAnswerBlocks) && item.mainQuestionAnswerBlocks.length) return item.mainQuestionAnswerBlocks
      if (item?.mainQuestionAnswerHtml) return [{ type: 'text', text: item.mainQuestionAnswerHtml }]
      return []
    }
    const blocksFromSub = (sub) => {
      if (Array.isArray(sub?.answerBlocks) && sub.answerBlocks.length) return sub.answerBlocks
      if (sub?.answerType === 'image' && sub?.answerImage) return [{ type: 'image', url: sub.answerImage }]
      if (sub?.answerHtml) return [{ type: 'text', text: sub.answerHtml }]
      return []
    }

    setEditState({
      open: true,
      pid: parent.dbid,
      questionHtml: parent.question_text || '',
      isDirect: Boolean(parent.isDirect) || (parent.sub_questions || []).length === 0,
      parentAnswerBlocks: blocksFrom(parent),
      mainQuestionAnswerBlocks: blocksFromMain(parent),
      subs: (parent.sub_questions || []).map((s) => ({
        sid: s.subDbid || s.id,
        part: s.part || '',
        textHtml: s.text || '',
        answerBlocks: blocksFromSub(s)
      }))
    })
  }

  const closeEdit = () => {
    setEditState(emptyEditState)
  }

  const updateEditSub = (sid, patch) => {
    setEditState((prev) => ({
      ...prev,
      subs: prev.subs.map((s) => (s.sid === sid ? { ...s, ...patch } : s))
    }))
  }

  const saveEdit = async () => {
    if (!editState.pid) return
    setError('')
    setOk('')
    setSaving(true)
    try {
      const parentPayload = { question_text: editState.questionHtml }
      if (editState.isDirect) {
        parentPayload.answerType = 'rich'
        parentPayload.answerBlocks = Array.isArray(editState.parentAnswerBlocks) ? editState.parentAnswerBlocks : []
        parentPayload.answer_blocks = parentPayload.answerBlocks
      } else {
        const blocks = Array.isArray(editState.mainQuestionAnswerBlocks) ? editState.mainQuestionAnswerBlocks : []
        parentPayload.mainQuestionAnswerType = 'rich'
        parentPayload.mainQuestionAnswerBlocks = blocks
        parentPayload.main_question_answer_type = 'rich'
        parentPayload.main_question_answer_blocks = blocks
      }
      await editParent(editState.pid, parentPayload)
      for (const sub of editState.subs) {
        const blocks = Array.isArray(sub.answerBlocks) ? sub.answerBlocks : []
        const payload = { text: sub.textHtml, answerType: 'rich', answerBlocks: blocks, answer_blocks: blocks }
        await editSub(editState.pid, sub.sid, payload)
      }
      setOk('Saved')
      closeEdit()
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Structured | {year} | {String(part).toUpperCase()}</h2>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {ok && <div className="text-green-600 text-sm">{ok}</div>}

      {loading ? <Loader /> : (
        <div className="space-y-4">
          {list.map((parent, pIdx) => (
            <div key={parent.dbid || `${parent.id}-${pIdx}`} className="rounded-xl bg-white dark:bg-gray-800 shadow p-5 space-y-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-lg leading-7">
                    {parent.questionId && <span className="mr-2 text-indigo-700 dark:text-indigo-300">{parent.questionId}.</span>}
                    <span dangerouslySetInnerHTML={{ __html: parent.question_text }} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{parent.year} | {String(parent.part).toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(parent)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Edit</button>
                  <button
                    onClick={() => setAsQotd(parent)}
                    disabled={qotdSavingId === parent.dbid}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {qotdSavingId === parent.dbid ? 'Setting...' : 'Add QOTD'}
                  </button>
                  <button onClick={() => openDeleteConfirm(parent)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
                </div>
              </div>

              <div className="space-y-3">
                {parent.isDirect && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-900/40">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Main Answer | {parent.answerType || 'text'}</div>
                    <div className="mt-2">
                      {(parent.answerType || 'text') === 'text' && Array.isArray(parent.answer) && (
                        <ul className="list-disc ml-5 space-y-1">
                          {parent.answer.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />)}
                        </ul>
                      )}
                      {(parent.answerType || 'text') === 'image' && parent.answerImage && (
                        <img src={parent.answerImage} alt="answer" className="mt-2 max-h-48 object-contain rounded border border-gray-200 dark:border-gray-700" />
                      )}
                      {(parent.answerType || 'text') === 'rich' && Array.isArray(parent.answerBlocks) && parent.answerBlocks.length > 0 && (
                        <div className="space-y-3">
                          {parent.answerBlocks.map((b, idx) => (
                            <div key={`${b?.type || 'block'}-${idx}`}>
                              {b?.type === 'image' ? (
                                b?.url ? <img src={abs(b.url)} alt="answer" className="max-h-56 object-contain rounded border border-gray-200 dark:border-gray-700" /> : null
                              ) : (
                                <div dangerouslySetInnerHTML={{ __html: b?.text || '' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!parent.isDirect && ((Array.isArray(parent.mainQuestionAnswer) && parent.mainQuestionAnswer.length > 0) || (Array.isArray(parent.mainQuestionAnswerBlocks) && parent.mainQuestionAnswerBlocks.length > 0)) && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-900/40">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Main Question Answer</div>
                    <div className="mt-2">
                      {Array.isArray(parent.mainQuestionAnswerBlocks) && parent.mainQuestionAnswerBlocks.length > 0 ? (
                        <div className="space-y-3">
                          {parent.mainQuestionAnswerBlocks.map((b, idx) => (
                            <div key={`${b?.type || 'block'}-${idx}`}>
                              {b?.type === 'image' ? (
                                b?.url ? <img src={abs(b.url)} alt="answer" className="max-h-56 object-contain rounded border border-gray-200 dark:border-gray-700" /> : null
                              ) : (
                                <div dangerouslySetInnerHTML={{ __html: b?.text || '' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : parent.mainQuestionAnswer.length === 1 ? (
                        <div dangerouslySetInnerHTML={{ __html: parent.mainQuestionAnswer[0] || '' }} />
                      ) : (
                        <ul className="list-disc ml-5 space-y-1">
                          {parent.mainQuestionAnswer.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />)}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
                {(parent.sub_questions || []).map((sub, sIdx) => (
                  <div key={`${sub.id}-${sIdx}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium" dangerouslySetInnerHTML={{ __html: sub.text }} />
                        <div className="text-sm text-gray-500 dark:text-gray-400">{String(sub.part).toUpperCase()} | {sub.answerType}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      {sub.answerType === 'text' && Array.isArray(sub.answer) && (
                        <ul className="list-disc ml-5 space-y-1">
                          {sub.answer.map((a, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: a }} />)}
                        </ul>
                      )}
                      {sub.answerType === 'image' && sub.answerImage && (
                        <img src={sub.answerImage} alt="answer" className="mt-2 max-h-48 object-contain rounded border border-gray-200 dark:border-gray-700" />
                      )}
                      {sub.answerType === 'rich' && Array.isArray(sub.answerBlocks) && sub.answerBlocks.length > 0 && (
                        <div className="space-y-3">
                          {sub.answerBlocks.map((b, idx) => (
                            <div key={`${b?.type || 'block'}-${idx}`}>
                              {b?.type === 'image' ? (
                                b?.url ? <img src={abs(b.url)} alt="answer" className="max-h-56 object-contain rounded border border-gray-200 dark:border-gray-700" /> : null
                              ) : (
                                <div dangerouslySetInnerHTML={{ __html: b?.text || '' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
              Are you sure you want to delete this question?
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {deleteConfirm.title}
            </p>
            <div className="flex gap-2 justify-end">
              <button disabled={deleting} onClick={closeDeleteConfirm} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button disabled={deleting} onClick={confirmDelete} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editState.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-5xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="font-semibold text-lg">Edit Question and Answers</div>

            <div className="space-y-2">
              <label className="block text-sm">Question</label>
              <RichEditor value={editState.questionHtml} onChange={(html) => setEditState((s) => ({ ...s, questionHtml: html }))} />
            </div>

            {editState.isDirect && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Direct Answer</div>
                <AnswerBlocksEditor
                  value={editState.parentAnswerBlocks}
                  onChange={(blocks) => setEditState((s) => ({ ...s, parentAnswerBlocks: blocks }))}
                />
              </div>
            )}

            {!editState.isDirect && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Main Question Answer</div>
                <AnswerBlocksEditor
                  value={editState.mainQuestionAnswerBlocks}
                  onChange={(blocks) => setEditState((s) => ({ ...s, mainQuestionAnswerBlocks: blocks }))}
                />
              </div>
            )}

            <div className="space-y-4">
              {editState.subs.map((sub, index) => (
                <div key={sub.sid || index} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <div className="font-medium text-sm text-gray-600 dark:text-gray-300">Sub Question {index + 1}</div>

                  <div className="space-y-2">
                    <label className="block text-sm">Sub Question Text</label>
                    <RichEditor value={sub.textHtml} onChange={(html) => updateEditSub(sub.sid, { textHtml: html })} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm">Answer</label>
                    <AnswerBlocksEditor
                      value={sub.answerBlocks}
                      onChange={(blocks) => updateEditSub(sub.sid, { answerBlocks: blocks })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={closeEdit} className="px-4 py-2 rounded border dark:border-gray-600">Cancel</button>
              <button disabled={saving} onClick={saveEdit} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
