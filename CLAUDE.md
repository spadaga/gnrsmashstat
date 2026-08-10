# Badminton Results Tracker

React + Vite + Tailwind v4 frontend. Two interchangeable backends behind the
same `/api/*` contract — `src/lib/api.js` doesn't know or care which one is
live:

- **Local dev/preview**: `server/apiPlugin.js`, a Vite middleware plugin.
  Real JSON files in this project folder, no database.
- **Vercel (production)**: `api/handler.js`, a Vercel serverless function,
  reached via a `vercel.json` rewrite (`/api/:path* -> /api/handler`). Same
  routes, backed by Vercel Blob storage (Vercel's static hosting has no
  writable disk, so the local file version can't run there). All state
  (players/matches/videos/photos/slots) lives in ONE blob (`state/data.json`)
  so a read or write is a single Blob round trip, not one per resource.
  Note: the bracket catch-all filename convention (`[...path].js`) only
  matched single-segment paths on this non-Next project — that's why the
  explicit rewrite exists instead of relying on filesystem routing alone.

## Run locally

```
npm install
npm run dev      # http://localhost:5173, backed by server/apiPlugin.js + local files
npm run build && npm run preview   # same, against the production build
npm run lint     # oxlint
```

## Local dev storage (on disk, in this project folder)

- `data/players.json` — array of player name strings. Seeded with:
  Sanjeev Kumar, Nayeem Abdhullah, Srinivas Padaga, Suresh Padaga,
  Pradeep Raghav, Narendra, Manikyam.
- `data/matches.json` — array of `{ id, date, team1: [a,b], team2: [c,d], score1, score2, comment? }`.
  Doubles only. Score validated 0–21, no ties, in `MatchForm.jsx`.
  `comment` is optional; shown italicised under the match row in `MatchList`.
- `data/videos.json` — array of up to 20 YouTube URL strings.
- `data/photos.json` — index only: `[{ id, filename }]`.
- `public/photos/<uuid>.<ext>` — the actual uploaded photo files (up to 50).
  Served at `/photos/<filename>` via Vite's static `public/` dir.
  `server/apiPlugin.js` converts the index to `[{ id, dataUrl: '/photos/<filename>' }]`
  before sending to the client; `PhotoGallery` just uses `p.dataUrl` directly.
- `data/slots.json` — court booking / membership rows: `[{ id, name, time, endDate }]`.
  `endDate` is `YYYY-MM-DD`; "Days" remaining is never stored — always
  computed client-side from today's date (`daysLeft()` in `Slots.jsx`), so
  it's correct on whatever day you load it.

Routes (identical on both backends): `GET /api/state`,
`POST/DELETE /api/players[/:name]`, `POST/DELETE /api/matches[/:id]`
(matches take an optional `comment` string), `POST/DELETE /api/videos[/:index]`
(max 20), `POST/DELETE /api/photos[/:id]` (max 50),
`POST/PUT/DELETE /api/slots[/:id]`, `GET /api/export` (downloads full JSON
snapshot), `POST /api/import` (restores a snapshot).

## Vercel setup (one-time, required before the deployed site works)

The serverless function needs a Blob store connected to the project —
without it, every `/api/*` call 500s.

1. Vercel dashboard -> this project -> **Storage** tab -> **Create Database**
   -> **Blob** -> connect it to this project. This auto-injects a
   `BLOB_READ_WRITE_TOKEN` env var.
2. Redeploy (env vars only take effect on a new deployment — trigger one
   from the dashboard, or push any commit).
3. Visit the site — first load seeds the default player list and default
   slots into Blob (same defaults as `DEFAULT_PLAYERS` / `DEFAULT_SLOTS` in
   `api/handler.js`).

Vercel Blob data (`state/data.json`, `photos/*`) is separate from the local
`data/` and `public/photos/` files — the two backends don't sync with each
other. Use Export/Import JSON to move a snapshot between them.

(A version before this one stored players/matches/videos/photos as four
separate blobs. `api/handler.js` migrates that automatically on first read
if `state/data.json` doesn't exist yet — no manual action needed. It also
backfills the `slots` field if it's missing from an older blob.)

### Vercel photo storage

On Vercel, photos are stored as individual Blob objects under `photos/<uuid>.<ext>`
with public access. The state blob holds `[{ id, dataUrl: <blob-cdn-url> }]` —
the `dataUrl` field is a full Blob CDN URL, not a base64 string. `PhotoGallery`
renders it identically to local (`p.dataUrl`), so the component is backend-agnostic.

## Ranking

`src/lib/ranking.js`:
- `computeStats(matches, players)` — wins, losses, point diff, win rate per
  player, summed across every doubles match they appeared in. Players not yet
  in the master list are auto-created in the stats map. Sorted by wins then
  point diff — this ordering drives Top Seeds and the Leaderboard.
- `filterByPeriod(matches, 'all' | 'month' | 'week')` — the All Time / This
  Month / This Week filter on the Dashboard (week = Sunday-start).

## Structure (SmashStats branding: orange #ea580c + slate-900, `lucide-react` icons)

- `src/App.jsx` — page router (`dashboard` / `log` / `players` / `slots`,
  plain `useState`) + loads state once via `api.getState()` (spinner shown
  until it resolves), holds it, and hands down a bundled `actions` object
  (`addPlayer`, `deletePlayer`, `addMatch`, `deleteMatch`, `addVideo`,
  `deleteVideo`, `addPhoto`, `deletePhoto`, `addSlot`, `updateSlot`,
  `deleteSlot`). Every action goes through `withFeedback()`, which shows a
  "Saving…" badge while in flight and a success/error toast when it settles —
  this is the one place that wires up spinner/toast behavior for every CRUD
  op, not per-component. `handleImport` reads a JSON file chosen by the user
  and calls `api.importAll`.
- `src/components/Header.jsx` — logo (`public/logo.jpeg`, falls back to an
  Activity icon if the file is missing; hover shows a larger 192×192 preview
  via a pure-CSS group-hover popover, no JS) + wordmark "GNR SMASHSTATS" +
  "Gentlemen Play Here" caption + nav pills (Dashboard / Log Match / Players /
  Court Slots) + Bhavani's contact number (`tel:7569475439` link).
- `src/pages/Dashboard.jsx` — FilterBar, StatCards, TopSeeds, then a 2-column
  grid: Leaderboard (left) + MatchList (right), followed by a second 2-column
  grid: VideoSection (left) + PhotoGallery (right).
- `src/pages/LogMatch.jsx` — wraps `MatchForm.jsx`, navigates back to
  Dashboard on successful save.
- `src/pages/Players.jsx` — add/remove master player list. Form at the top
  for adding a new name; list below with a trash button per row.
- `src/pages/Slots.jsx` — editable court-slot table (name / time / end date).
  Inline `<input>`s commit on blur via `actions.updateSlot`; rows within 10
  days of `endDate` (including already-expired) highlight red with bold text.
  Sorted by `endDate` ascending. Add form at the top.
- `src/components/MatchForm.jsx` — result entry form. `<datalist>` autocomplete
  for all four player inputs sourced from the players list; any new name typed
  is silently auto-added via `onAddPlayer` before the match is saved. Optional
  comment textarea. Scores validated: whole numbers 0–21, no ties.
- `src/components/StatCards.jsx` — two summary cards: Total Matches (orange bg)
  + Active Players (slate-900 bg). Responds to the Dashboard period filter.
- `src/components/TopSeeds.jsx` — top 3 players by win count/point diff.
  Seed #1 card uses orange bg; seeds #2–3 use white/border. Hidden if no data.
- `src/components/Leaderboard.jsx` — all players ranked, with rank number,
  W-L record, and win rate. Rank #1 badge is orange; others are slate-100.
- `src/components/MatchList.jsx` — independent date range control (Last 30 Days /
  All Matches / Custom Range), sorted newest-first. Winner team bolded with a
  Trophy icon. Latest match gets an orange border. Comment shown italicised.
- `src/components/VideoSection.jsx` — "Manage" toggle switches between carousel
  view and an editable list. `toEmbedUrl()` converts YouTube watch URLs to
  embed URLs. Max 20 videos enforced client- and server-side.
- `src/components/PhotoGallery.jsx` — "Manage" toggle switches between carousel
  and a grid with X-delete buttons. Accepts multiple file uploads at once via
  `<input multiple>`. Max 50 photos enforced client- and server-side.
- `src/components/Carousel.jsx` — generic auto-advancing carousel (default
  4 s interval). Resets to slide 0 when item count changes. Dot indicators
  shown when more than one item; active dot is orange.
- `src/components/FilterBar.jsx` — All Time / This Month / This Week pill
  buttons + Export (triggers `window.location.href` download) + Import
  (hidden file input that triggers `onImport`).
- `src/lib/api.js` — thin fetch client. All mutation functions return the
  updated resource array (players/matches/videos/photos/slots). `exportAll`
  triggers a browser download via `window.location.href`. `importAll` POSTs
  the full snapshot and returns the new full state.

## Known limits

- Vercel Blob access is `public` — anyone with a blob's URL can view it (no
  auth). Fine for non-sensitive badminton scores/photos; don't put anything
  sensitive in there.
- No login/auth anywhere — anyone with the site URL or this machine can
  edit everything.
- The two backends' data doesn't sync — local file changes don't appear on
  the Vercel deployment and vice versa. Export/Import JSON to move a
  snapshot between them.
- Scores are capped at 0–21. No deuce/advantage logic — whatever score is
  entered is accepted as long as it's not a tie.

## Deploy

Push to `main` — Vercel auto-deploys via the connected GitHub repo. Do the
one-time Blob store setup above first, or every request 500s.