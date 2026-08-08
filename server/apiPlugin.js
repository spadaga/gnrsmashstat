// Local-only JSON-file backend, mounted as Vite middleware (dev + preview).
// Everything lives under ./data/*.json and ./public/photos/* in this project
// folder — no external database, no cloud storage.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const PHOTOS_DIR = path.resolve(process.cwd(), 'public/photos')
const MAX_PHOTOS = 50
const MAX_VIDEOS = 20

const DEFAULT_PLAYERS = [
  'Sanjeev Kumar',
  'Nayeem Abdhullah',
  'Srinivas Padaga',
  'Suresh Padaga',
  'Pradeep Raghav',
  'Narendra',
  'Manikyam',
]

fs.mkdirSync(DATA_DIR, { recursive: true })
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

function writeJSON(name, value) {
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(value, null, 2))
}

function getPlayers() {
  const players = readJSON('players.json', null)
  if (players) return players
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
        const { name } = await readBody(req)
        const players = getPlayers()
        if (name && !players.includes(name)) {
          players.push(name)
          writeJSON('players.json', players)
        }
        return sendJSON(res, 200, players)
      }
      if (req.method === 'DELETE') {
        const players = getPlayers().filter((p) => p !== param)
        writeJSON('players.json', players)
        return sendJSON(res, 200, players)
      }
    }

    if (resource === 'matches') {
      if (req.method === 'POST') {
        const match = await readBody(req)
        const matches = readJSON('matches.json', [])
        matches.push({ ...match, id: crypto.randomUUID() })
        writeJSON('matches.json', matches)
        return sendJSON(res, 200, matches)
      }
      if (req.method === 'DELETE') {
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
        videos.push(url)
        writeJSON('videos.json', videos)
        return sendJSON(res, 200, videos)
      }
      if (req.method === 'DELETE') {
        const videos = readJSON('videos.json', [])
        videos.splice(Number(param), 1)
        writeJSON('videos.json', videos)
        return sendJSON(res, 200, videos)
      }
    }

    if (resource === 'slots') {
      if (req.method === 'POST') {
        const slot = await readBody(req)
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
        photos.push(savePhotoFile(dataUrl))
        writeJSON('photos.json', photos)
        return sendJSON(res, 200, photos.map(toPhotoUrl))
      }
      if (req.method === 'DELETE') {
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
