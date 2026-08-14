import { useState } from 'react'

const today = () => new Date().toISOString().slice(0, 10)
const MAX_SCORE = 30

const empty = () => ({ date: today(), p1: '', p2: '', p3: '', p4: '', score1: '', score2: '', comment: '' })

export default function MatchForm({ players, onAddMatch, isSuperAdmin = false }) {
  const [form, setForm] = useState(empty())
  const [error, setError] = useState('')

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  // Players already selected in other slots (for filtering dropdowns)
  const selected = [form.p1, form.p2, form.p3, form.p4]

  function availableFor(slot) {
    return players.filter((p) => !selected.includes(p) || selected.indexOf(p) === ['p1','p2','p3','p4'].indexOf(slot))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { p1, p2, p3, p4, score1, score2, comment } = form
    // Regular admins can only log matches for today; only the super admin may back-date.
    const date = isSuperAdmin ? form.date : today()

    // Date validation — no future dates
    if (date > today()) return setError('Match date cannot be in the future.')

    const names = [p1, p2, p3, p4]
    if (names.some((n) => !n)) return setError('All four players must be selected.')

    // All 4 must be unique
    const unique = new Set(names)
    if (unique.size < 4) return setError('All four players must be different.')

    const s1 = Number(score1), s2 = Number(score2)
    if (!Number.isInteger(s1) || !Number.isInteger(s2) || s1 < 0 || s1 > MAX_SCORE || s2 < 0 || s2 > MAX_SCORE) {
      return setError(`Scores must be whole numbers between 0 and ${MAX_SCORE}.`)
    }
    if (s1 === s2) return setError('Scores cannot be tied.')

    await onAddMatch({ date, team1: [p1, p2], team2: [p3, p4], score1: s1, score2: s2, comment: comment.trim() })
    setForm(empty())
    setError('')
  }

  const inputCls = 'w-full border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400'

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 sm:p-6 space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Log Match</h2>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
        <input type="date" value={isSuperAdmin ? form.date : today()} max={today()}
          onChange={(e) => set('date', e.target.value)}
          disabled={!isSuperAdmin}
          className={`${inputCls} ${!isSuperAdmin ? 'opacity-60 cursor-not-allowed' : ''}`} required />
        {!isSuperAdmin && <p className="text-xs text-slate-400 mt-1">Only today's date can be logged.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-600 dark:text-slate-400">Team 1</legend>
          <PlayerSelect value={form.p1} onChange={(v) => set('p1', v)} options={availableFor('p1')} label="Player 1" />
          <PlayerSelect value={form.p2} onChange={(v) => set('p2', v)} options={availableFor('p2')} label="Player 2" />
          <input type="number" min={0} max={MAX_SCORE} value={form.score1}
            onChange={(e) => set('score1', e.target.value)}
            placeholder={`Score (0-${MAX_SCORE})`} className={inputCls} required />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-600 dark:text-slate-400">Team 2</legend>
          <PlayerSelect value={form.p3} onChange={(v) => set('p3', v)} options={availableFor('p3')} label="Player 3" />
          <PlayerSelect value={form.p4} onChange={(v) => set('p4', v)} options={availableFor('p4')} label="Player 4" />
          <input type="number" min={0} max={MAX_SCORE} value={form.score2}
            onChange={(e) => set('score2', e.target.value)}
            placeholder={`Score (0-${MAX_SCORE})`} className={inputCls} required />
        </fieldset>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
          Comment <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea value={form.comment} onChange={(e) => set('comment', e.target.value)}
          placeholder="Any notes about this match..." rows={2}
          className={inputCls + ' resize-none'} />
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      <button type="submit"
        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition">
        Save Match
      </button>
    </form>
  )
}

function PlayerSelect({ value, onChange, options, label }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required
      className="w-full border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400">
      <option value="">{label}</option>
      {options.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  )
}