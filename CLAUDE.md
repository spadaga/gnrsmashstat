# Badminton Results Tracker

React + Vite + Tailwind v4 frontend, backed by a tiny local JSON-file
"backend" — a Vite middleware plugin (`server/apiPlugin.js`), no separate
process, no database. Everything lives on disk in this project folder.

## Run

```
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview   # production build, still local-file backed
```

## Where data is stored (on disk, in this project folder)

- `data/players.json` — array of player name strings. Seeded with:
  Sanjeev Kumar, Nayeem Abdhullah, Srinivas Padaga, Suresh Padaga,
  Pradeep Raghav, Narendra, Manikyam.
- `data/matches.json` — array of `{ id, date, team1: [a,b], team2: [c,d], score1, score2 }`.
  Doubles only. Score validated 0–21, no ties, in `MatchForm.jsx`.
- `data/videos.json` — array of up to 20 YouTube URL strings.
- `data/photos.json` — index only: `[{ id, filename }]`.
- `public/photos/<uuid>.<ext>` — the actual uploaded photo files (up to 50).
  Served at `/photos/<filename>` for free via Vite's static `public/` dir.

`server/apiPlugin.js` is the only code that touches these files — it's
mounted as Vite middleware (`configureServer` + `configurePreviewServer`),
so both `npm run dev` and `npm run preview` are backed by it. Routes:
`GET /api/state`, `POST/DELETE /api/players[/:name]`,
`POST/DELETE /api/matches[/:id]`, `POST/DELETE /api/videos[/:index]`
(max 20), `POST/DELETE /api/photos[/:id]` (max 50),
`GET /api/export` (downloads full JSON incl. base64 photos),
`POST /api/import` (restores a snapshot, replacing photo files on disk).

`src/lib/api.js` is the only client code that calls these routes — read/write
through it, don't `fetch('/api/...')` elsewhere.

## Ranking

`src/lib/ranking.js`:
- `computeStats(matches, players)` — wins, losses, point diff, win rate per
  player, summed across every doubles match they appeared in. Sorted by
  wins then point diff — this ordering drives Top Seeds and the Leaderboard.
- `filterByPeriod(matches, 'all' | 'month' | 'week')` — the All Time / This
  Month / This Week filter on the Dashboard (week = Sunday-start).

## Structure (SmashStats branding: orange #ea580c + slate-900, `lucide-react` icons)

- `src/App.jsx` — page router (`dashboard` / `log` / `players`, plain
  `useState`) + loads state once via `api.getState()`, holds it, and hands
  down a bundled `actions` object (`addPlayer`, `deleteMatch`, etc. — each
  calls the API then patches local state from the response).
- `src/components/Header.jsx` — logo + nav pills.
- `src/pages/Dashboard.jsx` — FilterBar, StatCards, TopSeeds, Leaderboard,
  MatchList, VideoSection, PhotoGallery.
- `src/pages/LogMatch.jsx` — wraps `MatchForm.jsx`, returns to Dashboard on save.
- `src/pages/Players.jsx` — add/remove master player list.
- `src/components/MatchForm.jsx` — result entry, player name `<datalist>`
  autocomplete sourced from the players list, auto-adds any new name typed.
- `src/components/{TopSeeds,Leaderboard,MatchList}.jsx` — ranking displays.
- `src/components/{VideoSection,PhotoGallery}.jsx` — auto-sliding
  `Carousel.jsx` in the default view; a "Manage" toggle switches to an
  editable list/grid with add/delete controls. Both enforce their max
  (20 videos, 50 photos) client- and server-side.

## Known limits (accepted for a personal/local tool — revisit if this grows)

- **This is a local dev tool, not a deployable multi-user app.** The file
  API only runs inside Vite's own dev/preview server process. Deploying to
  Vercel (or any static host) serves the built `dist/` with no server behind
  it — `/api/*` calls will 404, since there's no Vite middleware running
  in production and serverless functions can't durably write to disk anyway.
  If you want this hosted and working, it needs an actual backend (e.g. a
  small Node/Express API + real database, or Vercel Postgres/Blob) — ask
  before building that, it's a different architecture from what's here.
- Single-machine only: `data/` and `public/photos/` are local files, not
  synced anywhere. Use Export/Import JSON to move a snapshot between
  machines.
- No auth — anyone with access to this machine/browser can edit everything.

## Deploy

Not currently deployable as-is (see limits above) — this version is scoped
to local use with real file storage, per explicit request. Say the word if
you want a hosted version and we'll pick a real backend for it.
