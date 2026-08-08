import { useState } from 'react'
import { Trophy, Trash2 } from 'lucide-react'

const RANGES = [
  { key: '30d', label: 'Last 30 Days' },
  { key: 'all', label: 'All Matches' },
  { key: 'custom', label: 'Custom Range' },
]

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export default function MatchList({ matches, onDelete, onLogMatch }) {
  const [range, setRange] = useState('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const visible = matches.filter((m) => {
    if (range === '30d') return m.date >= daysAgo(30)
    if (range === 'custom') return (!from || m.date >= from) && (!to || m.date <= to)
    return true
  })
  const sorted = [...visible].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Recent Matches</h2>
        {onLogMatch && (
          <button onClick={onLogMatch} className="text-xs font-bold uppercase tracking-wide text-orange-600 hover:text-orange-700">
            Log Match →
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex gap-1 bg-slate-100 rounded-full p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition ${
                range === r.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-2 py-1 text-xs" />
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-2 py-1 text-xs" />
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-[32rem] overflow-y-auto">
        {sorted.map((m, i) => {
          const team1Won = m.score1 > m.score2
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 ${i === 0 ? 'border-orange-300' : ''}`}
            >
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{formatDate(m.date)}</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className={`text-right flex-1 ${team1Won ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                    {team1Won && <Trophy size={12} className="inline mb-0.5 mr-1 text-orange-500" />}
                    {m.team1.join(' & ')}
                  </div>
                  <div className="flex items-center gap-1 font-bold bg-slate-50 rounded-lg px-2 py-1 shrink-0">
                    <span className={team1Won ? 'text-orange-600' : 'text-slate-400'}>{m.score1}</span>
                    <span className="text-slate-300">-</span>
                    <span className={!team1Won ? 'text-orange-600' : 'text-slate-400'}>{m.score2}</span>
                  </div>
                  <div className={`flex-1 ${!team1Won ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                    {m.team2.join(' & ')}
                    {!team1Won && <Trophy size={12} className="inline mb-0.5 ml-1 text-orange-500" />}
                  </div>
                </div>
                {m.comment && <p className="text-xs text-slate-400 italic mt-1">"{m.comment}"</p>}
              </div>
              <button onClick={() => onDelete(m.id)} className="text-slate-300 hover:text-red-500 shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}
        {sorted.length === 0 && <p className="text-slate-400 text-center py-4 text-sm">No matches in this range.</p>}
      </div>
    </div>
  )
}
