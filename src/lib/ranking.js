// Ranking: count wins/losses and total point difference per player across
// all doubles matches they played in. Sort by wins, then point diff.
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

  return Object.values(stats)
    .map((s) => ({ ...s, winRate: s.played ? Math.round((s.wins / s.played) * 100) : 0 }))
    .sort((a, b) => b.wins - a.wins || b.pointDiff - a.pointDiff)
}

export function filterByPeriod(matches, period) {
  if (period === 'all') return matches
  const now = new Date()
  return matches.filter((m) => {
    const d = new Date(m.date)
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
