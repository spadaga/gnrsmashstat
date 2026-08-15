import { useState } from 'react'
import { AlertTriangle, ArrowLeft, CalendarClock, ShieldCheck, Trophy } from 'lucide-react'
import Avatar from '../components/Avatar'
import MatchesModal from '../components/MatchesModal'
import { SUPER_ADMIN_NAME } from '../lib/admins'
import { computeStats, filterByPeriod, isAbandoned, matchesForPlayer } from '../lib/ranking'

function wonFor(m, name) {
  const onTeam1 = m.team1.includes(name)
  const team1Won = m.score1 > m.score2
  return onTeam1 ? team1Won : !team1Won
}

const PERIOD_CARDS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year',  label: 'This Year' },
]

function recordFor(matches, name) {
  let played = 0, wins = 0, losses = 0
  for (const m of matches) {
    const onTeam1 = m.team1.includes(name)
    const onTeam2 = m.team2.includes(name)
    if (!onTeam1 && !onTeam2) continue
    played++
    const team1Won = m.score1 > m.score2
    const won = onTeam1 ? team1Won : !team1Won
    won ? wins++ : losses++
  }
  return { played, wins, losses }
}

function StatTile({ value, label, color = 'text-orange-600', onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick}
      className={`text-center rounded-xl py-3 px-2 bg-slate-50 dark:bg-slate-700/50 w-full ${onClick ? 'cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 transition' : ''}`}>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </Tag>
  )
}

function PeriodCard({ label, rec, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="text-left rounded-xl border dark:border-slate-700 p-3 w-full cursor-pointer hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{rec.played}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1">played</p>
      <p className="text-xs text-slate-600 dark:text-slate-300">
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.wins}W</span> – <span className="text-red-500 dark:text-red-400 font-bold">{rec.losses}L</span>
      </p>
    </button>
  )
}

function MatchRow({ m, name }) {
  const team1Won = m.score1 > m.score2
  const onTeam1 = m.team1.includes(name)
  const won = onTeam1 ? team1Won : !team1Won
  const abandoned = isAbandoned(m)
  return (
    <div className={`px-3 py-2 rounded-xl border text-xs ${abandoned ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : 'dark:border-slate-700'}`}>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0">{m.date}</span>
        <span className={`flex-1 text-right ${team1Won ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{m.team1.join(' & ')}</span>
        <span className="font-bold shrink-0 bg-white dark:bg-slate-700 rounded px-1.5 py-0.5">
          <span className={team1Won ? 'text-orange-600' : ''}>{m.score1}</span>-<span className={!team1Won ? 'text-orange-600' : ''}>{m.score2}</span>
        </span>
        <span className={`flex-1 ${!team1Won ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{m.team2.join(' & ')}</span>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${won ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'}`}>
          {won ? 'Won' : 'Lost'}
        </span>
      </div>
      {abandoned && (
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mt-1">
          <AlertTriangle size={10} /> Abandoned
        </p>
      )}
      {m.comment && <p className="text-slate-600 dark:text-slate-300 italic font-medium mt-1">"{m.comment}"</p>}
    </div>
  )
}

export default function PlayerProfile({ playerName, players, matches, slots, onBack }) {
  const [drilldown, setDrilldown] = useState(null)
  const playerObj = players.find((p) => (typeof p === 'string' ? p : p.name) === playerName)
  const photo = typeof playerObj === 'object' ? playerObj.photo : undefined
  const isSuperAdminPlayer = playerName === SUPER_ADMIN_NAME
  const showsAsAdmin = isSuperAdminPlayer || (typeof playerObj === 'object' && playerObj.role === 'admin')

  const slot = slots?.find((s) => s.name?.trim().toLowerCase() === playerName.trim().toLowerCase())

  const overall = recordFor(matches, playerName)
  const winRate = overall.played ? Math.round((overall.wins / overall.played) * 100) : 0
  const [rankRow] = computeStats(matches, players, 1).filter((s) => s.name === playerName)

  const playerMatches = matchesForPlayer(matches, playerName)
  const abandonedCount = playerMatches.filter(isAbandoned).length
  const recent = playerMatches.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15)

  const periodRecords = PERIOD_CARDS.map((p) => ({ ...p, rec: recordFor(filterByPeriod(matches, p.key), playerName) }))

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar name={playerName} photo={photo} size="xl" />
          <div className="flex-1 min-w-[10rem]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{playerName}</h1>
              {showsAsAdmin ? (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded-full">
                  <ShieldCheck size={10} /> Admin
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded-full">
                  Contributor
                </span>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <CalendarClock size={13} className="text-orange-500" />
              {slot ? <>Court slot renews <span className="font-semibold text-slate-700 dark:text-slate-200">{slot.endDate}</span></> : 'No active court slot'}
            </p>
            {rankRow?.qualified && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <Trophy size={13} className="text-orange-500" /> {rankRow.winRate}% overall win rate
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatTile value={overall.played} label="Total Played" color="text-slate-800 dark:text-slate-100"
            onClick={() => setDrilldown({ title: `${playerName} — all matches`, list: playerMatches })} />
          <StatTile value={overall.wins} label="Total Wins" color="text-emerald-600 dark:text-emerald-400"
            onClick={() => setDrilldown({ title: `${playerName} — wins`, list: playerMatches.filter((m) => wonFor(m, playerName)) })} />
          <StatTile value={overall.losses} label="Total Losses" color="text-red-500 dark:text-red-400"
            onClick={() => setDrilldown({ title: `${playerName} — losses`, list: playerMatches.filter((m) => !wonFor(m, playerName)) })} />
          <StatTile value={`${winRate}%`} label="Win Rate"
            onClick={() => setDrilldown({ title: `${playerName} — all matches`, list: playerMatches })} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">Activity Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {periodRecords.map((p) => (
            <PeriodCard key={p.key} label={p.label} rec={p.rec}
              onClick={() => setDrilldown({ title: `${playerName} — ${p.label}`, list: matchesForPlayer(filterByPeriod(matches, p.key), playerName) })} />
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Recent Matches</h2>
          {abandonedCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <AlertTriangle size={11} /> {abandonedCount} abandoned
            </span>
          )}
        </div>
        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {recent.length === 0 ? <p className="text-slate-400 text-center py-4 text-sm">No matches yet.</p> :
            recent.map((m) => <MatchRow key={m.id} m={m} name={playerName} />)}
        </div>
      </div>

      {drilldown && <MatchesModal title={drilldown.title} matches={drilldown.list} onClose={() => setDrilldown(null)} />}
    </div>
  )
}
