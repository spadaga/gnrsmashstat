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
  (players/matches/videos/photo index) lives in ONE blob (`state/data.json`)
  so a read or write is a single Blob round trip, not one per resource.
  Note: the bracket catch-all filename convention (`[...path].js`) only
  matched single-segment paths on this non-Next project — that's why the
  explicit rewrite exists instead of relying on filesystem routing alone.

## Run locally

```
npm install
npm run dev      # http://localhost:5173, backed by server/apiPlugin.js + local files
npm run build && npm run preview   # same, against the production build
```

## Local dev storage (on disk, in this project folder)

- `data/players.json` — array of player name strings. Seeded with:
  Sanjeev Kumar, Nayeem Abdhullah, Srinivas Padaga, Suresh Padaga,
  Pradeep Raghav, Narendra, Manikyam.
- `data/matches.json` — array of `{ id, date, team1: [a,b], team2: [c,d], score1, score2 }`.
  Doubles only. Score validated 0–21, no ties, in `MatchForm.jsx`.
- `data/videos.json` — array of up to 20 YouTube URL strings.
- `data/photos.json` — index only: `[{ id, filename }]`.
- `public/photos/<uuid>.<ext>` — the actual uploaded photo files (up to 50).
  Served at `/photos/<filename>` for free via Vite's static `public/` dir.
- `data/slots.json` — court booking / membership rows: `[{ id, name, time, endDate }]`.
  Seeded from real data given at setup. `endDate` is `YYYY-MM-DD`; "Days"
  remaining is never stored — always computed client-side from today's date
  (`daysLeft()` in `Slots.jsx`), so it's correct on whatever day you load it.

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
3. Visit the site — first load seeds the default player list into Blob,
   same as local dev does into `data/players.json`.

Vercel Blob data (`state/data.json`, `photos/*`) is separate from the local
`data/` and `public/photos/` files — the two backends don't sync with each
other. Use Export/Import JSON to move a snapshot between them.

(A version before this one stored players/matches/videos/photos as four
separate blobs. `api/handler.js` migrates that automatically on first read
if `state/data.json` doesn't exist yet — no manual action needed.)

## Ranking

`src/lib/ranking.js`:
- `computeStats(matches, players)` — wins, losses, point diff, win rate per
  player, summed across every doubles match they appeared in. Sorted by
  wins then point diff — this ordering drives Top Seeds and the Leaderboard.
- `filterByPeriod(matches, 'all' | 'month' | 'week')` — the All Time / This
  Month / This Week filter on the Dashboard (week = Sunday-start).

## Structure (SmashStats branding: orange #ea580c + slate-900, `lucide-react` icons)

- `src/App.jsx` — page router (`dashboard` / `log` / `players`, plain
  `useState`) + loads state once via `api.getState()` (spinner shown until
  it resolves), holds it, and hands down a bundled `actions` object
  (`addPlayer`, `deleteMatch`, etc.). Every action goes through
  `withFeedback()`, which shows a "Saving…" badge while in flight and a
  success/error toast when it settles — this is the one place that wires
  up spinner/toast behavior for every CRUD op, not per-component.
- `src/components/Header.jsx` — logo (`public/logo.jpeg`, falls back to an
  icon if the file's missing; hover shows a larger preview via a pure-CSS
  group-hover popover, no JS) + wordmark + "Gentlemen Play Here" caption +
  nav pills + Bhavani's contact number (`tel:` link).
- `src/pages/Dashboard.jsx` — FilterBar, StatCards, TopSeeds, Leaderboard,
  MatchList, VideoSection, PhotoGallery.
- `src/pages/LogMatch.jsx` — wraps `MatchForm.jsx`, returns to Dashboard on save.
- `src/pages/Players.jsx` — add/remove master player list.
- `src/pages/Slots.jsx` — editable court-slot table (name/time/end date).
  Inline `<input>`s commit on blur via `actions.updateSlot`; rows within 10
  days of `endDate` (including already-expired) render red.
- `src/components/MatchForm.jsx` — result entry, player name `<datalist>`
  autocomplete sourced from the players list, auto-adds any new name typed,
  optional comment textarea (shown under the match in `MatchList` if set).
- `src/components/{TopSeeds,Leaderboard,MatchList}.jsx` — ranking displays.
  `MatchList` has its own date range control (Last 30 Days / All Matches /
  Custom Range), independent of the Dashboard-wide period filter.
- `src/components/{VideoSection,PhotoGallery}.jsx` — auto-sliding
  `Carousel.jsx` in the default view; a "Manage" toggle switches to an
  editable list/grid with add/delete controls. Both enforce their max
  (20 videos, 50 photos) client- and server-side.

## Known limits

- Vercel Blob access is `public` — anyone with a blob's URL can view it (no
  auth). Fine for non-sensitive badminton scores/photos; don't put anything
  sensitive in there.
- No login/auth anywhere — anyone with the site URL or this machine can
  edit everything.
- The two backends' data doesn't sync — local file changes don't appear on
  the Vercel deployment and vice versa. Export/Import JSON to move a
  snapshot between them.

## Deploy

Push to `main` — Vercel auto-deploys via the connected GitHub repo. Do the
one-time Blob store setup above first, or every request 500s.
