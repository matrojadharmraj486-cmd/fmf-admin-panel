import { useEffect, useState } from 'react'
import { createTestimonial, deleteTestimonial, listTestimonials } from '../services/api.js'

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [location, setLocation] = useState('')
  const [review, setReview] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const res = await listTestimonials()
      setItems(Array.isArray(res) ? res : res?.data || [])
    } catch {
      setItems([])
      setError('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const add = async (e) => {
    e.preventDefault()
    setError('')

    if (!photo) {
      setError('Please choose a photo')
      return
    }
    if (!name.trim()) {
      setError('Please enter name')
      return
    }
    if (!designation.trim()) {
      setError('Please enter designation')
      return
    }
    if (!location.trim()) {
      setError('Please enter location')
      return
    }
    if (!review.trim()) {
      setError('Please enter review')
      return
    }

    try {
      setSaving(true)
      await createTestimonial({
        photo,
        name: name.trim(),
        designation: designation.trim(),
        location: location.trim(),
        review: review.trim()
      })
      setPhoto(null)
      setName('')
      setDesignation('')
      setLocation('')
      setReview('')
      setFileInputKey((k) => k + 1)
      await fetchTestimonials()
    } catch {
      setError('Failed to add testimonial')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    try {
      await deleteTestimonial(id)
      await fetchTestimonials()
    } catch {
      setError('Failed to delete testimonial')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Testimonials</h2>

      <form onSubmit={add} className="grid gap-3 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
          />
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Designation"
            className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
          />
        </div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Review"
          rows={4}
          className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
        />
        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Testimonial'}
          </button>
        </div>
      </form>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No testimonials found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t._id || t.id} className="rounded bg-white dark:bg-gray-800 shadow overflow-hidden">
              <div className="h-40 bg-gray-100 dark:bg-gray-700">
                <img
                  src={t.photo || t.photoUrl || t.image || t.imageUrl}
                  alt={t.name || 'testimonial'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-1">
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {t.designation} {t.location ? `• ${t.location}` : ''}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{t.review}</p>
                <div className="pt-2">
                  <button onClick={() => remove(t._id || t.id)} className="px-3 py-1 rounded bg-red-600 text-white">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
