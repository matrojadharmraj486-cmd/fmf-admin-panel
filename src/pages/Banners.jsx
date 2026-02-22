import { useEffect, useState } from 'react'
import { listBanners, uploadBanner, deleteBanner } from '../services/api.js'

export default function Banners() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await listBanners()
        if (mounted) setItems(data)
      } catch {
        // ignore when backend not ready
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const add = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) return
    try {
      const saved = await uploadBanner(file)
      setItems((prev) => [saved, ...prev])
      setFile(null)
    } catch {
      setError('Failed to upload banner')
    }
  }
  const remove = async (id) => {
    try {
      await deleteBanner(id)
      setItems((prev) => prev.filter((b) => b.id !== id))
    } catch {
      setError('Failed to delete banner')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Banners</h2>
      <form onSubmit={add} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" />
        <button className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700">Upload</button>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((b) => (
            <div key={b.id} className="rounded bg-white dark:bg-gray-800 shadow overflow-hidden">
              <img src={b.url || b.imageUrl} alt="banner" className="w-full h-40 object-cover" />
              <div className="p-2 text-right">
                <button onClick={() => remove(b.id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
