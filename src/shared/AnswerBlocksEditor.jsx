import { useMemo, useRef } from 'react'
import { api, uploadEditorImage } from '../services/api.js'
import { RichEditor } from './RichEditor.jsx'

export function AnswerBlocksEditor({ value = [], onChange }) {
  const dragFromRef = useRef(null)
  const fileRef = useRef(null)

  const blocks = useMemo(() => Array.isArray(value) ? value : [], [value])
  const baseUrl = import.meta.env.VITE_API_BASE_URL || api?.defaults?.baseURL || ''

  const abs = (url) => {
    if (!url) return ''
    const s = String(url)
    if (s.startsWith('http') || s.startsWith('//') || s.startsWith('data:') || s.startsWith('blob:')) return s
    const base = String(baseUrl).replace(/\/+$/, '')
    const path = s.startsWith('/') ? s : `/${s}`
    return base ? `${base}${path}` : s
  }

  const setBlocks = (next) => onChange?.(Array.isArray(next) ? next : [])

  const addParagraph = () => {
    setBlocks([...blocks, { type: 'text', text: '' }])
  }

  const addImage = () => {
    fileRef.current?.click?.()
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await uploadEditorImage(file)
      const payload = (res?.data && typeof res.data === 'object') ? res.data : res
      const url = payload?.url || payload?.imageUrl || payload?.absoluteUrl || payload?.path || payload?.location
      if (!url) throw new Error('Missing image url')
      setBlocks([...blocks, { type: 'image', url }])
    } catch (err) {
      console.error('Block image upload failed', err)
      window.alert('Image upload failed. Please check backend /api/admin/editor-image.')
    }
  }

  const updateBlock = (index, patch) => {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b))
    setBlocks(next)
  }

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const move = (from, to) => {
    if (from === to) return
    if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return
    const copy = [...blocks]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    setBlocks(copy)
  }

  const onDragStart = (index) => (e) => {
    dragFromRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = () => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (index) => (e) => {
    e.preventDefault()
    const from = dragFromRef.current
    dragFromRef.current = null
    if (typeof from !== 'number') return
    move(from, index)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={addParagraph} className="px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-gray-700">
          Add Paragraph
        </button>
        <button type="button" onClick={addImage} className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Add Image
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No blocks yet. Use “Add Paragraph” or “Add Image”.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b, idx) => (
            <div
              key={`${b?.type || 'block'}-${idx}`}
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver(idx)}
              onDrop={onDrop(idx)}
              className="rounded-xl border border-gray-200 p-3 bg-white dark:bg-gray-900/30 dark:border-gray-700"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {b?.type === 'image' ? 'Image' : 'Paragraph'} • Drag to reorder
                </div>
                <button type="button" onClick={() => removeBlock(idx)} className="px-2 py-1 rounded bg-red-600 text-white text-xs">
                  Remove
                </button>
              </div>

              {b?.type === 'image' ? (
                <div className="space-y-2">
                  <input
                    value={b?.url || ''}
                    onChange={(e) => updateBlock(idx, { url: e.target.value })}
                    placeholder="Image URL"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  />
                  {b?.url ? (
                    <img
                      src={abs(b.url)}
                      alt="block"
                      className="max-h-56 object-contain rounded border border-gray-200 dark:border-gray-700"
                    />
                  ) : null}
                </div>
              ) : (
                <RichEditor value={b?.text || ''} onChange={(html) => updateBlock(idx, { text: html })} placeholder="Write paragraph..." />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
