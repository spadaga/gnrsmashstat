import { useState } from 'react'

const empty = { date: new Date().toISOString().slice(0, 10), p1: '', p2: '', p3: '', p4: '', score1: '', score2: '' }

export default function MatchForm({ players, onAddPlayer, onAddMatch }) {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { date, p1, p2, p3, p4, score1, score2 } = form
    const names = [p1, p2, p3, p4].map((n) => n.trim())
    if (names.some((n) => !n)) return setError('All four player names are required.')
    const s1 = Number(score1)
    const s2 = Number(score2)
    if (!Number.isInteger(s1) || !Number.isInteger(s2) || s1 < 0 || s1 > 21 || s2 < 0 || s2 > 21) {
      return setError('Scores must be whole numbers between 0 and 21.')
    }
    if (s1 === s2) return setError('Scores cannot be tied.')

    await Promise.all(names.map(onAddPlayer))
    await onAddMatch({ date, team1: [names[0], names[1]], team2: [names[2], names[3]], score1: s1, score2: s2 })
    setForm(empty)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-4 sm:p-6 space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">Log Match</h2>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-600">Team 1</legend>
          <PlayerInput value={form.p1} onChange={(v) => set('p1', v)} players={players} placeholder="Player 1" />
          <PlayerInput value={form.p2} onChange={(v) => set('p2', v)} players={players} placeholder="Player 2" />
          <input
            type="number"
            min={0}
            max={21}
            value={form.score1}
            onChange={(e) => set('score1', e.target.value)}
            placeholder="Score (0-21)"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-600">Team 2</legend>
          <PlayerInput value={form.p3} onChange={(v) => set('p3', v)} players={players} placeholder="Player 3" />
          <PlayerInput value={form.p4} onChange={(v) => set('p4', v)} players={players} placeholder="Player 4" />
          <input
            type="number"
            min={0}
            max={21}
            value={form.score2}
            onChange={(e) => set('score2', e.target.value)}
            placeholder="Score (0-21)"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </fieldset>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="w-full sm:w-auto px-5 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition">
        Save Match
      </button>
    </form>
  )
}

function PlayerInput({ value, onChange, players, placeholder }) {
  const listId = `players-${placeholder.replace(/\s/g, '')}`
  return (
    <>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2"
        required
      />
      <datalist id={listId}>
        {players.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  )
}
