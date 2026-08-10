import { useState } from 'react'
import { ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Players({ players, actions, isAdmin }) {
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState(null) // name to delete

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    actions.addPlayer(name.trim())
    setName('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {isAdmin && (
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
      )}

      <div className="bg-white rounded-2xl border p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">Players ({players.length})</h2>
        <div className="space-y-1">
          {players.map((p) => {
            const playerName = typeof p === 'string' ? p : p.name
            const isAdminPlayer = typeof p === 'object' && !!p.pin
            return (
              <div key={playerName} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{playerName}</span>
                  {isAdminPlayer && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => setConfirm(playerName)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Remove player?"
        message={`"${confirm}" will be removed from the player list.`}
        confirmLabel="Remove"
        onConfirm={() => { actions.deletePlayer(confirm); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}