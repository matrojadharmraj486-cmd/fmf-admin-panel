import React, { useMemo, useRef } from 'react'
import ReactQuill from 'react-quill'
import { api, uploadEditorImage } from '../services/api.js'

export function RichEditor({ value = '', onChange, placeholder = 'Write here...' }) {
  const quillRef = useRef(null)
  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || api?.defaults?.baseURL || ''

  const abs = (url) => {
    if (!url) return ''
    const s = String(url)
    if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('blob:')) return s
    const base = String(baseUrl).replace(/\/+$/, '')
    const path = s.startsWith('/') ? s : `/${s}`
    return base ? `${base}${path}` : s
  }

  const unwrap = (res) => {
    if (!res) return {}
    // backend might respond with { status, message, data: { url } }
    if (res?.data && typeof res.data === 'object' && (res.url == null && res.imageUrl == null && res.absoluteUrl == null)) return res.data
    return res
  }

  const imageHandler = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const res = unwrap(await uploadEditorImage(file))
        const urlRaw = res?.url || res?.imageUrl || res?.absoluteUrl || res?.path || res?.location
        const url = abs(urlRaw)
        if (!url) throw new Error('Missing image url')
        const editor = quillRef.current?.getEditor()
        if (!editor) return
        const range = editor.getSelection(true)
        const insertAt = (range && typeof range.index === 'number') ? range.index : Math.max(0, editor.getLength() - 1)
        editor.insertEmbed(insertAt, 'image', url)
        editor.setSelection(insertAt + 1, 0)
      } catch (e) {
        // Keep it visible during admin work
        console.error('Editor image upload failed', e)
        window.alert('Image upload failed. Please try again or check backend /api/admin/editor-image.')
      }
    }
    input.click()
  }

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'code-block'],
        [{ align: [] }, { color: [] }, { background: [] }],
        ['clean']
      ],
      handlers: { image: imageHandler }
    }
  }), [])
  const formats = useMemo(() => ([
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link', 'image', 'code-block',
    'align', 'color', 'background'
  ]), [])

  return (
    <div className="fmf-rich-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(html) => onChange?.(html === '<p><br></p>' ? '' : html)}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  )
}
