import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import * as api from './lib/api'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import LogMatch from './pages/LogMatch'
import Players from './pages/Players'
import Slots from './pages/Slots'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.getState().then(setData)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function withFeedback(promise, successMessage) {
    setBusy(true)
    return promise
      .then((result) => {
        setToast({ type: 'success', message: successMessage })
        return result
      })
      .catch((err) => {
        setToast({ type: 'error', message: err.message || 'Something went wrong' })
        throw err
      })
      .finally(() => setBusy(false))
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      setData(await withFeedback(api.importAll(json), 'Data imported'))
    } catch {
      setToast({ type: 'error', message: 'Invalid JSON file.' })
    }
    e.target.value = ''
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-slate-400">
        <Loader2 size={20} className="animate-spin" /> Loading…
      </div>
    )
  }

  const actions = {
    addPlayer: (name) => withFeedback(api.addPlayer(name).then((players) => setData((d) => ({ ...d, players }))), 'Player added'),
    deletePlayer: (name) => withFeedback(api.deletePlayer(name).then((players) => setData((d) => ({ ...d, players }))), 'Player removed'),
    addMatch: (match) => withFeedback(api.addMatch(match).then((matches) => setData((d) => ({ ...d, matches }))), 'Match logged'),
    deleteMatch: (id) => withFeedback(api.deleteMatch(id).then((matches) => setData((d) => ({ ...d, matches }))), 'Match deleted'),
    addVideo: (url) => withFeedback(api.addVideo(url).then((videos) => setData((d) => ({ ...d, videos }))), 'Video added'),
    deleteVideo: (index) => withFeedback(api.deleteVideo(index).then((videos) => setData((d) => ({ ...d, videos }))), 'Video removed'),
    addPhoto: (dataUrl) => withFeedback(api.addPhoto(dataUrl).then((photos) => setData((d) => ({ ...d, photos }))), 'Photo uploaded'),
    deletePhoto: (id) => withFeedback(api.deletePhoto(id).then((photos) => setData((d) => ({ ...d, photos }))), 'Photo deleted'),
    addSlot: (slot) => withFeedback(api.addSlot(slot).then((slots) => setData((d) => ({ ...d, slots }))), 'Slot added'),
    updateSlot: (id, updates) => withFeedback(api.updateSlot(id, updates).then((slots) => setData((d) => ({ ...d, slots }))), 'Slot updated'),
    deleteSlot: (id) => withFeedback(api.deleteSlot(id).then((slots) => setData((d) => ({ ...d, slots }))), 'Slot deleted'),
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header page={page} onNavigate={setPage} />

      {busy && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm px-3 py-1.5 rounded-full shadow-lg">
          <Loader2 size={14} className="animate-spin" /> Saving…
        </div>
      )}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-4">
        {page === 'dashboard' && (
          <Dashboard data={data} actions={actions} onNavigate={setPage} onImport={handleImport} />
        )}

        {page === 'log' && <LogMatch players={data.players} actions={actions} onNavigate={setPage} />}

        {page === 'players' && <Players players={data.players} actions={actions} />}

        {page === 'slots' && <Slots slots={data.slots} actions={actions} />}
      </main>
    </div>
  )
}
