import { useState } from 'react'
import { Image as ImageIcon, Settings2, Upload, X } from 'lucide-react'
import Carousel from './Carousel'
import ConfirmDialog from './ConfirmDialog'
import { availableGalleryPhotos } from '../lib/photos'

const MAX_PHOTOS = 50
const MAX_DIMENSION = 1600 // px, longest side
// Vercel Serverless Functions hard-cap the request body at 4.5MB — mobile
// camera photos (often 3-8MB) blow past that once base64-encoded (+33%).
// Downscale + recompress client-side so uploads stay well under the limit.
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function dataUrlBytes(dataUrl) {
  return Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
}

// Resize to MAX_DIMENSION and re-encode as JPEG, stepping quality down until
// the result fits MAX_UPLOAD_BYTES. Falls back to the original file's data
// URL if the browser can't decode it (e.g. an unsupported format).
async function prepareUpload(file) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return readAsDataURL(file)
  }
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrlBytes(dataUrl) <= MAX_UPLOAD_BYTES) return dataUrl
  }
  return canvas.toDataURL('image/jpeg', 0.4)
}

export default function PhotoGallery({ photos = [], onAdd, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [failedSources, setFailedSources] = useState(() => new Set())
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const atLimit = photos.length >= MAX_PHOTOS
  const galleryPhotos = availableGalleryPhotos(photos, failedSources)
  const unavailableCount = photos.filter((photo) => !photo.dataUrl || failedSources.has(photo.dataUrl)).length
  const showingArchive = galleryPhotos.some((photo) => photo.archived)

  function markUnavailable(source) {
    setFailedSources((previous) => {
      if (previous.has(source)) return previous
      return new Set([...previous, source])
    })
  }

  async function handleFiles(e) {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length)
    e.target.value = ''
    setUploadError('')
    setUploading(true)
    try {
      for (const file of files) await onAdd(await prepareUpload(file))
    } catch (error) {
      setUploadError(error?.message || 'Photo upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Photo Gallery</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <label className={`flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-600 text-white text-xs font-bold uppercase tracking-wide ${atLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-700'}`}>
              <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload Photo'}
              <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={atLimit || uploading} />
            </label>
            <button onClick={() => setEditing((e) => !e)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border dark:border-slate-600 text-xs font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Settings2 size={13} /> Manage
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{photos.length}/{MAX_PHOTOS} photos</p>
      {uploadError && <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">{uploadError}</p>}
      {unavailableCount > 0 && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300 mb-3">
          {unavailableCount} photo link{unavailableCount === 1 ? ' is' : 's are'} unavailable.
          {showingArchive && ` Showing ${galleryPhotos.length} archived gallery photos instead.`}
          {isAdmin && ' You can manage the unavailable links or upload photos.'}
          <button type="button" onClick={() => setFailedSources(new Set())} className="ml-2 underline font-semibold">
            Retry photo links
          </button>
        </p>
      )}
      {photos.length === 0 ? (
        <div className="aspect-video rounded-xl bg-slate-50 dark:bg-slate-700 border border-dashed dark:border-slate-600 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <ImageIcon size={32} className="mx-auto mb-1 text-slate-300" />
            <p className="text-sm">No photos yet.</p>
            {isAdmin && <p className="text-xs">Upload one to get started.</p>}
          </div>
        </div>
      ) : isAdmin && editing ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
              {!p.dataUrl || failedSources.has(p.dataUrl) ? (
                <div className="w-full h-full flex flex-col gap-2 items-center justify-center text-slate-400 text-xs">
                  <ImageIcon size={24} /> Photo unavailable
                </div>
              ) : <img src={p.dataUrl} alt="Gallery photo" onError={() => markUnavailable(p.dataUrl)} className="w-full h-full object-cover" />}
              <button onClick={() => setConfirm(p.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 hover:bg-red-600">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : galleryPhotos.length > 0 ? (
        <Carousel items={galleryPhotos.map((p, index) => (
          <div key={p.id} className="aspect-video bg-slate-100 dark:bg-slate-700">
            <img src={p.dataUrl} alt={`${p.archived ? 'Archived gallery' : 'Gallery'} photo ${index + 1}`} onError={() => markUnavailable(p.dataUrl)} className="w-full h-full object-cover" />
          </div>
        ))} />
      ) : (
        <div className="aspect-video rounded-xl bg-slate-50 dark:bg-slate-700 flex flex-col gap-2 items-center justify-center text-slate-400">
          <ImageIcon size={32} />
          <p className="text-sm">Photos are currently unavailable.</p>
          {isAdmin && <p className="text-xs">Upload a photo to restore the gallery.</p>}
        </div>
      )}
      <ConfirmDialog open={!!confirm} title="Delete this photo?" message="The photo will be permanently deleted."
        confirmLabel="Delete" onConfirm={() => { onDelete(confirm); setConfirm(null) }} onCancel={() => setConfirm(null)} />
    </div>
  )
}
