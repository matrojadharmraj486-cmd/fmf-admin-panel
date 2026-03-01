import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { uploadEditorImage } from '../services/api.js'

export function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange?.(editor.getHTML())
    }
  })

  useEffect(() => {
    if (editor && typeof value === 'string' && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  const uploadImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const res = await uploadEditorImage(file)
        const url = res?.url || res?.imageUrl || res?.absoluteUrl
        if (!url) return
        editor?.chain().focus().setImage({ src: url }).run()
      } catch {}
    }
    input.click()
  }

  if (!editor) return null

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={uploadImage}>Image</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().setTextAlign('left').run()}>Left</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().setTextAlign('center').run()}>Center</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().setTextAlign('right').run()}>Right</button>
        <button type="button" className="px-2 py-1 rounded border dark:border-gray-600" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear</button>
      </div>
      <div className="min-h-[160px] rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
