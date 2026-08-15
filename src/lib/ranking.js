// Minimum matches a player needs before Win% ranking applies.
const MIN_RANKED_MATCHES = 4

// Ranking: count wins/losses and total point difference per player across
// all doubles matches they played in.
// Qualified (played >= minMatches): sorted by Win% -> Wins -> fewer Losses.
// Partial (1..minMatches-1 played): sorted the same way, but always ranked below qualified.
// 0 played: unranked (qualified: false, played: 0), listed last.
// players may be an array of { name, pin? } objects or plain strings.
// minMatches defaults to the standard 4-match qualify rule; pass 1 (e.g. for a
// single day's Leaderboard) to rank everyone who's played at all, with no
// partial/needs-more bucket.
export function computeStats(matches, players, minMatches = MIN_RANKED_MATCHES) {
  const names = players.map((p) => (typeof p === 'string' ? p : p.name))
  const stats = Object.fromEntries(
    names.map((name) => [name, { name, played: 0, wins: 0, losses: 0, pointDiff: 0 }])
  )

  for (const m of matches) {
    const team1Won = m.score1 > m.score2
    const diff = m.score1 - m.score2
    for (const name of m.team1) {
      if (!stats[name]) stats[name] = { name, played: 0, wins: 0, losses: 0, pointDiff: 0 }
      stats[name].played++
      stats[name].pointDiff += diff
      team1Won ? stats[name].wins++ : stats[name].losses++
    }
    for (const name of m.team2) {
      if (!stats[name]) stats[name] = { name, played: 0, wins: 0, losses: 0, pointDiff: 0 }
      stats[name].played++
      stats[name].pointDiff -= diff
      team1Won ? stats[name].losses++ : stats[name].wins++
    }
  }

  const all = Object.values(stats).map((s) => ({
    ...s,
    winRate: s.played ? Math.round((s.wins / s.played) * 100) : 0,
  }))

  const byRankRule = (a, b) => b.winRate - a.winRate || b.wins - a.wins || a.losses - b.losses

  const qualified = all.filter((s) => s.played >= minMatches).sort(byRankRule).map((s) => ({ ...s, qualified: true }))
  const partial = all.filter((s) => s.played > 0 && s.played < minMatches).sort(byRankRule).map((s) => ({ ...s, qualified: false }))
  const unranked = all.filter((s) => s.played === 0).map((s) => ({ ...s, qualified: false }))

  return [...qualified, ...partial, ...unranked]
}

// Compute wins/losses per unique 2-player pair (team combination) across all matches.
export function computePairStats(matches) {
  const stats = {}
  for (const m of matches) {
    const team1Won = m.score1 > m.score2
    const teams = [[...m.team1].sort(), [...m.team2].sort()]
    const won = [team1Won, !team1Won]
    teams.forEach((pair, ti) => {
      const key = pair.join('|||')
      if (!stats[key]) stats[key] = { players: pair, wins: 0, losses: 0, played: 0 }
      stats[key].played++
      won[ti] ? stats[key].wins++ : stats[key].losses++
    })
  }
  return Object.values(stats)
    .map((s) => ({ ...s, winRate: s.played ? Math.round((s.wins / s.played) * 100) : 0 }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
}

// Pair ranking for "Top Seed" style displays: win rate first, then wins, then
// fewer losses, with the same min-4-games qualify rule as computeStats (by
// default) — so a pair that just played (and won) 1 match can't outrank a
// proven 100%-vs-67% record. Pass minMatches=1 (e.g. for a single day's
// Leaderboard) to rank every pair that's played at all. computePairStats
// sorts by raw win count instead; that's kept as-is for Report.jsx's
// wins-based Pair Rankings tab.
export function computeTopPairs(matches, minMatches = MIN_RANKED_MATCHES) {
  const byRankRule = (a, b) => b.winRate - a.winRate || b.wins - a.wins || a.losses - b.losses
  const pairs = computePairStats(matches)
  const qualified = pairs.filter((p) => p.played >= minMatches).sort(byRankRule).map((p) => ({ ...p, qualified: true }))
  const partial = pairs.filter((p) => p.played < minMatches).sort(byRankRule).map((p) => ({ ...p, qualified: false }))
  return [...qualified, ...partial]
}

// Newest-first by date — every match list surfaced in the UI (drill-downs,
// modals, report tabs) should read this way, so callers throughout ranking.js
// route their return arrays through this instead of leaving them in
// whatever order they were filtered/collected in (usually oldest-first,
// matching data/matches.json's append order).
export function sortMatchesDesc(matches) {
  return matches.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

// All matches a given player appears in, on either team — used to drill down
// from a ranking row/stat number to the matches behind it.
export function matchesForPlayer(matches, name) {
  return sortMatchesDesc(matches.filter((m) => m.team1.includes(name) || m.team2.includes(name)))
}

// A match is "abandoned" when neither side reached the normal 21-point
// finish (e.g. stopped early for rain/injury/court time running out).
// Ties are already disallowed at entry, so the winning score is just the max.
export function isAbandoned(m) {
  return Math.max(m.score1, m.score2) < 21
}

// Abandoned matches across the whole match list, newest first — backs the
// Report page's Abandoned Matches tab.
export function computeAbandonedMatches(matches) {
  return sortMatchesDesc(matches.filter(isAbandoned))
}

// All matches a given pair played together (on the same team, either side).
export function matchesForPair(matches, players) {
  return sortMatchesDesc(matches.filter((m) => players.every((p) => m.team1.includes(p)) || players.every((p) => m.team2.includes(p))))
}

// which: 'current' | 'last'. Week starts Sunday, matching filterByPeriod('week').
export function filterByWeek(matches, which) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  let from = weekStart
  let to = null
  if (which === 'last') {
    from = new Date(weekStart)
    from.setDate(weekStart.getDate() - 7)
    to = weekStart
  }
  return matches.filter((m) => {
    const d = new Date(m.date)
    return d >= from && (!to || d < to)
  })
}

export function filterByPeriod(matches, period) {
  if (period === 'all') return matches
  const now = new Date()
  if (period === 'today') {
    const todayStr = now.toISOString().slice(0, 10)
    return matches.filter((m) => m.date === todayStr)
  }
  return matches.filter((m) => {
    const d = new Date(m.date)
    if (period === 'year')  return d.getFullYear() === now.getFullYear()
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (period === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      weekStart.setHours(0, 0, 0, 0)
      return d >= weekStart
    }
    return true
  })
}

// Head-to-head duo report: given two players, how they do together vs. how
// `a` does when paired with anyone other than `b`. Also returns the
// underlying matches per bucket so the UI can show "what made up this number".
export function computeDuoStats(matches, a, b) {
  const togetherWins = [], togetherLosses = []
  const aWithoutBWins = [], aWithoutBLosses = []
  for (const m of matches) {
    const team1Won = m.score1 > m.score2
    ;[m.team1, m.team2].forEach((team, ti) => {
      if (!team.includes(a)) return
      const won = ti === 0 ? team1Won : !team1Won
      if (team.includes(b)) { (won ? togetherWins : togetherLosses).push(m) }
      else { (won ? aWithoutBWins : aWithoutBLosses).push(m) }
    })
  }
  return {
    togetherWins: togetherWins.length, togetherLosses: togetherLosses.length,
    togetherPlayed: togetherWins.length + togetherLosses.length,
    aWithoutBWins: aWithoutBWins.length, aWithoutBLosses: aWithoutBLosses.length,
    aWithoutBPlayed: aWithoutBWins.length + aWithoutBLosses.length,
    matches: {
      togetherWins: sortMatchesDesc(togetherWins), togetherLosses: sortMatchesDesc(togetherLosses),
      aWithoutBWins: sortMatchesDesc(aWithoutBWins), aWithoutBLosses: sortMatchesDesc(aWithoutBLosses),
    },
  }
}

// Individual head-to-head, any partner: how a and b fare when directly
// opposing each other, regardless of who else is on either team. Distinct
// from computeDuoStats' aWithoutBWins, which is a's overall record without b
// as a teammate — b might not even be in that match at all.
export function computeHeadToHead(matches, a, b) {
  const aWins = [], bWins = []
  for (const m of matches) {
    const aTeam = m.team1.includes(a) ? 1 : m.team2.includes(a) ? 2 : 0
    const bTeam = m.team1.includes(b) ? 1 : m.team2.includes(b) ? 2 : 0
    if (!aTeam || !bTeam || aTeam === bTeam) continue
    const team1Won = m.score1 > m.score2
    const aWon = (aTeam === 1) === team1Won
    ;(aWon ? aWins : bWins).push(m)
  }
  return {
    aWins: aWins.length, bWins: bWins.length, played: aWins.length + bWins.length,
    matches: { aWins: sortMatchesDesc(aWins), bWins: sortMatchesDesc(bWins) },
  }
}
