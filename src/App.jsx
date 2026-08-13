import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import * as api from './lib/api'
import { playerNames } from './lib/admins'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import LogMatch from './pages/LogMatch'
import Players from './pages/Players'
import Slots from './pages/Slots'
import Report from './pages/Report'
import LoginModal from './components/LoginModal'
import VersionsModal from './components/VersionsModal'
import Footer from './components/Footer'

// Initialise dark mode from localStorage before first paint
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') document.documentElement.classList.add('dark')
else document.documentElement.classList.remove('dark')

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [adminName, setAdminName] = useState(() => localStorage.getItem('adminName') || null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => { api.getState().then(setData) }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function toggleDark() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  function withFeedback(promise, successMessage) {
    setBusy(true)
    return promise
      .then((result) => { setToast({ type: 'success', message: successMessage }); return result })
      .catch((err) => { setToast({ type: 'error', message: err.message || 'Something went wrong' }); throw err })
      .finally(() => setBusy(false))
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      setData(await withFeedback(api.importAll(json), 'Data imported'))
    } catch { setToast({ type: 'error', message: 'Invalid JSON file.' }) }
    e.target.value = ''
  }

  function handleLogin(name) {
    setAdminName(name)
    localStorage.setItem('adminName', name)
    setLoginOpen(false)
    setToast({ type: 'success', message: `Welcome, ${name}!` })
  }

  function handleLogout() {
    setAdminName(null)
    localStorage.removeItem('adminName')
    setToast({ type: 'success', message: 'Logged out' })
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
        <Loader2 size={20} className="animate-spin" /> Loading…
      </div>
    )
  }

  const isAdmin = !!adminName
  const names = playerNames(data.players)
  // PIN-2669 admin (Suresh Padaga) gets elevated rights: view history, edit/delete matches from any day.
  const isSuperAdmin = data.players.some((p) => p.name === adminName && p.pin === '2669')

  const actions = {
    addPlayer:    (name)          => withFeedback(api.addPlayer(name).then((players) => setData((d) => ({ ...d, players }))), 'Player added'),
    deletePlayer: (name)          => withFeedback(api.deletePlayer(name).then((players) => setData((d) => ({ ...d, players }))), 'Player removed'),
    updatePlayer: (name, updates) => withFeedback(api.updatePlayer(name, updates).then((players) => setData((d) => ({ ...d, players }))), 'Player updated'),
    addMatch:     (match)         => withFeedback(api.addMatch(match).then((matches) => setData((d) => ({ ...d, matches }))), 'Match logged'),
    deleteMatch:  (id)            => withFeedback(api.deleteMatch(id).then((matches) => setData((d) => ({ ...d, matches }))), 'Match deleted'),
    updateMatch:  (id, updates)   => withFeedback(api.updateMatch(id, updates).then((matches) => setData((d) => ({ ...d, matches }))), 'Match updated'),
    addVideo:     (url)           => withFeedback(api.addVideo(url).then((videos) => setData((d) => ({ ...d, videos }))), 'Video added'),
    deleteVideo:  (index)         => withFeedback(api.deleteVideo(index).then((videos) => setData((d) => ({ ...d, videos }))), 'Video removed'),
    addPhoto:     (dataUrl)       => withFeedback(api.addPhoto(dataUrl).then((photos) => setData((d) => ({ ...d, photos }))), 'Photo uploaded'),
    deletePhoto:  (id)            => withFeedback(api.deletePhoto(id).then((photos) => setData((d) => ({ ...d, photos }))), 'Photo deleted'),
    addSlot:      (slot)          => withFeedback(api.addSlot(slot).then((slots) => setData((d) => ({ ...d, slots }))), 'Slot added'),
    updateSlot:   (id, updates)   => withFeedback(api.updateSlot(id, updates).then((slots) => setData((d) => ({ ...d, slots }))), 'Slot updated'),
    deleteSlot:   (id)            => withFeedback(api.deleteSlot(id).then((slots) => setData((d) => ({ ...d, slots }))), 'Slot deleted'),
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header
        page={page} onNavigate={setPage}
        isAdmin={isAdmin} adminName={adminName} canViewHistory={isSuperAdmin}
        onLoginClick={() => setLoginOpen(true)} onLogout={handleLogout}
        dark={dark} onToggleDark={toggleDark}
        onVersionsClick={() => setVersionsOpen(true)}
      />

      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl px-6 py-4">
            <Loader2 size={22} className="animate-spin text-orange-600" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saving…</span>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 py-3">
        {page === 'dashboard' && (
          <Dashboard data={{ ...data, players: names }} actions={actions} onNavigate={setPage} onImport={handleImport} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
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
        {page === 'report' && (
          <Report data={{ matches: data.matches, players: names }} />
        )}
      </main>

      <Footer />

      <LoginModal open={loginOpen} players={data.players} onLogin={handleLogin} onClose={() => setLoginOpen(false)} />
      <VersionsModal open={versionsOpen} onClose={() => setVersionsOpen(false)} onRestored={(state) => { setData(state); setVersionsOpen(false) }} />
    </div>
  )
}