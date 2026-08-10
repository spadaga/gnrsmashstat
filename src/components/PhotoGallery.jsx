import { useState } from 'react'
import { Image as ImageIcon, Settings2, Upload, X } from 'lucide-react'
import Carousel from './Carousel'
import ConfirmDialog from './ConfirmDialog'

const MAX_PHOTOS = 50

export default function PhotoGallery({ photos, onAdd, onDelete, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const atLimit = photos.length >= MAX_PHOTOS

  function handleFiles(e) {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length)
    for (const file of files) {
      const reader = new FileReader()
      reader.onload = () => onAdd(reader.result).catch(() => {})
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Photo Gallery</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <label className={`flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-600 text-white text-xs font-bold uppercase tracking-wide ${atLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-700'}`}>
              <Upload size={13} /> Upload Photo
              <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={atLimit} />
            </label>
            <button onClick={() => setEditing((e) => !e)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border dark:border-slate-600 text-xs font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Settings2 size={13} /> Manage
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{photos.length}/{MAX_PHOTOS} photos</p>
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
              <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setConfirm(p.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 hover:bg-red-600">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Carousel items={photos.map((p) => (
          <div key={p.id} className="aspect-video bg-slate-100 dark:bg-slate-700">
            <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ))} />
      )}
      <ConfirmDialog open={!!confirm} title="Delete this photo?" message="The photo will be permanently deleted."
        confirmLabel="Delete" onConfirm={() => { onDelete(confirm); setConfirm(null) }} onCancel={() => setConfirm(null)} />
    </div>
  )
}