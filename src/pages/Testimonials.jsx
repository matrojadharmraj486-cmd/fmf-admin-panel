import { useEffect, useState } from 'react'
import { createTestimonial, deleteTestimonial, listTestimonials, updateTestimonial } from '../services/api.js'

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
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editId, setEditId] = useState('')
  const [editPhoto, setEditPhoto] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesignation, setEditDesignation] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editReview, setEditReview] = useState('')

  const openEdit = (t) => {
    setEditId(t?._id || t?.id || '')
    setEditName(t?.name || '')
    setEditDesignation(t?.designation || '')
    setEditLocation(t?.location || '')
    setEditReview(t?.review || '')
    setEditPhoto(null)
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditSaving(false)
    setEditId('')
    setEditPhoto(null)
    setEditName('')
    setEditDesignation('')
    setEditLocation('')
    setEditReview('')
  }
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

  const saveEdit = async (e) => {
    e.preventDefault()
    setError('')

    if (!editName.trim()) {
      setError('Please enter name')
      return
    }
    if (!editDesignation.trim()) {
      setError('Please enter designation')
      return
    }
    if (!editLocation.trim()) {
      setError('Please enter location')
      return
    }
    if (!editReview.trim()) {
      setError('Please enter review')
      return
    }

    try {
      setEditSaving(true)
      await updateTestimonial(editId, {
        photo: editPhoto,
        name: editName.trim(),
        designation: editDesignation.trim(),
        location: editLocation.trim(),
        review: editReview.trim()
      })
      await fetchTestimonials()
      closeEdit()
    } catch {
      setError('Failed to update testimonial')
    } finally {
      setEditSaving(false)
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
                  <div className="flex items-center gap-2">
  <button onClick={() => openEdit(t)} className="px-3 py-1 rounded bg-blue-600 text-white">
    Edit
  </button>
  <button onClick={() => remove(t._id || t.id)} className="px-3 py-1 rounded bg-red-600 text-white">
    Delete
  </button>
</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={saveEdit} className="bg-white dark:bg-gray-800 rounded-xl shadow w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">Edit Testimonial</div>
              <button type="button" onClick={closeEdit} className="text-gray-500">Close</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditPhoto(e.target.files?.[0] || null)}
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
              />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
              />
              <input
                type="text"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                placeholder="Designation"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
              />
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Location"
                className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
              />
            </div>
            <textarea
              value={editReview}
              onChange={(e) => setEditReview(e.target.value)}
              placeholder="Review"
              rows={4}
              className="rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEdit} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={editSaving} className="px-4 py-2 rounded bg-gray-900 text-white dark:bg-gray-700 disabled:opacity-60">
                {editSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}






