import { useEffect, useState } from 'react'
import { createTestimonial, deleteTestimonial, listTestimonials, updateTestimonial } from '../services/api.js'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Icon } from '@iconify/react'

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Testimonials
        </Typography>
      </Box>

      {/* Add Testimonial Form */}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={add} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Photo</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<Icon icon="mdi:camera-outline" />}
                    sx={{ textTransform: 'none', height: 40 }}
                  >
                    {photo ? (photo.name.length > 18 ? photo.name.slice(0, 18) + '…' : photo.name) : 'Choose Photo'}
                    <input key={fileInputKey} type="file" accept="image/*" hidden onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Designation" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={3}
                  label="Review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Review"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:plus" />}
              >
                {saving ? 'Saving...' : 'Add Testimonial'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Testimonials Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">No testimonials found</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {items.map((t) => (
            <Grid item key={t._id || t.id} xs={12} sm={6} lg={4}>
              <Card sx={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: 160, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={t.photo || t.photoUrl || t.image || t.imageUrl}
                    alt={t.name || 'testimonial'}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </Box>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography fontWeight={600}>{t.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.designation}{t.location ? ` • ${t.location}` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
                    {t.review}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => openEdit(t)}>
                        <Icon icon="mdi:pencil" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => remove(t._id || t.id)}>
                        <Icon icon="mdi:delete" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="md" fullWidth>
        <Box component="form" onSubmit={saveEdit}>
          <DialogTitle>Edit Testimonial</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} alignItems="flex-end" sx={{ pt: 1 }}>
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Photo (optional)</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<Icon icon="mdi:camera-outline" />}
                    sx={{ textTransform: 'none', height: 40 }}
                  >
                    {editPhoto ? (editPhoto.name.length > 16 ? editPhoto.name.slice(0, 16) + '…' : editPhoto.name) : 'Choose Photo'}
                    <input type="file" accept="image/*" hidden onChange={(e) => setEditPhoto(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Designation" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="Designation" />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField size="small" fullWidth label="Location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" />
              </Grid>
              <Grid item xs={12}>
                <TextField size="small" fullWidth multiline rows={3} label="Review" value={editReview} onChange={(e) => setEditReview(e.target.value)} placeholder="Review" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeEdit} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editSaving}
              startIcon={editSaving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {editSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}
