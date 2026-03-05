import React, { useMemo, useRef } from 'react'
import ReactQuill from 'react-quill'
import { uploadEditorImage } from '../services/api.js'

export function RichEditor({ value = '', onChange, placeholder = 'Write here...' }) {
  const quillRef = useRef(null)

  const imageHandler = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const res = await uploadEditorImage(file)
        const url = res?.url || res?.imageUrl || res?.absoluteUrl
        if (!url) return
        const editor = quillRef.current?.getEditor()
        const range = editor?.getSelection(true)
        if (editor && range) editor.insertEmbed(range.index, 'image', url)
      } catch (e) {
        // silent
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
