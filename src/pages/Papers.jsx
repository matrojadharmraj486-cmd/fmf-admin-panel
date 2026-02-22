import { useState } from 'react'

export default function Papers() {
  const [papers, setPapers] = useState([])
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [subject, setSubject] = useState('')
  const [file, setFile] = useState(null)

  const addPaper = (e) => {
    e.preventDefault()
    const id = crypto.randomUUID()
    setPapers((prev) => [...prev, { id, title, year, subject, fileName: file?.name || '' }])
    setTitle(''); setYear(''); setSubject(''); setFile(null)
  }

  const remove = (id) => setPapers((p) => p.filter((x) => x.id !== id))

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Question Papers</h2>
      <form className="grid md:grid-cols-4 gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow" onSubmit={addPaper}>
        <input className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} required />
        <input className="rounded border px-3 py-2 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" />
        <div className="md:col-span-4">
          <button className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700">Add Paper</button>
        </div>
      </form>

      <div className="grid gap-3">
        {papers.map((p) => (
          <div key={p.id} className="p-4 rounded bg-white dark:bg-gray-800 shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{p.subject} • {p.year} {p.fileName ? `• ${p.fileName}` : ''}</div>
            </div>
            <button onClick={() => remove(p.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
