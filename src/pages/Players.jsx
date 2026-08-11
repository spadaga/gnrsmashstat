import { useState } from 'react'
import { Pencil, Save, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

function EditPlayerForm({ player, onSave, onCancel }) {
  const pName = typeof player === 'string' ? player : player.name
  const pPin = typeof player === 'object' ? (player.pin || '') : ''
  const [name, setName] = useState(pName)
  const [pin, setPin] = useState(pPin)
  const [err, setErr] = useState('')

  function handleSave() {
    if (!name.trim()) return setErr('Name cannot be empty.')
    if (pin && !/^\d{4}$/.test(pin)) return setErr('PIN must be exactly 4 digits.')
    onSave(pName, { name: name.trim(), pin: pin || undefined })
  }
  const inp = 'flex-1 border dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400'
  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="Player name" className={inp} />
        <input value={pin} onChange={(e) => { setPin(e.target.value); setErr('') }} placeholder="PIN (4 digits)" maxLength={4} className="w-28 border dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition">
          <Save size={12} /> Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <X size={12} /> Cancel
        </button>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  )
}

export default function Players({ players, actions, isAdmin }) {
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [editingName, setEditingName] = useState(null)

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    actions.addPlayer(name.trim()); setName('')
  }

  function handleSaveEdit(oldName, updates) {
    setEditingName(null)
    actions.updatePlayer(oldName, updates)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {isAdmin && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New player name"
            className="flex-1 border dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">
            <UserPlus size={15} /> Add
          </button>
        </form>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">Players ({players.length})</h2>
        <div className="space-y-1">
          {players.map((p) => {
            const playerName = typeof p === 'string' ? p : p.name
            const isAdminPlayer = typeof p === 'object' && !!p.pin
            const isEditing = editingName === playerName
            return (
              <div key={playerName} className="px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{playerName}</span>
                    {isAdminPlayer && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded-full">
                        <ShieldCheck size={10} /> Admin
                      </span>
                    )}
                  </div>
                  {isAdmin && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingName(playerName)} className="p-1.5 text-slate-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition" title="Edit player">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setConfirm(playerName)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete player">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
                {isEditing && <EditPlayerForm player={p} onSave={handleSaveEdit} onCancel={() => setEditingName(null)} />}
              </div>
            )
          })}
        </div>
      </div>
      <ConfirmDialog open={!!confirm} title="Remove player?" message={`"${confirm}" will be removed from the player list.`}
        confirmLabel="Remove" onConfirm={() => { actions.deletePlayer(confirm); setConfirm(null) }} onCancel={() => setConfirm(null)} />
    </div>
  )
}