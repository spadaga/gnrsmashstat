# GNR SmashStats — Badminton Results Tracker

React + Vite + Tailwind v4 frontend. Two interchangeable backends behind the
same `/api/*` contract — `src/lib/api.js` works against either without changes:

- **Local dev/preview**: `server/apiPlugin.js` — Vite middleware, reads/writes
  plain JSON files in `data/` and images in `public/photos/`.
- **Vercel (production)**: `api/handler.js` — serverless function reached via
  `vercel.json` rewrite (`/api/:path* → /api/handler`). All state lives in one
  Vercel Blob (`state/data.json`) so every read/write is a single round-trip.

## Run locally

```
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview
npm run lint     # oxlint
```

## Players schema (NEW — `{ name, pin? }` objects)

`data/players.json` is now an array of **objects**, not plain strings:

```json
[
  { "name": "Sanjeev Kumar",    "pin": "2682" },
  { "name": "Nayeem Abdhullah", "pin": "0492" },
  { "name": "Srinivas Padaga",  "pin": "0556" },
  { "name": "Suresh Padaga",    "pin": "2669" },
  { "name": "Pradeep Raghav",   "pin": "8220" },
  { "name": "Narendra",         "pin": "1484" },
  { "name": "Manikyam",         "pin": "7158" },
  { "name": "Diwakar",          "pin": "8610" }
]
```

- Players **with** a `pin` are **admins** (can add/edit/delete everything).
- Players **without** a `pin` are regular members (read-only access).
- PIN = last 4 digits of that person's mobile number.
- Both backends auto-migrate old string-array format to this object format on
  first read — no manual action needed.

## Admin auth (PIN-first login)

The site is **read-only by default** for all visitors.

To get admin access:
1. Click **Admin Login** in the top-right nav.
2. Type your **4-digit PIN** (last 4 digits of your mobile number).
3. The system matches the PIN against `players` — your name appears and you are
   logged in automatically after 700 ms.
4. Click **Logout** (or refresh) to go back to read-only mode.

What admins can do that guests cannot:
- Log a new match
- Edit a match score (pencil icon per row)
- Delete a match / player / slot / video / photo
- Add a player, slot, video, or photo
- Import / Export the full JSON snapshot
- Restore a previous version

`src/lib/admins.js` helpers:
- `getAdmins(players)` — returns only players with a `pin`
- `findAdminByPin(players, pin)` — finds admin by PIN (used by login)
- `verifyPin(players, name, pin)` — verifies a specific name+pin pair
- `playerNames(players)` — extracts name strings for forms/ranking

## Version history

Every write to the data automatically saves a **snapshot** (up to 5 kept):
- **Local**: snapshots saved as `data/history/<timestamp>.json`; oldest pruned
  automatically when count exceeds 5.
- **Vercel**: snapshots saved as Blob objects under `state/history/<ISO>.json`;
  same pruning logic.

**How to view and restore versions:**
- `GET /api/versions` — returns a JSON array of up to 5 snapshots, newest first:
  ```json
  [{ "ts": "2026-08-10T17-30-00-000Z", "matchCount": 42, "playerCount": 8 }, ...]
  ```
- `POST /api/restore/:ts` — restores the snapshot with that timestamp as the
  current state (does NOT snapshot the current state first, so do this carefully).
- The `VersionsModal` component (admin-only) provides a UI for this — it lists
  all snapshots with timestamps, match/player counts, and a Restore button per row.
  Wire it in `Dashboard.jsx` when you want to expose it in the UI.

**To view versions from the browser console (quick check):**
```js
fetch('/api/versions').then(r => r.json()).then(console.log)
```

## Local dev storage

- `data/players.json` — `[{ name, pin? }]` — see Players schema above.
- `data/matches.json` — `[{ id, date, team1:[a,b], team2:[c,d], score1, score2, comment? }]`.
  Doubles only. Scores 0–21, no ties. `comment` is optional; shown italicised.
- `data/videos.json` — up to 20 YouTube URL strings.
- `data/photos.json` — index `[{ id, filename }]`.
- `public/photos/<uuid>.<ext>` — actual photo files (up to 50), served via Vite static.
  Backend converts index to `[{ id, dataUrl: '/photos/<filename>' }]` before sending.
- `data/slots.json` — `[{ id, name, time, endDate }]`. `endDate` is `YYYY-MM-DD`.
  Days-remaining always computed client-side in `Slots.jsx`.
- `data/history/` — version snapshots (up to 5 newest JSON files).

## API routes

All routes identical on both backends:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Full app state |
| POST | `/api/players` | Add player `{ name, pin? }` |
| DELETE | `/api/players/:name` | Remove player |
| POST | `/api/matches` | Add match |
| PUT | `/api/matches/:id` | Update match score/comment (admin) |
| DELETE | `/api/matches/:id` | Delete match |
| POST | `/api/videos` | Add YouTube URL (max 20) |
| DELETE | `/api/videos/:index` | Remove video |
| POST | `/api/photos` | Upload photo as base64 dataUrl (max 50) |
| DELETE | `/api/photos/:id` | Delete photo |
| POST | `/api/slots` | Add court slot |
| PUT | `/api/slots/:id` | Update slot (name/time/endDate) |
| DELETE | `/api/slots/:id` | Delete slot |
| GET | `/api/export` | Download full JSON snapshot (attachment) |
| POST | `/api/import` | Restore full snapshot |
| GET | `/api/versions` | List up to 5 version snapshots |
| POST | `/api/restore/:ts` | Restore a specific snapshot |

## Vercel setup (one-time)

1. Vercel dashboard → project → **Storage** → **Create Database** → **Blob** →
   connect to this project → auto-injects `BLOB_READ_WRITE_TOKEN`.
2. Redeploy (env vars require a new deploy).
3. First page load seeds `DEFAULT_PLAYERS` + `DEFAULT_SLOTS` from `api/handler.js`.

On Vercel: photos are stored as individual Blobs under `photos/<uuid>.<ext>`.
State blob holds `[{ id, dataUrl: <blob-cdn-url> }]` — `PhotoGallery` uses
`p.dataUrl` the same way on both backends.

Auto-migrations in `api/handler.js`:
- If `state/data.json` missing → migrates four separate legacy blobs.
- If `slots` field missing → backfills `DEFAULT_SLOTS`.
- If `players` are strings → converts to `{ name }` objects, merging any
  matching admin PINs from `DEFAULT_PLAYERS`.

## Ranking

`src/lib/ranking.js`:
- `computeStats(matches, players)` — wins / losses / point diff / win rate per
  player (accepts both string and `{ name, pin? }` objects). Sorted by wins
  then point diff.
- `filterByPeriod(matches, period)` — period values:
  - `'all'` — All Time
  - `'year'` — This Year
  - `'month'` — This Month (same calendar month + year)
  - `'week'` — This Week (Sunday-start)

## Structure

### `src/App.jsx`
Router (`dashboard / log / players / slots`). Loads state once on mount.
Holds `adminName` (null = read-only). Opens `LoginModal` when Admin Login clicked.
All 12 actions (`addPlayer`, `deletePlayer`, `addMatch`, `updateMatch`,
`deleteMatch`, `addVideo`, `deleteVideo`, `addPhoto`, `deletePhoto`,
`addSlot`, `updateSlot`, `deleteSlot`) go through `withFeedback()` which:
- Shows full-screen transparent loading overlay (white card + orange spinner)
- Shows success/error toast on settle

### `src/components/Header.jsx`
Logo + wordmark + nav pills. "Log Match" nav tab hidden for guests.
Shows **Admin Login** button when logged out; admin name badge + **Logout** when in.

### `src/components/LoginModal.jsx`
PIN-first: user types 4 digits → `findAdminByPin()` → name appears with ✅ →
auto-login after 700 ms. No name-pick step.

### `src/components/ConfirmDialog.jsx`
Modern modal confirmation replacing all `window.confirm` calls.
Backdrop + icon (Trash for danger, AlertTriangle for warn) + Cancel + Confirm.
Closes on Escape or backdrop click. Focusses Confirm button on open.

### `src/components/VersionsModal.jsx`
Admin-only modal listing the last 5 snapshots. Each row shows timestamp,
match count, player count, a "Latest" badge on row 0, and a Restore button.
Restore triggers a `ConfirmDialog` then calls `POST /api/restore/:ts`.

### `src/pages/Dashboard.jsx`
FilterBar → StatCards → TopSeeds → [Leaderboard | MatchList] → [VideoSection | PhotoGallery].
Passes `isAdmin` to every child component.

### `src/pages/LogMatch.jsx`
Wraps `MatchForm.jsx`, navigates back to Dashboard on save (admin only).

### `src/pages/Players.jsx`
Add/remove players (admin only for write). Shows **Admin** badge for players
with a PIN. Read-only view lists all players for guests.

### `src/pages/Slots.jsx`
Court-slot table. Admin: inline editable cells (commit on blur), Add form,
Delete button. Guest: read-only display. Rows within 10 days of `endDate`
(including expired) highlight red. Sorted by `endDate` ascending.

### `src/components/MatchForm.jsx`
Match entry form (admin only). `<datalist>` autocomplete from players list.
New names typed are silently auto-added. Optional comment textarea.
Scores validated 0–21, no ties.

### `src/components/MatchList.jsx`
- Independent date-range filter (Last 30 Days / All Matches / Custom Range).
- Matches **grouped by date** with sticky date headers (newest first).
- **Edit score** (✏️, admin only) opens inline `EditScoreForm` — validates and
  calls `PUT /api/matches/:id`.
- **Delete** (🗑️, admin only) shows `ConfirmDialog` then a local transparent
  overlay with "Deleting…" spinner while the request is in flight.

### `src/components/StatCards.jsx`
Total Matches (orange) + Active Players (slate-900). Responds to period filter.

### `src/components/TopSeeds.jsx`
Top 3 players. Seed #1 = orange card. Hidden if no data.

### `src/components/Leaderboard.jsx`
All players ranked by win count. Rank #1 badge is orange.

### `src/components/VideoSection.jsx`
Carousel (default) ↔ Manage toggle (admin only). YouTube watch URLs converted
to embed. Max 20.

### `src/components/PhotoGallery.jsx`
Carousel ↔ Manage grid (admin only). Multi-file upload. Max 50.

### `src/components/Carousel.jsx`
Auto-advances every 4 s. Resets on item count change. Orange dot = active.

### `src/components/FilterBar.jsx`
Period pills: **All Time / This Year / This Month / This Week**.
Import + Export buttons visible to admins only.

### `src/lib/api.js`
Thin fetch wrapper. All mutations return the updated resource array.
`exportAll()` → browser download. `importAll()` → returns full state.
`getVersions()` / `restoreVersion(ts)` for version history.

## Known limits

- Vercel Blob is `public` — blob URLs are accessible to anyone who knows them.
- No server-side auth — PIN check is client-side only. Do not store sensitive data.
- Local and Vercel data are independent — use Export/Import to move snapshots.
- Scores capped 0–21, no deuce logic.
- `VersionsModal` is built but not yet wired into the Dashboard UI — call
  `GET /api/versions` directly or import and mount it to expose it.

## Deploy

Push to `main` — Vercel auto-deploys. Complete the one-time Blob store setup
above first, otherwise every `/api/*` call returns 500.