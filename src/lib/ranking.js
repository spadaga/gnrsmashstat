// Minimum matches a player needs before Win% ranking applies.
const MIN_RANKED_MATCHES = 4

// Ranking: count wins/losses and total point difference per player across
// all doubles matches they played in.
// Qualified (played >= 4): sorted by Win% -> Wins -> fewer Losses.
// Partial (1-3 played): sorted the same way, but always ranked below qualified.
// 0 played: unranked (qualified: false, played: 0), listed last.
// players may be an array of { name, pin? } objects or plain strings.
export function computeStats(matches, players) {
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

  const qualified = all.filter((s) => s.played >= MIN_RANKED_MATCHES).sort(byRankRule).map((s) => ({ ...s, qualified: true }))
  const partial = all.filter((s) => s.played > 0 && s.played < MIN_RANKED_MATCHES).sort(byRankRule).map((s) => ({ ...s, qualified: false }))
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
// fewer losses, with the same min-4-games qualify rule as computeStats — so a
// pair that just played (and won) 1 match can't outrank a proven 100%-vs-67%
// record. computePairStats sorts by raw win count instead; that's kept as-is
// for Report.jsx's wins-based Pair Rankings tab.
export function computeTopPairs(matches) {
  const byRankRule = (a, b) => b.winRate - a.winRate || b.wins - a.wins || a.losses - b.losses
  const pairs = computePairStats(matches)
  const qualified = pairs.filter((p) => p.played >= MIN_RANKED_MATCHES).sort(byRankRule)
  const partial = pairs.filter((p) => p.played < MIN_RANKED_MATCHES).sort(byRankRule)
  return [...qualified, ...partial]
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
// `a` does when paired with anyone other than `b`.
export function computeDuoStats(matches, a, b) {
  let togetherWins = 0, togetherLosses = 0
  let aWithoutBWins = 0, aWithoutBLosses = 0
  for (const m of matches) {
    const team1Won = m.score1 > m.score2
    ;[m.team1, m.team2].forEach((team, ti) => {
      if (!team.includes(a)) return
      const won = ti === 0 ? team1Won : !team1Won
      if (team.includes(b)) { won ? togetherWins++ : togetherLosses++ }
      else { won ? aWithoutBWins++ : aWithoutBLosses++ }
    })
  }
  return {
    togetherWins, togetherLosses, togetherPlayed: togetherWins + togetherLosses,
    aWithoutBWins, aWithoutBLosses, aWithoutBPlayed: aWithoutBWins + aWithoutBLosses,
  }
}
