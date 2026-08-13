import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { computeStats, computePairStats, computeDuoStats, filterByPeriod } from '../lib/ranking'

const TABS = [
  { key: 'duo',        label: 'Duo Head-to-Head' },
  { key: 'combos',     label: 'Player Combos' },
  { key: 'individual', label: 'Individual Rankings' },
  { key: 'pairs',      label: 'Pair Rankings' },
]

const PERIODS = [
  { key: 'today',  label: 'Day' },
  { key: 'week',   label: 'Week' },
  { key: 'month',  label: 'Month' },
  { key: 'year',   label: 'Year' },
  { key: 'custom', label: 'Custom Range' },
]

const selectCls = 'border dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:border-orange-400 focus:outline-none'
const dateCls = 'border dark:border-slate-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100'

function Bar({ label, value, max, color = 'bg-orange-600' }) {
  const pct = max > 0 && value > 0 ? Math.max(4, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 sm:w-36 shrink-0 text-xs text-slate-600 dark:text-slate-300 truncate">{label}</span>
      <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-bold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

function applyPeriod(matches, period, from, to) {
  if (period === 'custom') return matches.filter((m) => (!from || m.date >= from) && (!to || m.date <= to))
  return filterByPeriod(matches, period)
}

function PeriodTabs({ period, onPeriod, from, to, onFrom, onTo }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1">
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => onPeriod(p.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition ${
              period === p.key ? 'bg-slate-900 dark:bg-orange-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>{p.label}</button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={dateCls} />
          <span className="text-slate-400 text-xs">to</span>
          <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={dateCls} />
        </div>
      )}
    </div>
  )
}

function StatTile({ value, label, color = 'text-orange-600' }) {
  return (
    <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-xl py-3 px-2">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  )
}

function DuoSection({ matches, players }) {
  const [a, setA] = useState(players[0] || '')
  const [b, setB] = useState(players[1] || '')
  const aOptions = players.filter((p) => p !== b)
  const bOptions = players.filter((p) => p !== a)
  const ready = a && b && a !== b
  const s = ready ? computeDuoStats(matches, a, b) : null
  const max = s ? Math.max(1, s.togetherWins, s.togetherLosses, s.aWithoutBWins) : 1

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={a} onChange={(e) => setA(e.target.value)} className={selectCls}>
          {aOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-slate-400 text-xs">&</span>
        <select value={b} onChange={(e) => setB(e.target.value)} className={selectCls}>
          {bOptions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {!ready ? <p className="text-slate-400 text-sm">Pick two different players.</p> : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile value={s.togetherWins} label={`Wins ${a} & ${b} together`} />
            <StatTile value={s.togetherLosses} label={`Losses with ${b}`} color="text-slate-700 dark:text-slate-200" />
            <StatTile value={s.aWithoutBWins} label={`${a}'s wins without ${b}`} />
          </div>
          <div className="space-y-2">
            <Bar label="Together — Wins" value={s.togetherWins} max={max} />
            <Bar label={`Losses w/ ${b}`} value={s.togetherLosses} max={max} color="bg-slate-400 dark:bg-slate-500" />
            <Bar label={`${a} w/o ${b} — Wins`} value={s.aWithoutBWins} max={max} />
          </div>
        </>
      )}
    </div>
  )
}

function CombosSection({ matches, players }) {
  const [p, setP] = useState(players[0] || '')
  const pairs = computePairStats(matches).filter((x) => x.players.includes(p))
  const partnerOf = (pair) => pair.players.find((n) => n !== p)
  const overall = pairs.reduce((acc, x) => ({ played: acc.played + x.played, wins: acc.wins + x.wins, losses: acc.losses + x.losses }), { played: 0, wins: 0, losses: 0 })
  const max = Math.max(1, ...pairs.map((x) => x.played))

  return (
    <div>
      <select value={p} onChange={(e) => setP(e.target.value)} className={`${selectCls} mb-4`}>
        {players.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      {pairs.length === 0 ? <p className="text-slate-400 text-sm">No matches for {p} yet.</p> : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile value={pairs.length} label="Combinations played" />
            <StatTile value={overall.played} label="Total matches" />
            <StatTile value={`${overall.wins}W – ${overall.losses}L`} label="Overall record" />
          </div>
          <div className="space-y-2 mb-5">
            {pairs.map((x) => <Bar key={x.players.join('|')} label={`w/ ${partnerOf(x)}`} value={x.played} max={max} />)}
          </div>
          <div className="space-y-1.5">
            {pairs.map((x) => (
              <div key={x.players.join('|')} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-200">w/ {partnerOf(x)}</span>
                <span className="text-slate-500 dark:text-slate-400">{x.played} played · <span className="text-orange-600 font-bold">{x.wins}W</span> – {x.losses}L · {x.winRate}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function IndividualSection({ matches, players }) {
  const [period, setPeriod] = useState('week')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const filtered = applyPeriod(matches, period, from, to)
  const stats = computeStats(filtered, players).filter((s) => s.played > 0).slice(0, 10)
  const max = Math.max(1, ...stats.map((s) => s.wins))

  return (
    <div>
      <PeriodTabs period={period} onPeriod={setPeriod} from={from} to={to} onFrom={setFrom} onTo={setTo} />
      {stats.length === 0 ? <p className="text-slate-400 text-sm">No matches in this range.</p> : (
        <>
          <div className="space-y-2 mb-5">
            {stats.map((s) => <Bar key={s.name} label={s.name} value={s.wins} max={max} />)}
          </div>
          <div className="space-y-1.5">
            {stats.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{i + 1}. {s.name}</span>
                <span className="text-slate-500 dark:text-slate-400">{s.played} played · <span className="text-orange-600 font-bold">{s.wins}W</span> – {s.losses}L · {s.winRate}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PairsSection({ matches }) {
  const [period, setPeriod] = useState('week')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const filtered = applyPeriod(matches, period, from, to)
  const pairs = computePairStats(filtered).slice(0, 10)
  const max = Math.max(1, ...pairs.map((p) => p.wins))

  return (
    <div>
      <PeriodTabs period={period} onPeriod={setPeriod} from={from} to={to} onFrom={setFrom} onTo={setTo} />
      {pairs.length === 0 ? <p className="text-slate-400 text-sm">No matches in this range.</p> : (
        <>
          <div className="space-y-2 mb-5">
            {pairs.map((p) => <Bar key={p.players.join('|')} label={p.players.join(' & ')} value={p.wins} max={max} />)}
          </div>
          <div className="space-y-1.5">
            {pairs.map((p, i) => (
              <div key={p.players.join('|')} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{i + 1}. {p.players.join(' & ')}</span>
                <span className="text-slate-500 dark:text-slate-400">{p.played} played · <span className="text-orange-600 font-bold">{p.wins}W</span> – {p.losses}L · {p.winRate}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Report({ data }) {
  const [tab, setTab] = useState('duo')
  const players = data.players
  const matches = data.matches

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-4">
        <BarChart3 size={16} className="text-orange-600" /> Reports
      </h2>
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition ${
              tab === t.key ? 'bg-slate-900 dark:bg-orange-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}>{t.label}</button>
        ))}
      </div>
      {players.length < 2 ? <p className="text-slate-400 text-sm">Add at least 2 players first.</p> : (
        <>
          {tab === 'duo' && <DuoSection matches={matches} players={players} />}
          {tab === 'combos' && <CombosSection matches={matches} players={players} />}
          {tab === 'individual' && <IndividualSection matches={matches} players={players} />}
          {tab === 'pairs' && <PairsSection matches={matches} />}
        </>
      )}
    </div>
  )
}
