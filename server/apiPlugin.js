// Local-only JSON-file backend, mounted as Vite middleware (dev + preview).
// Everything lives under ./data/*.json and ./public/photos/* in this project
// folder — no external database, no cloud storage.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const HISTORY_DIR = path.resolve(process.cwd(), 'data/history')
const PHOTOS_DIR = path.resolve(process.cwd(), 'public/photos')
const MAX_PHOTOS = 50
const MAX_VIDEOS = 20
const MAX_VERSIONS = 3

// Players are stored as { name, pin? } objects.
// Those with a pin are admins; others are read-only.
const DEFAULT_PLAYERS = [
  { name: 'Sanjeev Kumar',   pin: '2682' },
  { name: 'Nayeem Abdhullah', pin: '0492' },
  { name: 'Srinivas Padaga', pin: '0556' },
  { name: 'Suresh Padaga',   pin: '2669' },
  { name: 'Pradeep Raghav',  pin: '8220' },
  { name: 'Narendra',        pin: '1484' },
  { name: 'Manikyam',        pin: '7158' },
  { name: 'Diwakar',         pin: '8610' },
]

fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(HISTORY_DIR, { recursive: true })
fs.mkdirSync(PHOTOS_DIR, { recursive: true })

function readJSON(name, fallback) {
  const file = path.join(DATA_DIR, name)
  if (!fs.existsSync(file)) return fallback
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return fallback
  }
}

function snapshotState() {
  const state = getState()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const todayFile = path.join(HISTORY_DIR, `${today}.json`)
  // Only snapshot once per day — preserve the start-of-day state for recovery
  if (!fs.existsSync(todayFile)) {
    fs.writeFileSync(todayFile, JSON.stringify(state, null, 2))
    // Prune to keep only the last MAX_VERSIONS daily snapshots
    const files = fs.readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.json')).sort()
    files.slice(0, Math.max(0, files.length - MAX_VERSIONS)).forEach((f) =>
      fs.rmSync(path.join(HISTORY_DIR, f), { force: true })
    )
  }
}

function writeJSON(name, value) {
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(value, null, 2))
}

function getPlayers() {
  const players = readJSON('players.json', null)
  if (players) {
    // Migrate old string-array format to object array on first read
    if (players.length > 0 && typeof players[0] === 'string') {
      const migrated = players.map((name) => ({ name }))
      writeJSON('players.json', migrated)
      return migrated
    }
    return players
  }
  writeJSON('players.json', DEFAULT_PLAYERS)
  return DEFAULT_PLAYERS
}

function toPhotoUrl(p) {
  return { id: p.id, dataUrl: `/photos/${p.filename}` }
}

function getState() {
  return {
    players: getPlayers(),
    matches: readJSON('matches.json', []),
    videos: readJSON('videos.json', []),
    photos: readJSON('photos.json', []).map(toPhotoUrl),
    slots: readJSON('slots.json', []),
  }
}

function parseDataUrl(dataUrl) {
  const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('Invalid image data')
  return { ext: match[1] === 'jpeg' ? 'jpg' : match[1], buffer: Buffer.from(match[2], 'base64') }
}

function savePhotoFile(dataUrl) {
  const { ext, buffer } = parseDataUrl(dataUrl)
  const id = crypto.randomUUID()
  const filename = `${id}.${ext}`
  fs.writeFileSync(path.join(PHOTOS_DIR, filename), buffer)
  return { id, filename }
}

function deletePhotoFile(id) {
  const photos = readJSON('photos.json', [])
  const entry = photos.find((p) => p.id === id)
  if (entry) fs.rmSync(path.join(PHOTOS_DIR, entry.filename), { force: true })
  writeJSON('photos.json', photos.filter((p) => p.id !== id))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function sendJSON(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function handleApi(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost')
  const parts = pathname.split('/').filter(Boolean) // ['api', 'players', ...]
  const resource = parts[1]
  const param = parts[2] !== undefined ? decodeURIComponent(parts[2]) : undefined

  try {
    if (resource === 'state' && req.method === 'GET') {
      return sendJSON(res, 200, getState())
    }

    if (resource === 'versions' && req.method === 'GET') {
      const files = fs.existsSync(HISTORY_DIR)
        ? fs.readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.json')).sort().reverse().slice(0, MAX_VERSIONS)
        : []
      const versions = files.map((f) => {
        const ts = f.replace('.json', '')
        try {
          const s = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf-8'))
          return { ts, matchCount: s.matches?.length ?? 0, playerCount: s.players?.length ?? 0 }
        } catch { return { ts, matchCount: null, playerCount: null } }
      })
      return sendJSON(res, 200, versions)
    }

    if (resource === 'restore' && req.method === 'POST') {
      const ts = param
      const file = path.join(HISTORY_DIR, `${ts}.json`)
      if (!fs.existsSync(file)) return sendJSON(res, 404, { error: 'Version not found' })
      const restored = JSON.parse(fs.readFileSync(file, 'utf-8'))
      if (Array.isArray(restored.players)) writeJSON('players.json', restored.players)
      if (Array.isArray(restored.matches)) writeJSON('matches.json', restored.matches)
      if (Array.isArray(restored.videos)) writeJSON('videos.json', restored.videos)
      if (Array.isArray(restored.slots)) writeJSON('slots.json', restored.slots)
      return sendJSON(res, 200, getState())
    }

    if (resource === 'export' && req.method === 'GET') {
      const state = getState()
      const photosIndex = readJSON('photos.json', [])
      const photos = photosIndex.map((p) => {
        const buffer = fs.readFileSync(path.join(PHOTOS_DIR, p.filename))
        const ext = path.extname(p.filename).slice(1)
        return { id: p.id, dataUrl: `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buffer.toString('base64')}` }
      })
      res.setHeader('Content-Disposition', 'attachment; filename="badminton-results.json"')
      return sendJSON(res, 200, { ...state, photos })
    }

    if (resource === 'import' && req.method === 'POST') {
      const body = await readBody(req)
      snapshotState()
      if (Array.isArray(body.players)) writeJSON('players.json', body.players)
      if (Array.isArray(body.matches)) writeJSON('matches.json', body.matches)
      if (Array.isArray(body.videos)) writeJSON('videos.json', body.videos.slice(0, MAX_VIDEOS))
      if (Array.isArray(body.slots)) writeJSON('slots.json', body.slots)

      if (Array.isArray(body.photos)) {
        for (const p of readJSON('photos.json', [])) fs.rmSync(path.join(PHOTOS_DIR, p.filename), { force: true })
        const index = body.photos.slice(0, MAX_PHOTOS).map((p) => savePhotoFile(p.dataUrl))
        writeJSON('photos.json', index)
      }
      return sendJSON(res, 200, getState())
    }

    if (resource === 'players') {
      if (req.method === 'POST') {
        const body = await readBody(req)
        const { name, pin } = body
        const players = getPlayers()
        if (name && !players.find((p) => p.name === name)) {
          snapshotState()
          players.push(pin ? { name, pin } : { name })
          writeJSON('players.json', players)
        }
        return sendJSON(res, 200, players)
      }
      if (req.method === 'DELETE') {
        snapshotState()
        const players = getPlayers().filter((p) => p.name !== param)
        writeJSON('players.json', players)
        return sendJSON(res, 200, players)
      }
      if (req.method === 'PUT') {
        const body = await readBody(req)
        const { name: newName, pin } = body
        const players = getPlayers()
        const idx = players.findIndex((p) => p.name === param)
        if (idx === -1) return sendJSON(res, 404, { error: 'Player not found' })
        snapshotState()
        const existing = players[idx]
        const updated = { name: newName || param }
        // Keep existing pin if not explicitly changing it; allow clearing by passing pin: ''
        if (pin !== undefined) { if (pin) updated.pin = pin }
        else if (existing.pin) updated.pin = existing.pin
        players[idx] = updated
        writeJSON('players.json', players)
        return sendJSON(res, 200, players)
      }
    }

    if (resource === 'matches') {
      if (req.method === 'POST') {
        const match = await readBody(req)
        snapshotState()
        const matches = readJSON('matches.json', [])
        matches.push({ ...match, id: crypto.randomUUID(), loggedAt: new Date().toISOString() })
        writeJSON('matches.json', matches)
        return sendJSON(res, 200, matches)
      }
      if (req.method === 'PUT') {
        const updates = await readBody(req)
        const matches = readJSON('matches.json', []).map((m) =>
          m.id === param ? { ...m, ...updates, id: m.id } : m
        )
        writeJSON('matches.json', matches)
        return sendJSON(res, 200, matches)
      }
      if (req.method === 'DELETE') {
        snapshotState()
        const matches = readJSON('matches.json', []).filter((m) => m.id !== param)
        writeJSON('matches.json', matches)
        return sendJSON(res, 200, matches)
      }
    }

    if (resource === 'videos') {
      if (req.method === 'POST') {
        const { url } = await readBody(req)
        const videos = readJSON('videos.json', [])
        if (videos.length >= MAX_VIDEOS) return sendJSON(res, 400, { error: `Max ${MAX_VIDEOS} videos reached` })
        snapshotState()
        videos.push(url)
        writeJSON('videos.json', videos)
        return sendJSON(res, 200, videos)
      }
      if (req.method === 'DELETE') {
        snapshotState()
        const videos = readJSON('videos.json', [])
        videos.splice(Number(param), 1)
        writeJSON('videos.json', videos)
        return sendJSON(res, 200, videos)
      }
    }

    if (resource === 'slots') {
      if (req.method === 'POST') {
        const slot = await readBody(req)
        snapshotState()
        const slots = readJSON('slots.json', [])
        slots.push({ ...slot, id: crypto.randomUUID() })
        writeJSON('slots.json', slots)
        return sendJSON(res, 200, slots)
      }
      if (req.method === 'PUT') {
        const updates = await readBody(req)
        const slots = readJSON('slots.json', []).map((s) => (s.id === param ? { ...s, ...updates, id: s.id } : s))
        writeJSON('slots.json', slots)
        return sendJSON(res, 200, slots)
      }
      if (req.method === 'DELETE') {
        snapshotState()
        const slots = readJSON('slots.json', []).filter((s) => s.id !== param)
        writeJSON('slots.json', slots)
        return sendJSON(res, 200, slots)
      }
    }

    if (resource === 'photos') {
      if (req.method === 'POST') {
        const { dataUrl } = await readBody(req)
        const photos = readJSON('photos.json', [])
        if (photos.length >= MAX_PHOTOS) return sendJSON(res, 400, { error: `Max ${MAX_PHOTOS} photos reached` })
        snapshotState()
        photos.push(savePhotoFile(dataUrl))
        writeJSON('photos.json', photos)
        return sendJSON(res, 200, photos.map(toPhotoUrl))
      }
      if (req.method === 'DELETE') {
        snapshotState()
        deletePhotoFile(param)
        return sendJSON(res, 200, readJSON('photos.json', []).map(toPhotoUrl))
      }
    }

    return sendJSON(res, 404, { error: 'Not found' })
  } catch (err) {
    return sendJSON(res, 500, { error: err.message || String(err) })
  }
}

export function localJsonApiPlugin() {
  const middleware = (req, res, next) => {
    if (!req.url.startsWith('/api/')) return next()
    handleApi(req, res)
  }
  return {
    name: 'local-json-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
