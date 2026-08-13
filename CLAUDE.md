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

## Players schema (`{ name, pin? }` objects)

`data/players.json` is an array of objects:

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

- Players **with** a `pin` = **admins** (all write operations).
- Players **without** a `pin` = read-only.
- PIN = last 4 digits of mobile number.
- Old string-array format auto-migrates to objects on first read.

## Admin auth (PIN-first login)

- Site is **read-only by default** for all visitors.
- Click **Admin Login** → type your 4-digit PIN → system finds matching admin →
  shows name with ✅ → logs in automatically after 700 ms.
- Session persisted in `localStorage.adminName` — survives page reload until
  **Logout** is clicked (which clears localStorage).
- What admins can do: log/edit/delete matches, add/delete players, add/delete
  slots/videos/photos, import/export snapshots, restore versions.

`src/lib/admins.js` helpers:
- `getAdmins(players)` — players with a pin
- `findAdminByPin(players, pin)` — lookup by PIN (used by login)
- `verifyPin(players, name, pin)` — verify name+pin
- `playerNames(players)` — extract name strings for forms/ranking

## Dark / Light theme

- Toggle button (Moon/Sun) in Header nav.
- Applies the `dark` CSS class to `<html>` element (Tailwind v4 `@custom-variant dark`).
- Choice saved in `localStorage.theme` (`'dark'` | `'light'`).
- Applied before first React render (top of `App.jsx`) to prevent flash.

## Version history

Every write auto-saves a snapshot (last **3** kept, **one per calendar day**):
- **Local**: `data/history/<YYYY-MM-DD>.json`
- **Vercel**: Blob `state/history/<YYYY-MM-DD>.json`

The snapshot captures the **pre-mutation state** on the **first write of each day** only.
Subsequent writes that day skip snapshotting (start-of-day state is preserved for recovery).

How to check versions:
```js
// In browser console:
fetch('/api/versions').then(r => r.json()).then(console.log)
```
To restore: `POST /api/restore/:date` (date is `YYYY-MM-DD`)
The `VersionsModal` is wired into Header (desktop: History button; mobile: hamburger menu). Labels: Today / Yesterday / Day Before Yesterday.

**Delete bug fix**: Vercel handler now snapshots the pre-mutation state before each write, so deleting a match correctly preserves the pre-delete state in history.

## Local dev storage

- `data/players.json` — `[{ name, pin? }]`
- `data/matches.json` — `[{ id, date, team1:[a,b], team2:[c,d], score1, score2, comment? }]`.
  Scores 0–30, no ties. `comment` optional.
- `data/videos.json` — up to 20 YouTube URL strings.
- `data/photos.json` — index `[{ id, filename }]`.
- `public/photos/<uuid>.<ext>` — actual files, served via Vite static.
- `data/slots.json` — `[{ id, name, time, endDate }]`. `endDate` = `YYYY-MM-DD`.
- `data/history/` — last 5 snapshots.

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/state` | Full app state |
| POST | `/api/players` | Add player `{ name, pin? }` |
| PUT | `/api/players/:name` | Update player name/pin |
| DELETE | `/api/players/:name` | Remove player |
| POST | `/api/matches` | Add match |
| PUT | `/api/matches/:id` | Update match score/comment |
| DELETE | `/api/matches/:id` | Delete match |
| POST | `/api/videos` | Add YouTube URL (max 20) |
| DELETE | `/api/videos/:index` | Remove video |
| POST | `/api/photos` | Upload photo as base64 dataUrl (max 50) |
| DELETE | `/api/photos/:id` | Delete photo |
| POST | `/api/slots` | Add court slot |
| PUT | `/api/slots/:id` | Update slot |
| DELETE | `/api/slots/:id` | Delete slot |
| GET | `/api/export` | Download full JSON snapshot |
| POST | `/api/import` | Restore full snapshot |
| GET | `/api/versions` | List last 5 snapshots |
| POST | `/api/restore/:ts` | Restore a snapshot |

## Vercel setup (one-time)

1. Vercel dashboard → project → **Storage** → **Blob** → connect → redeploy.
2. First load seeds `DEFAULT_PLAYERS` + `DEFAULT_SLOTS`.
3. Auto-migrates legacy formats (4 separate blobs → single blob, string players → objects, missing slots field).

## Ranking

`src/lib/ranking.js`:
- `computeStats(matches, players)` — wins/losses/pointDiff/winRate/played, plus `qualified: boolean`.
  Minimum-4-matches rule: players with `played >= 4` are "qualified" and sorted Win% → Wins → fewer Losses;
  players with 1–3 played are sorted the same way but always listed below qualified players; 0 played = unranked, listed last.
- `filterByPeriod(matches, period)` — keys: `'all'` / `'today'` / `'year'` / `'month'` / `'week'`
- `filterByWeek(matches, which)` — keys: `'current'` / `'last'`. Week starts Sunday. Used by `TopSeeds`.
- `computeDuoStats(matches, a, b)` — head-to-head: `togetherWins`/`togetherLosses` (a & b on the same
  team) plus `aWithoutBWins`/`aWithoutBLosses` (a's record when partnered with anyone but b). Used by
  the Report page's Duo Head-to-Head tab.

## Structure

### `src/App.jsx`
Router (dashboard / log / players / slots). Reads `localStorage.adminName` on
mount to restore session. Reads `localStorage.theme` and applies `dark` class to
`<html>` before render. `toggleDark()` flips class + saves preference.
All 12 actions go through `withFeedback()` → full-screen transparent overlay +
toast on settle.

### `src/components/Header.jsx`
Logo + wordmark + nav pills: Dashboard / Log Match (admin only) / Players / Court Slots / Report.
Moon/Sun theme toggle. Admin Login button (guests) / name badge + Logout (admins).

### `src/components/LoginModal.jsx`
PIN-first: type 4 digits → `findAdminByPin()` → name + ✅ → auto-login 700 ms.

### `src/components/ConfirmDialog.jsx`
Modal confirmation (Trash / AlertTriangle icon). Replaces all `window.confirm`.

### `src/components/VersionsModal.jsx`
Admin-only modal. Lists last 5 snapshots with timestamp, match/player count,
Latest badge, Restore button. Restore triggers ConfirmDialog then `POST /api/restore/:ts`.

### `src/components/SlotsTicker.jsx`
Horizontal auto-scrolling ticker strip on the Dashboard showing court slot names
and days remaining. Items duplicate for seamless loop (`animate-ticker` CSS keyframes).
Red badge if < 10 days. Pauses on hover. Hidden if no slots.
Compact sizing: `py-1` strip height, `text-xs` slot name, `text-[10px]` days badge.

### `src/components/Footer.jsx`
Sticky footer: `© {year} GNR SmashStats. All rights reserved. | 🏸 GNR Team · {today}`.

### `src/pages/Dashboard.jsx`
SlotsTicker → FilterBar → StatCards → TopSeeds → [Leaderboard | MatchList] → [VideoSection | PhotoGallery].
`Leaderboard` gets raw `data.matches`/`data.players` (not pre-filtered) — it owns its own period tabs, independent of the FilterBar period which only drives StatCards/TopSeeds context.

### `src/pages/LogMatch.jsx`
Wraps `MatchForm.jsx`, navigates back to Dashboard on save.

### `src/pages/Report.jsx`
Read-only analytics page (nav: Report). 4 tabs, each with a bar chart (plain div-width bars, no
chart lib) + text list:
- **Duo Head-to-Head**: pick players A & B → wins together, losses with B, and A's wins *without*
  B as partner (`computeDuoStats` in ranking.js).
- **Player Combos**: pick one player → every partner combination they've played, played/wins/losses
  per combo (`computePairStats` filtered to pairs containing that player).
- **Individual Rankings**: `computeStats` ranked by wins, period-filterable (Day/Week/Month/Year/Custom Range).
- **Pair Rankings**: `computePairStats` ranked by wins, same period filter options.

### `src/pages/Players.jsx`
Add/remove players (admin). Shows **Admin** badge for players with a PIN.

### `src/pages/Slots.jsx`
Court slots table. Admin: inline editable cells. Guest: read-only.
Rows within 10 days of `endDate` highlight red. Sorted by `endDate` ascending.
**Time column hidden on mobile** (`hidden sm:table-cell`) to save width; visible from `sm` breakpoint up.

### `src/components/MatchForm.jsx`
**Select dropdowns** (not free text) for all 4 players sourced from the players list.
Each dropdown filters out already-selected players so all 4 are always unique.
Scores: 0–30, no ties. Date: `max=today` (no future dates allowed). Comment optional.

### `src/components/StatCards.jsx`
Total Matches (orange) + Active Players (slate-900). Responds to period filter.

### `src/components/TopSeeds.jsx`
Top pair(s) by win rate, scoped to a week via **This Week / Last Week** toggle (`filterByWeek`) —
independent of the Dashboard period filter, always receives full `data.matches`. Seed #1 = orange card.
**Seed #2 card is hidden on mobile** (`hidden sm:block`) — only Top Seed #1 shows below the `sm` breakpoint.
"View All →" modal lists all pair combos for the selected week. Dark mode supported.

### `src/components/Leaderboard.jsx`
Owns its own period tabs — **Today / Weekly / Monthly / Yearly / Overall** (`filterByPeriod`) — receives
raw `matches`/`players` and computes stats internally, independent of the Dashboard's FilterBar period.
Ranked using `computeStats`'s qualified/partial/unranked ordering (min-4-matches rule).
Rank badge only shown for qualified players (others show "–"). Shows W-L and **played count** per player;
subtitle reads "Needs N more" (partial) or "Unranked" (0 played) for non-qualified rows.

### `src/components/MatchList.jsx`
- **Search box sits above the "Recent Matches" heading**; date range tabs are **Today's Matches
  (default) / Last 30 Days / All Matches / Custom Range**.
- **Head-to-Head filter**: a toggle button (Swords icon) shows/hides 4 player dropdowns
  (Player 1 & 2 vs Player 3 & 4, all unique). When all 4 are chosen the list narrows to matches
  between that exact pair matchup (team sides ignored) and a summary banner shows the record, e.g.
  "A & B lead C & D 3–1" (or tied / no matches yet). Closing the toggle clears the selection.
- Matches **grouped by date** with date headers. Today's header shows **"Today (Aug 10)"** in orange.
  The per-date match-count label is dark/bold (`text-slate-600 dark:text-slate-300`), not faint gray.
- Edit (✏️, admin): inline form with 4 player dropdowns (reassign either team, all-4-unique validated)
  alongside the score inputs; validates scores 0–30, no ties.
- Delete (🗑️, admin): ConfirmDialog + local overlay during in-flight request.
- Edit/Delete are only shown for **today's matches** for regular admins; the PIN-2669 super admin
  (`isSuperAdmin`) can edit/delete matches from any day. Gated by `canModify = isAdmin && (isSuperAdmin || m.date === today)`.
- Receives `players` prop (from `data.players`) for the edit-form dropdowns.
- **Head-to-Head filter**: 4 player dropdowns (Player 1 & 2 vs Player 3 & 4, all unique). When all 4 are
  chosen, the list narrows to matches between that exact pair matchup (team sides ignored) and a summary
  banner shows the record, e.g. "A & B lead C & D 3–1" (or tied / no matches yet). `Clear` resets it.

### `src/components/VideoSection.jsx` / `PhotoGallery.jsx`
Carousel (default) ↔ Manage (admin only). Video max 20, photos max 50.

### `src/components/Carousel.jsx`
Auto-advances every 4 s. Orange active dot.

### `src/components/FilterBar.jsx`
Period pills: **All Time / This Year / This Month / This Week**.
Import + Export visible to admins only.

### `src/lib/api.js`
All mutations return updated resource array. `updateMatch(id, updates)` → `PUT /api/matches/:id`.
`getVersions()` / `restoreVersion(ts)` for version history.

### `src/index.css`
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
.animate-ticker { animation: ticker 30s linear infinite; }
.animate-ticker:hover { animation-play-state: paused; }
```

## Favicon

`public/favicon.svg` — custom badminton racket SVG (orange racket head with string lines, slate handle, orange grip band).

## Known limits

- Admin auth is client-side only — PIN check happens in the browser.
  Do not store sensitive data.
- Vercel Blob is `public` — blob URLs are accessible to anyone.
- Local and Vercel data are independent — use Export/Import to sync.
- Scores: 0–30, no deuce logic.
- `isSuperAdmin` (PIN-2669 admin, Suresh Padaga) computed once in `App.jsx`:
  `data.players.some(p => p.name === adminName && p.pin === '2669')`. Elevated rights over regular admins:
  - `VersionsModal` / History button (passed to `Header` as `canViewHistory`) — desktop nav + mobile menu.
  - Edit/delete any match in `MatchList` regardless of date (regular admins: today's matches only).
- Snapshots are taken **once per day** (pre-mutation), labeled Today / Yesterday / Day Before Yesterday.
- `matches[].loggedAt` ISO timestamp added on creation — `MatchList` sorts newest-first within each day,
  falling back to original array position (later = more recent) for legacy matches without `loggedAt`.
- `computePairStats(matches)` in ranking.js computes wins/losses per 2-player pair combination.
- `TopSeeds` shows top 2 pairs (not individuals), with "View All →" modal for all combinations.
- `PUT /api/players/:name` endpoint added for editing player name/pin (both backends).

## Deploy

Push to `main` — Vercel auto-deploys. Complete Blob store setup first.

---
*CLAUDE.md is updated with every code change to stay in sync.*