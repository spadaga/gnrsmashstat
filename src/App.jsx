import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import * as api from './lib/api'
import { playerNames } from './lib/admins'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import LogMatch from './pages/LogMatch'
import Players from './pages/Players'
import Slots from './pages/Slots'
import LoginModal from './components/LoginModal'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [adminName, setAdminName] = useState(null)   // null = read-only
  const [loginOpen, setLoginOpen] = useState(false)

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

  function handleLogin(name) {
    setAdminName(name)
    setLoginOpen(false)
    setToast({ type: 'success', message: `Welcome, ${name}!` })
  }

  function handleLogout() {
    setAdminName(null)
    setToast({ type: 'success', message: 'Logged out' })
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-slate-400">
        <Loader2 size={20} className="animate-spin" /> Loading…
      </div>
    )
  }

  const isAdmin = !!adminName
  // Player names list (strings) for forms and ranking
  const names = playerNames(data.players)

  const actions = {
    addPlayer: (name) => withFeedback(api.addPlayer(name).then((players) => setData((d) => ({ ...d, players }))), 'Player added'),
    deletePlayer: (name) => withFeedback(api.deletePlayer(name).then((players) => setData((d) => ({ ...d, players }))), 'Player removed'),
    addMatch: (match) => withFeedback(api.addMatch(match).then((matches) => setData((d) => ({ ...d, matches }))), 'Match logged'),
    deleteMatch: (id) => withFeedback(api.deleteMatch(id).then((matches) => setData((d) => ({ ...d, matches }))), 'Match deleted'),
    updateMatch: (id, updates) => withFeedback(api.updateMatch(id, updates).then((matches) => setData((d) => ({ ...d, matches }))), 'Match updated'),
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
      <Header
        page={page}
        onNavigate={setPage}
        isAdmin={isAdmin}
        adminName={adminName}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-6 py-4">
            <Loader2 size={22} className="animate-spin text-orange-600" />
            <span className="text-sm font-semibold text-slate-700">Saving…</span>
          </div>
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
          <Dashboard data={{ ...data, players: names }} actions={actions} onNavigate={setPage} onImport={handleImport} isAdmin={isAdmin} />
        )}
        {page === 'log' && isAdmin && (
          <LogMatch players={names} actions={actions} onNavigate={setPage} />
        )}
        {page === 'players' && (
          <Players players={data.players} actions={actions} isAdmin={isAdmin} />
        )}
        {page === 'slots' && (
          <Slots slots={data.slots} actions={actions} isAdmin={isAdmin} />
        )}
      </main>

      <LoginModal
        open={loginOpen}
        players={data.players}
        onLogin={handleLogin}
        onClose={() => setLoginOpen(false)}
      />
    </div>
  )
}
