import { useState } from 'react'
import { Trash2, UserPlus } from 'lucide-react'

export default function Players({ players, actions }) {
  const [name, setName] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    actions.addPlayer(name.trim())
    setName('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border p-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New player name"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">
          <UserPlus size={15} /> Add
        </button>
      </form>

      <div className="bg-white rounded-2xl border p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">Players ({players.length})</h2>
        <div className="space-y-1">
          {players.map((p) => (
            <div key={p} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-800">{p}</span>
              <button onClick={() => actions.deletePlayer(p)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
