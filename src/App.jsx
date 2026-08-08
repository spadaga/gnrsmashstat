import { useEffect, useState } from 'react'
import * as api from './lib/api'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import LogMatch from './pages/LogMatch'
import Players from './pages/Players'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getState().then(setData)
  }, [])

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const json = JSON.parse(await file.text())
      setData(await api.importAll(json))
    } catch {
      alert('Invalid JSON file.')
    }
    e.target.value = ''
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>

  const actions = {
    addPlayer: (name) => api.addPlayer(name).then((players) => setData((d) => ({ ...d, players }))),
    deletePlayer: (name) => api.deletePlayer(name).then((players) => setData((d) => ({ ...d, players }))),
    addMatch: (match) => api.addMatch(match).then((matches) => setData((d) => ({ ...d, matches }))),
    deleteMatch: (id) => api.deleteMatch(id).then((matches) => setData((d) => ({ ...d, matches }))),
    addVideo: (url) => api.addVideo(url).then((videos) => setData((d) => ({ ...d, videos }))),
    deleteVideo: (index) => api.deleteVideo(index).then((videos) => setData((d) => ({ ...d, videos }))),
    addPhoto: (dataUrl) => api.addPhoto(dataUrl).then((photos) => setData((d) => ({ ...d, photos }))),
    deletePhoto: (id) => api.deletePhoto(id).then((photos) => setData((d) => ({ ...d, photos }))),
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header page={page} onNavigate={setPage} />

      <main className="max-w-6xl mx-auto px-4 py-4">
        {page === 'dashboard' && (
          <Dashboard data={data} actions={actions} onNavigate={setPage} onImport={handleImport} />
        )}

        {page === 'log' && <LogMatch players={data.players} actions={actions} onNavigate={setPage} />}

        {page === 'players' && <Players players={data.players} actions={actions} />}
      </main>
    </div>
  )
}
