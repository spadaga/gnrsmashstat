// Vercel serverless backend, backed by Vercel Blob storage instead of local
// files (Vercel's static hosting has no writable/persistent disk). Mirrors
// the route contract of server/apiPlugin.js (the local dev/preview backend)
// so src/lib/api.js works unchanged against either one.
//
// Requires a Blob store connected to this project (Vercel dashboard ->
// Storage -> Create Blob store -> Connect to Project). That injects
// BLOB_READ_WRITE_TOKEN automatically; redeploy after connecting it.
//
// All app state (players/matches/videos/photos index) lives in ONE blob
// (state/data.json) so a page load or CRUD op is a single head+fetch and a
// single put, instead of one round trip per resource.
import { put, del, head } from '@vercel/blob'
import crypto from 'node:crypto'

const MAX_PHOTOS = 50
const MAX_VIDEOS = 20
const STATE_PATH = 'state/data.json'

const DEFAULT_PLAYERS = [
  'Sanjeev Kumar',
  'Nayeem Abdhullah',
  'Srinivas Padaga',
  'Suresh Padaga',
  'Pradeep Raghav',
  'Narendra',
  'Manikyam',
]
const DEFAULT_STATE = { players: DEFAULT_PLAYERS, matches: [], videos: [], photos: [] }

async function fetchBlobJSON(pathname, fallback) {
  try {
    const meta = await head(pathname)
    const res = await fetch(meta.url, { cache: 'no-store' })
    return await res.json()
  } catch {
    return fallback
  }
}

// One-time upgrade path from the earlier per-resource-blob version, so
// existing live data isn't lost when this file switched to a single blob.
async function migrateLegacyState() {
  const [players, matches, videos, photos] = await Promise.all([
    fetchBlobJSON('state/players.json', null),
    fetchBlobJSON('state/matches.json', []),
    fetchBlobJSON('state/videos.json', []),
    fetchBlobJSON('state/photos.json', []),
  ])
  return { players: players || DEFAULT_PLAYERS, matches, videos, photos }
}

async function readState() {
  try {
    const meta = await head(STATE_PATH)
    const res = await fetch(meta.url, { cache: 'no-store' })
    return await res.json()
  } catch {
    const migrated = await migrateLegacyState()
    await writeState(migrated)
    return migrated
  }
}

async function writeState(state) {
  await put(STATE_PATH, JSON.stringify(state), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

function parseDataUrl(dataUrl) {
  const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('Invalid image data')
  return { ext: match[1] === 'jpeg' ? 'jpg' : match[1], mime: match[1], buffer: Buffer.from(match[2], 'base64') }
}

async function savePhotoBlob(dataUrl) {
  const { ext, mime, buffer } = parseDataUrl(dataUrl)
  const id = crypto.randomUUID()
  const blob = await put(`photos/${id}.${ext}`, buffer, {
    access: 'public',
    contentType: `image/${mime}`,
    addRandomSuffix: false,
  })
  return { id, dataUrl: blob.url }
}

export default async function handler(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost')
  const parts = pathname.split('/').filter(Boolean) // ['api', 'state'] or ['api', 'players', 'Name']
  const resource = parts[1]
  const param = parts[2] !== undefined ? decodeURIComponent(parts[2]) : undefined

  try {
    const state = await readState()

    if (resource === 'state' && req.method === 'GET') {
      return res.status(200).json(state)
    }

    if (resource === 'export' && req.method === 'GET') {
      res.setHeader('Content-Disposition', 'attachment; filename="badminton-results.json"')
      return res.status(200).json(state)
    }

    if (resource === 'import' && req.method === 'POST') {
      const body = req.body || {}
      const next = { ...state }
      if (Array.isArray(body.players)) next.players = body.players
      if (Array.isArray(body.matches)) next.matches = body.matches
      if (Array.isArray(body.videos)) next.videos = body.videos.slice(0, MAX_VIDEOS)
      if (Array.isArray(body.photos)) {
        await Promise.all(state.photos.map((p) => del(p.dataUrl).catch(() => {})))
        const index = []
        for (const p of body.photos.slice(0, MAX_PHOTOS)) index.push(await savePhotoBlob(p.dataUrl))
        next.photos = index
      }
      await writeState(next)
      return res.status(200).json(next)
    }

    if (resource === 'players') {
      if (req.method === 'POST') {
        const { name } = req.body || {}
        if (name && !state.players.includes(name)) {
          state.players.push(name)
          await writeState(state)
        }
        return res.status(200).json(state.players)
      }
      if (req.method === 'DELETE') {
        state.players = state.players.filter((p) => p !== param)
        await writeState(state)
        return res.status(200).json(state.players)
      }
    }

    if (resource === 'matches') {
      if (req.method === 'POST') {
        const match = req.body || {}
        state.matches.push({ ...match, id: crypto.randomUUID() })
        await writeState(state)
        return res.status(200).json(state.matches)
      }
      if (req.method === 'DELETE') {
        state.matches = state.matches.filter((m) => m.id !== param)
        await writeState(state)
        return res.status(200).json(state.matches)
      }
    }

    if (resource === 'videos') {
      if (req.method === 'POST') {
        const { url } = req.body || {}
        if (state.videos.length >= MAX_VIDEOS) return res.status(400).json({ error: `Max ${MAX_VIDEOS} videos reached` })
        state.videos.push(url)
        await writeState(state)
        return res.status(200).json(state.videos)
      }
      if (req.method === 'DELETE') {
        state.videos.splice(Number(param), 1)
        await writeState(state)
        return res.status(200).json(state.videos)
      }
    }

    if (resource === 'photos') {
      if (req.method === 'POST') {
        const { dataUrl } = req.body || {}
        if (state.photos.length >= MAX_PHOTOS) return res.status(400).json({ error: `Max ${MAX_PHOTOS} photos reached` })
        state.photos.push(await savePhotoBlob(dataUrl))
        await writeState(state)
        return res.status(200).json(state.photos)
      }
      if (req.method === 'DELETE') {
        const entry = state.photos.find((p) => p.id === param)
        if (entry) await del(entry.dataUrl).catch(() => {})
        state.photos = state.photos.filter((p) => p.id !== param)
        await writeState(state)
        return res.status(200).json(state.photos)
      }
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) })
  }
}
