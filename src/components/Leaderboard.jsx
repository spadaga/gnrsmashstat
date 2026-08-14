import { useState } from 'react'
import { Medal } from 'lucide-react'
import { computeStats, computeTopPairs, filterByPeriod } from '../lib/ranking'

const MODES = [
  { key: 'singles', label: 'Singles' },
  { key: 'doubles', label: 'Doubles' },
]

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year',  label: 'Yearly' },
  { key: 'all',   label: 'Overall' },
]

// Standard competition ranking (1-2-2-4): rows tied on win rate share a rank,
// and the next distinct rank skips the tied count. Shared by both Singles
// (computeStats) and Doubles (computeTopPairs) — both already sort
// qualified-first and carry the same qualified/winRate/wins/losses shape.
function computeRanks(rows) {
  const ranks = []
  rows.forEach((s, i) => {
    if (!s.qualified) { ranks.push(null); return }
    ranks.push(i > 0 && rows[i - 1].qualified && rows[i - 1].winRate === s.winRate ? ranks[i - 1] : i + 1)
  })
  return ranks
}

export default function Leaderboard({ matches, players }) {
  const [mode, setMode] = useState('singles')
  const [period, setPeriod] = useState('today')
  const filtered = filterByPeriod(matches, period)
  const rows = mode === 'singles' ? computeStats(filtered, players) : computeTopPairs(filtered)
  const ranks = computeRanks(rows)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          <Medal size={16} className="text-orange-600" /> Leaderboard
        </h2>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1">
          {MODES.map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition ${
                mode === m.key ? 'bg-slate-900 dark:bg-orange-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>{m.label}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1 mb-3 w-fit flex-wrap">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition ${
              period === p.key ? 'bg-slate-900 dark:bg-orange-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>{p.label}</button>
        ))}
      </div>
      <div className="space-y-1">
        {rows.map((s, i) => {
          const rank = ranks[i]
          const label = mode === 'singles' ? s.name : s.players.join(' & ')
          const key = mode === 'singles' ? s.name : s.players.join('|')
          return (
            <div key={key} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rank === 1 ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {rank ?? '–'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{s.wins}W - {s.losses}L · {s.played} played</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.winRate}%</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {s.qualified ? 'Win Rate' : s.played > 0 ? `Needs ${4 - s.played} more` : 'Unranked'}
                </p>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && <p className="text-slate-400 text-center py-4 text-sm">No matches yet.</p>}
      </div>
    </div>
  )
}
