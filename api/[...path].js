// Vercel serverless backend, backed by Vercel Blob storage instead of local
// files (Vercel's static hosting has no writable/persistent disk). Mirrors
// the route contract of server/apiPlugin.js (the local dev/preview backend)
// so src/lib/api.js works unchanged against either one.
//
// Requires a Blob store connected to this project (Vercel dashboard ->
// Storage -> Create Blob store -> Connect to Project). That injects
// BLOB_READ_WRITE_TOKEN automatically; redeploy after connecting it.
import { put, del, head } from '@vercel/blob'
import crypto from 'node:crypto'

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

async function readJSON(pathname, fallback) {
  try {
    const meta = await head(pathname)
    const res = await fetch(meta.url, { cache: 'no-store' })
    return await res.json()
  } catch {
    return fallback
  }
}

async function writeJSON(pathname, value) {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

async function getPlayers() {
  const players = await readJSON('state/players.json', null)
  if (players) return players
  await writeJSON('state/players.json', DEFAULT_PLAYERS)
  return DEFAULT_PLAYERS
}

async function getState() {
  return {
    players: await getPlayers(),
    matches: await readJSON('state/matches.json', []),
    videos: await readJSON('state/videos.json', []),
    photos: await readJSON('state/photos.json', []),
  }
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
  const parts = (Array.isArray(req.query.path) ? req.query.path : [req.query.path]).filter(Boolean)
  const resource = parts[0]
  const param = parts[1] !== undefined ? decodeURIComponent(parts[1]) : undefined

  try {
    if (resource === 'state' && req.method === 'GET') {
      return res.status(200).json(await getState())
    }

    if (resource === 'export' && req.method === 'GET') {
      res.setHeader('Content-Disposition', 'attachment; filename="badminton-results.json"')
      return res.status(200).json(await getState())
    }

    if (resource === 'import' && req.method === 'POST') {
      const body = req.body || {}
      if (Array.isArray(body.players)) await writeJSON('state/players.json', body.players)
      if (Array.isArray(body.matches)) await writeJSON('state/matches.json', body.matches)
      if (Array.isArray(body.videos)) await writeJSON('state/videos.json', body.videos.slice(0, MAX_VIDEOS))

      if (Array.isArray(body.photos)) {
        const existing = await readJSON('state/photos.json', [])
        await Promise.all(existing.map((p) => del(p.dataUrl).catch(() => {})))
        const index = []
        for (const p of body.photos.slice(0, MAX_PHOTOS)) index.push(await savePhotoBlob(p.dataUrl))
        await writeJSON('state/photos.json', index)
      }
      return res.status(200).json(await getState())
    }

    if (resource === 'players') {
      if (req.method === 'POST') {
        const { name } = req.body || {}
        const players = await getPlayers()
        if (name && !players.includes(name)) {
          players.push(name)
          await writeJSON('state/players.json', players)
        }
        return res.status(200).json(players)
      }
      if (req.method === 'DELETE') {
        const players = (await getPlayers()).filter((p) => p !== param)
        await writeJSON('state/players.json', players)
        return res.status(200).json(players)
      }
    }

    if (resource === 'matches') {
      if (req.method === 'POST') {
        const match = req.body || {}
        const matches = await readJSON('state/matches.json', [])
        matches.push({ ...match, id: crypto.randomUUID() })
        await writeJSON('state/matches.json', matches)
        return res.status(200).json(matches)
      }
      if (req.method === 'DELETE') {
        const matches = (await readJSON('state/matches.json', [])).filter((m) => m.id !== param)
        await writeJSON('state/matches.json', matches)
        return res.status(200).json(matches)
      }
    }

    if (resource === 'videos') {
      if (req.method === 'POST') {
        const { url } = req.body || {}
        const videos = await readJSON('state/videos.json', [])
        if (videos.length >= MAX_VIDEOS) return res.status(400).json({ error: `Max ${MAX_VIDEOS} videos reached` })
        videos.push(url)
        await writeJSON('state/videos.json', videos)
        return res.status(200).json(videos)
      }
      if (req.method === 'DELETE') {
        const videos = await readJSON('state/videos.json', [])
        videos.splice(Number(param), 1)
        await writeJSON('state/videos.json', videos)
        return res.status(200).json(videos)
      }
    }

    if (resource === 'photos') {
      if (req.method === 'POST') {
        const { dataUrl } = req.body || {}
        const photos = await readJSON('state/photos.json', [])
        if (photos.length >= MAX_PHOTOS) return res.status(400).json({ error: `Max ${MAX_PHOTOS} photos reached` })
        photos.push(await savePhotoBlob(dataUrl))
        await writeJSON('state/photos.json', photos)
        return res.status(200).json(photos)
      }
      if (req.method === 'DELETE') {
        const photos = await readJSON('state/photos.json', [])
        const entry = photos.find((p) => p.id === param)
        if (entry) await del(entry.dataUrl).catch(() => {})
        const updated = photos.filter((p) => p.id !== param)
        await writeJSON('state/photos.json', updated)
        return res.status(200).json(updated)
      }
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) })
  }
}
