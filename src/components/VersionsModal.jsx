import { useEffect, useState } from 'react'
import { Clock, RotateCcw, X } from 'lucide-react'
import * as api from '../lib/api'
import ConfirmDialog from './ConfirmDialog'

function formatTs(ts) {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function VersionsModal({ open, onClose, onRestored }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null) // ts string to restore

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.getVersions().then(setVersions).finally(() => setLoading(false))
  }, [open])

  async function doRestore(ts) {
    setConfirm(null)
    setLoading(true)
    try {
      const state = await api.restoreVersion(ts)
      onRestored(state)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-orange-600" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Version History</h3>
              <p className="text-xs text-slate-500">Last 5 snapshots — restore any point</p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : versions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No snapshots yet.</div>
          ) : (
            <div className="space-y-2">
              {versions.map((v, i) => (
                <div
                  key={v.ts}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border hover:border-orange-300 hover:bg-orange-50 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{formatTs(v.ts)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {v.matchCount ?? '—'} matches · {v.playerCount ?? '—'} players
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Latest</span>
                    )}
                    <button
                      onClick={() => setConfirm(v.ts)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition"
                    >
                      <RotateCcw size={13} /> Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Restore this snapshot?"
        message="All current data will be replaced with this version. This cannot be undone."
        confirmLabel="Restore"
        danger={false}
        onConfirm={() => doRestore(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
