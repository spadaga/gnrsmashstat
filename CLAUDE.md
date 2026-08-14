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
  { "name": "Abdhulla",         "pin": "0492" },
  { "name": "Srinivas Padaga",  "pin": "0556" },
  { "name": "Suresh Padaga",    "pin": "2669" },
  { "name": "HR",               "pin": "8220" },
  { "name": "Narendra",         "pin": "1484" },
  { "name": "Manikyam",         "pin": "7158" },
  { "name": "Diwakar",          "pin": "8610" }
]
```

- Players **with** a `pin` = **admins**. Only the super admin (PIN `2669`, Suresh Padaga) has write
  access though — regular admins can only log a match for **today** (see Admin auth below).
- Players **without** a `pin` = read-only.
- PIN = last 4 digits of mobile number.
- Old string-array format auto-migrates to objects on first read.
- Optional `photo` field: a small downscaled JPEG data URL (`data:image/jpeg;base64,...`), set via
  `Players.jsx`'s avatar picker (super-admin only). Stored inline on the player object in both backends —
  no separate blob/file, unlike match photos — since avatars are capped to 300px/~150KB so the whole
  players array stays small. `PUT /api/players/:name` accepts `photo` the same way it accepts `pin`:
  omit to keep the existing photo, pass a data URL to set it, pass `""` to clear it back to the
  initials-circle fallback. `POST /api/players` also accepts an initial `photo`.
- **Renaming a player cascades into match history**: `PUT /api/players/:name` with a new `name` doesn't
  just rename the player entry — both backends also rewrite every match's `team1`/`team2` array, replacing
  the old name with the new one. Without this, `computeStats`/`computePairStats` (which key purely off the
  name strings stored on each match, not player IDs) would keep the old name alive as an orphaned "ghost"
  player with its own separate stats, split off from the renamed player's history. `Nayeem Abdhullah` →
  `Abdhulla` and `Pradeep Raghav` → `HR` were renamed this way (matching the short names those two already
  went by in `Court Slots`); `DEFAULT_PLAYERS` in both backends was updated to seed the new names too, but
  that only affects a *fresh* deploy/first load — an already-seeded Vercel Blob still has the old names
  baked in and needs the same rename done once via the live Players page (logged in as the super admin) to
  pick up this cascade fix.

## Admin auth (PIN-first login)

- Site is **read-only by default** for all visitors.
- Click **Admin Login** → type your 4-digit PIN → system finds matching admin →
  shows name with ✅ → logs in automatically after 700 ms.
- Session persisted in `localStorage.adminName` — survives page reload until
  **Logout** is clicked (which clears localStorage).
- **Write access is super-admin-only** (PIN `2669`, Suresh Padaga = `isSuperAdmin` in `App.jsx`), with one
  carve-out: any regular admin can log a **new** match dated today (`MatchForm`'s date field is locked to
  today and disabled unless `isSuperAdmin`). Editing/deleting matches, add/delete/edit players, add/edit/
  delete slots/videos/photos, import/export snapshots, and restoring versions are all super-admin-only —
  `isAdmin` alone no longer unlocks any of those UIs (see components below, each now gated on
  `isSuperAdmin` rather than `isAdmin`).

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
| PUT | `/api/players/:name` | Update player name/pin/photo |
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
- `computeStats(matches, players, minMatches = 4)` — wins/losses/pointDiff/winRate/played, plus
  `qualified: boolean`. Players with `played >= minMatches` are "qualified" and sorted Win% → Wins →
  fewer Losses; players below that (but > 0 played) are sorted the same way but always listed below
  qualified players; 0 played = unranked, listed last. `minMatches` defaults to 4 for callers that want
  the standard qualify rule (`Report.jsx`'s Individual Rankings); `Leaderboard` passes `1` instead so a
  single-day view doesn't leave everyone stuck in "needs N more" — see its section below.
- `filterByPeriod(matches, period)` — keys: `'all'` / `'today'` / `'year'` / `'month'` / `'week'`
- `filterByWeek(matches, which)` — keys: `'current'` / `'last'`. Week starts Sunday. Used by `TopSeeds`.
- `computeDuoStats(matches, a, b)` — **teammate** head-to-head: `togetherWins`/`togetherLosses` (a & b on
  the same team) plus `aWithoutBWins`/`aWithoutBLosses` (a's record when partnered with anyone but b).
  Also returns `.matches` — `{ togetherWins, togetherLosses, aWithoutBWins, aWithoutBLosses }`, each the
  actual array of matches behind that count, so the UI can show "what made up this number" on click.
  Used by the Report page's Duo Head-to-Head tab.
- `computeHeadToHead(matches, a, b)` — **individual, any-partner** head-to-head: how `a` and `b` fare when
  directly *opposing* each other on a match, regardless of who else is on either side. Returns
  `{ aWins, bWins, played, matches: { aWins, bWins } }` (again with the backing match arrays). This is
  distinct from `computeDuoStats`' `aWithoutBWins`, which is `a`'s overall record without `b` as a
  teammate — `b` might not even be in that match. Used by the Report page's Duo Head-to-Head tab
  alongside `computeDuoStats` (teammate stats and any-partner opponent stats are shown together, not
  as alternatives).
- `computeTopPairs(matches, minMatches = 4)` — pair ranking for `TopSeeds` **and** `Leaderboard`'s Doubles
  tab: win rate → wins → fewer losses, with the same configurable qualify rule as `computeStats` (pairs
  below `minMatches` games are listed after qualified ones). `TopSeeds` uses the default 4; `Leaderboard`
  passes `1`. Each entry carries a `qualified: boolean` just like `computeStats`, so the same 1-2-2-4
  tie-aware rank computation works unmodified against either. `computePairStats` sorts by raw win count
  instead and has no qualify gate — kept as-is for `Report.jsx`'s wins-based Pair Rankings/Player Combos
  tabs.
- `matchesForPlayer(matches, name)` / `matchesForPair(matches, [a, b])` — filter a match list down to the
  ones a given player (either team) or pair (both on the same team, either side) actually appears in. Used
  throughout `Report.jsx` to drill down from a ranking row/stat tile to the matches behind that number.

## Player avatars

- `src/components/Avatar.jsx` — `<Avatar name photo size className />`. Renders the player's `photo` if
  set, else a colored circle with initials (color deterministically hashed from the name, so a given
  player always gets the same fallback color across sessions/components). Sizes: `xs`/`sm`/`md`/`lg`/`xl`.
- **`Avatar` circles appear in exactly two places: `Players.jsx` and the Log Match dropdowns.**
  `Leaderboard`, `TopSeeds`, `MatchList`, and `Report.jsx` (all four tabs, including match drill-down rows)
  show plain name text only — no avatar, matching how they looked before avatars existed.
- `src/lib/admins.js`'s `photoMap(players)` builds a `{ [name]: photo }` lookup, computed once in `App.jsx`
  and passed only to `LogMatch` → `MatchForm` → `PlayerPicker` (`Players.jsx` gets full player objects
  directly, so it doesn't need this lookup — it reads `p.photo` straight off each player).
- `src/components/PlayerPicker.jsx` — an avatar-aware replacement for a native `<select>` of player names
  (plain `<option>`s can't render an inline `<img>`). A button showing the selected player's `Avatar` +
  name opens a custom listbox of the same for each option; closes on selection or on an outside click.
  Used for `MatchForm`'s 4 team-slot pickers only — `MatchList`'s H2H filter/edit-score dropdowns and
  `Report.jsx`'s player selects are still plain `<select>`s.
- `Players.jsx`'s `PlayerAvatarPicker` doubles the avatar as the upload target (super-admin only, consistent
  with the write-access lockdown above): hovering a player's avatar reveals a camera icon overlay (click to
  pick a file) and, if a photo is set, a small red × to clear it back to the initials circle. Guests/regular
  admins just see the plain `Avatar` (read-only). `prepareAvatar(file)` downscales to
  `MAX_AVATAR_DIMENSION = 300`px and recompresses JPEG down through quality steps until under
  `MAX_AVATAR_BYTES = 150KB` — same technique as `PhotoGallery`'s `prepareUpload`, just tuned much smaller
  since it only ever renders as a small circle.

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
- **Duo Head-to-Head**: pick players A & B → two stacked sub-sections:
  - **As Teammates** (`computeDuoStats`): wins together, losses with B, and A's wins *without* B as partner.
  - **Head-to-Head — any partner** (`computeHeadToHead`): A's wins vs B and B's wins vs A when they were
    directly opposing each other, regardless of who else was on either team — plus a "leads X–Y" / "tied"
    summary line. Hidden (replaced by a "haven't faced each other" message) if they've never been direct
    opponents.
  - Every stat tile in both sub-sections is clickable (`StatTile`'s `onClick`/`active` props) — clicking
    toggles a `MatchResultsPanel` below showing the actual matches behind that number (date, teams, score),
    via `MatchRow`. Click the same tile again to collapse.
- **Player Combos**: pick one player → every partner combination they've played, played/wins/losses
  per combo (`computePairStats` filtered to pairs containing that player). "Total matches"/"Overall
  record" tiles and each partner row are clickable — drills down to that player's full match list or
  just the matches with that specific partner (`matchesForPlayer`/`matchesForPair`).
- **Individual Rankings**: `computeStats` ranked by wins, period-filterable (Day/Week/Month/Year/Custom
  Range). Each row is clickable — drills down to that player's matches within the current period filter.
- **Pair Rankings**: `computePairStats` ranked by wins, same period filter options. Each row is clickable —
  drills down to that pair's matches within the current period filter.
- All four tabs' drill-downs render via the shared `StatTile` (clickable variant)/`MatchResultsPanel`/
  `MatchRow` helpers built for Duo Head-to-Head — same toggle-to-collapse behavior throughout.

### `src/pages/Players.jsx`
Add/remove/edit players — **super admin only** (`isAdmin` prop here is fed `isSuperAdmin` from `App.jsx`,
not plain `isAdmin`). Regular admins and guests get the read-only list. Shows **Admin** badge for players
with a PIN. Each row shows an `Avatar` via `PlayerAvatarPicker` — super-admin only for the hover upload/
clear overlay, see Player avatars above; everyone else just sees the plain avatar/initials circle.

### `src/pages/Slots.jsx`
Court slots table. **Super admin only**: inline editable cells + add/delete. Everyone else: read-only.
Rows within 10 days of `endDate` highlight red. Sorted by `endDate` ascending.
**Time column hidden on mobile** (`hidden sm:table-cell`) to save width; visible from `sm` breakpoint up.

### `src/components/MatchForm.jsx`
**`PlayerPicker` dropdowns** (avatar + name, not free text or a plain `<select>`) for all 4 players
sourced from the players list — see Player avatars above. Each dropdown filters out already-selected
players so all 4 are always unique. Scores: 0–30, no ties. Comment optional.
**Date field is super-admin-only** — regular admins get it locked to today (`disabled`, value forced to
`today()`, helper text "Only today's date can be logged") and `handleSubmit` overrides the date to
today regardless of form state when `!isSuperAdmin`; the super admin can pick any past date up to
`max=today` (no future dates allowed).

### `src/components/StatCards.jsx`
Single orange card showing **Total Matches** and **Total Players** side by side (divider between).
Responds to period filter.

### `src/components/TopSeeds.jsx`
Top pair(s) by win rate (`computeTopPairs` — min 4 games to qualify, unlike Report's wins-first
`computePairStats`), scoped to a week via **This Week / Last Week** toggle (`filterByWeek`) —
independent of the Dashboard period filter, always receives full `data.matches`. Seed #1 = orange card.
**Seed #2 card is hidden on mobile** (`hidden sm:block`) — only Top Seed #1 shows below the `sm` breakpoint.
"View All →" modal lists all pair combos **across all-time matches** (not scoped to the selected week) —
button visibility is likewise based on the all-time pair count, not the current week's. Dark mode supported.

### `src/components/Leaderboard.jsx`
**Two top-level tabs: Singles / Doubles**, each with its own **Today / Weekly / Monthly / Yearly /
Overall** period pills (`filterByPeriod`), **defaulting to Today**. Receives raw `matches`/`players` and
computes stats internally, independent of the Dashboard's FilterBar period.
- **No minimum-matches gate here**: calls `computeStats(filtered, players, 1)` / `computeTopPairs(filtered,
  1)` — passing `minMatches=1` instead of the library default of 4, so every player/pair that's played at
  least once this period is ranked ("qualified") straight away. Without this, short periods like Today
  would leave nearly the whole list stuck showing "–" / "Needs N more" since almost nothing reaches 4
  games in a single day. The "Unranked" subtitle still applies to players with 0 matches in the period
  (Singles only — a pair simply doesn't exist in the Doubles list if it hasn't played).
- **Singles**: `computeStats` — one row per player.
- **Doubles**: `computeTopPairs` — one row per pair.
- **Standard competition ranking (1-2-2-4)** for both: rows tied on win rate share the same rank badge,
  and the next distinct rank skips the tied count (shared `computeRanks()` helper — works unmodified
  against either mode since both `computeStats` and `computeTopPairs` rows carry `qualified`/`winRate`/
  `wins`/`losses`). Rank badge only shown for qualified rows (others show "–"). Shows W-L and **played
  count**; subtitle reads "Needs N more" (partial) or "Unranked" (0 played, Singles only) otherwise.

### `src/components/MatchList.jsx`
- **Search box sits above the "Recent Matches" heading.**
- Single 3-way mode pill row (no separate tabs row): **Today** (default) / **Head-to-Head** / **All
  Matches**. Switching away from Head-to-Head clears the picked players.
  - **All Matches**: reveals an optional from/to date-range pair inline (with a Clear button); leaving
    both blank shows every match.
  - **Head-to-Head**: reveals 4 player dropdowns (Player 1 & 2 vs Player 3 & 4, all unique). When all 4
    are chosen the list narrows to matches between that exact pair matchup (team sides ignored) and a
    summary banner shows the record, e.g. "A & B lead C & D 3–1" (or tied / no matches yet).
- Matches **grouped by date** with date headers. Today's header shows **"Today (Aug 10)"** in orange.
  The per-date match-count label is dark/bold (`text-slate-600 dark:text-slate-300`), not faint gray.
- Edit (✏️, **super admin only**): inline form with 4 player dropdowns (reassign either team, all-4-unique
  validated) alongside the score inputs; validates scores 0–30, no ties.
- Delete (🗑️, **super admin only**): ConfirmDialog + local overlay during in-flight request.
- Edit/Delete are gated purely by `canModify = isSuperAdmin` — regular admins can no longer edit/delete
  even today's matches (only the PIN-2669 super admin, Suresh Padaga, has this). `isAdmin` still controls
  the "Log Match →" button (any admin can log a new match for today) and the mode filters.
- Receives `players` prop (from `data.players`) for the edit-form dropdowns.
- **Head-to-Head filter**: 4 player dropdowns (Player 1 & 2 vs Player 3 & 4, all unique). When all 4 are
  chosen, the list narrows to matches between that exact pair matchup (team sides ignored) and a summary
  banner shows the record, e.g. "A & B lead C & D 3–1" (or tied / no matches yet). `Clear` resets it.
- Score box shows the point differential (`+{Math.abs(score1 - score2)}`) beneath the score, e.g. "21-17"
  with "+4" underneath — same for every match row across all three modes.

### `src/components/VideoSection.jsx` / `PhotoGallery.jsx`
Carousel (default) ↔ Manage (**super admin only** — `isAdmin` prop fed `isSuperAdmin` from `Dashboard.jsx`).
Video max 20, photos max 50.

### `src/components/Carousel.jsx`
Auto-advances every 4 s. Orange active dot.

### `src/components/FilterBar.jsx`
Period pills: **All Time / This Year / This Month / This Week**.
Import + Export visible to the **super admin only** (`isAdmin` prop fed `isSuperAdmin` from `Dashboard.jsx`).

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
  `data.players.some(p => p.name === adminName && p.pin === '2669')`. As of the write-access lockdown,
  this is effectively the only role with write access:
  - `VersionsModal` / History button (passed to `Header` as `canViewHistory`) — desktop nav + mobile menu.
  - Edit/delete matches in `MatchList` (`canModify = isSuperAdmin`), add/edit/delete players (`Players.jsx`),
    add/edit/delete slots (`Slots.jsx`), manage videos/photos (`VideoSection`/`PhotoGallery`), Import/Export
    (`FilterBar`) — all gated on `isSuperAdmin`, not plain `isAdmin`.
  - The one exception: any regular admin can still log a **new** match, but only dated today —
    `MatchForm`'s date field is locked/disabled to `today()` unless `isSuperAdmin`.
  - This is enforced client-side only (see the auth limitation above) — a regular admin could still hit
    the API routes directly to bypass these UI gates, same caveat as the rest of the auth model.
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