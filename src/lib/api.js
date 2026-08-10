// Thin fetch client for the local JSON-file backend (server/apiPlugin.js).
// All data lives in ./data/*.json and ./public/photos/* on disk.
const BASE = '/api'
const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function req(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Request failed')
  return body
}

export const getState = () => req('/state')

export const addPlayer = (name) => req('/players', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ name }) })
export const deletePlayer = (name) => req(`/players/${encodeURIComponent(name)}`, { method: 'DELETE' })

export const addMatch = (match) => req('/matches', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(match) })
export const deleteMatch = (id) => req(`/matches/${id}`, { method: 'DELETE' })

export const addVideo = (url) => req('/videos', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ url }) })
export const deleteVideo = (index) => req(`/videos/${index}`, { method: 'DELETE' })

export const addPhoto = (dataUrl) => req('/photos', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ dataUrl }) })
export const deletePhoto = (id) => req(`/photos/${id}`, { method: 'DELETE' })

export const addSlot = (slot) => req('/slots', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(slot) })
export const updateSlot = (id, updates) => req(`/slots/${id}`, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(updates) })
export const deleteSlot = (id) => req(`/slots/${id}`, { method: 'DELETE' })

export const exportAll = () => {
  window.location.href = `${BASE}/export`
}

export const importAll = (data) => req('/import', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(data) })

export const getVersions = () => req('/versions')
export const restoreVersion = (ts) => req(`/restore/${encodeURIComponent(ts)}`, { method: 'POST' })
