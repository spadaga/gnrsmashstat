import { useState } from 'react'
import { Loader2, Pencil, Save, Trophy, Trash2, X } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

const RANGES = [
  { key: '30d',    label: 'Last 30 Days' },
  { key: 'all',    label: 'All Matches' },
  { key: 'custom', label: 'Custom Range' },
]

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// Returns [{date, matches[]}] sorted newest date first
function groupByDate(matches) {
  const map = {}
  for (const m of matches) {
    if (!map[m.date]) map[m.date] = []
    map[m.date].push(m)
  }
  return Object.entries(map)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, items]) => ({ date, items }))
}

function EditScoreForm({ match, onSave, onCancel }) {
  const [s1, setS1] = useState(String(match.score1))
  const [s2, setS2] = useState(String(match.score2))
  const [err, setErr] = useState('')

  function handleSave() {
    const n1 = Number(s1), n2 = Number(s2)
    if (!Number.isInteger(n1) || !Number.isInteger(n2) || n1 < 0 || n1 > 21 || n2 < 0 || n2 > 21)
      return setErr('Scores must be 0–21.')
    if (n1 === n2) return setErr('Scores cannot be tied.')
    onSave({ score1: n1, score2: n2 })
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <input
          type="number" min={0} max={21} value={s1}
          onChange={(e) => { setS1(e.target.value); setErr('') }}
          className="w-14 border rounded-lg px-2 py-1 text-sm text-center font-bold focus:border-orange-400 focus:outline-none"
        />
        <span className="text-slate-400 text-sm">–</span>
        <input
          type="number" min={0} max={21} value={s2}
          onChange={(e) => { setS2(e.target.value); setErr('') }}
          className="w-14 border rounded-lg px-2 py-1 text-sm text-center font-bold focus:border-orange-400 focus:outline-none"
        />
      </div>
      {err && <span className="text-xs text-red-600">{err}</span>}
      <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition">
        <Save size={12} /> Save
      </button>
      <button onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
        <X size={12} /> Cancel
      </button>
    </div>
  )
}

export default function MatchList({ matches, onDelete, onUpdate, onLogMatch, isAdmin }) {
  const [range, setRange] = useState('30d')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [confirm, setConfirm] = useState(null)     // match id to delete
  const [deleting, setDeleting] = useState(false)  // loading state for delete
  const [editingId, setEditingId] = useState(null)

  const visible = matches.filter((m) => {
    if (range === '30d')    return m.date >= daysAgo(30)
    if (range === 'custom') return (!from || m.date >= from) && (!to || m.date <= to)
    return true
  })
  const groups = groupByDate(visible)

  async function handleDelete() {
    const id = confirm
    setConfirm(null)
    setDeleting(true)
    try { await onDelete(id) } finally { setDeleting(false) }
  }

  async function handleSaveScore(id, updates) {
    setEditingId(null)
    await onUpdate(id, updates)
  }

  return (
    <div className="bg-white rounded-2xl border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Recent Matches</h2>
        {onLogMatch && isAdmin && (
          <button onClick={onLogMatch} className="text-xs font-bold uppercase tracking-wide text-orange-600 hover:text-orange-700">
            Log Match →
          </button>
        )}
      </div>

      {/* Range filters */}
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

      {/* Match list grouped by date */}
      <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-1">
        {groups.map(({ date, items }) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{formatDate(date)}</span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-slate-300">{items.length} match{items.length !== 1 ? 'es' : ''}</span>
            </div>

            <div className="space-y-2">
              {items.map((m) => {
                const team1Won = m.score1 > m.score2
                const isEditing = editingId === m.id
                return (
                  <div
                    key={m.id}
                    className="border rounded-xl px-3 py-2.5 hover:border-orange-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
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
                        {isEditing && (
                          <EditScoreForm
                            match={m}
                            onSave={(updates) => handleSaveScore(m.id, updates)}
                            onCancel={() => setEditingId(null)}
                          />
                        )}
                      </div>
                      {isAdmin && !isEditing && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingId(m.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-orange-500 hover:bg-orange-50 transition"
                            title="Edit score"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirm(m.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                            title="Delete match"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && <p className="text-slate-400 text-center py-4 text-sm">No matches in this range.</p>}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirm}
        title="Delete this match?"
        message="This match record will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />

      {/* Transparent loading overlay for delete */}
      {deleting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-5 py-3">
            <Loader2 size={18} className="animate-spin text-orange-600" />
            <span className="text-sm font-semibold text-slate-700">Deleting…</span>
          </div>
        </div>
      )}
    </div>
  )
}