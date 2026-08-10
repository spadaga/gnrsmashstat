import { useState } from 'react'
import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

function daysLeft(endDate) {
  const end = new Date(`${endDate}T00:00:00`)
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((end - today) / 86400000)
}

const emptyForm = { name: '', time: '6 to 7', endDate: '' }

export default function Slots({ slots, actions, isAdmin }) {
  const [form, setForm] = useState(emptyForm)
  const [confirm, setConfirm] = useState(null)

  function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.endDate) return
    actions.addSlot({ name: form.name.trim(), time: form.time.trim(), endDate: form.endDate })
    setForm(emptyForm)
  }

  function commit(slot, field, value) {
    if (value === slot[field]) return
    actions.updateSlot(slot.id, { [field]: value })
  }

  const sorted = [...slots].sort((a, b) => (a.endDate < b.endDate ? -1 : 1))
  const inp = 'border dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400'

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {isAdmin && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4 flex flex-wrap gap-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className={`flex-1 min-w-[10rem] ${inp}`} />
          <input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="Time" className={`w-28 ${inp}`} />
          <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={inp} required />
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700">
            <Plus size={15} /> Add
          </button>
        </form>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-3">
          <CalendarClock size={16} className="text-orange-600" /> Court Slots
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b dark:border-slate-700">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Time</th>
                <th className="py-2 pr-2">End Date</th>
                <th className="py-2 pr-2">Days</th>
                {isAdmin && <th className="py-2 pr-2" />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const days = daysLeft(s.endDate)
                const expiring = days < 10
                const cellCls = expiring ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
                const editCls = `border-0 bg-transparent px-2 py-1 rounded focus:bg-white dark:focus:bg-slate-700 focus:ring-1 focus:ring-orange-300 ${cellCls}`
                return (
                  <tr key={s.id} className={expiring ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <td className="py-1 pr-2">
                      {isAdmin
                        ? <input defaultValue={s.name} onBlur={(e) => commit(s, 'name', e.target.value)} className={`w-full ${editCls} ${expiring ? 'font-semibold' : ''}`} />
                        : <span className={`px-2 py-1 ${cellCls} ${expiring ? 'font-semibold' : ''}`}>{s.name}</span>}
                    </td>
                    <td className="py-1 pr-2">
                      {isAdmin
                        ? <input defaultValue={s.time} onBlur={(e) => commit(s, 'time', e.target.value)} className={`w-24 ${editCls}`} />
                        : <span className={`px-2 ${cellCls}`}>{s.time}</span>}
                    </td>
                    <td className="py-1 pr-2">
                      {isAdmin
                        ? <input type="date" defaultValue={s.endDate} onBlur={(e) => commit(s, 'endDate', e.target.value)} className={editCls} />
                        : <span className={`px-2 ${cellCls}`}>{s.endDate}</span>}
                    </td>
                    <td className={`py-1 pr-2 font-semibold ${expiring ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {days < 0 ? `Expired ${-days}d ago` : `${days}d`}
                    </td>
                    {isAdmin && (
                      <td className="py-1 pr-2">
                        <button onClick={() => setConfirm(s)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="py-4 text-center text-slate-400">No slots yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog open={!!confirm} title="Delete this slot?" message={confirm ? `Slot for "${confirm.name}" will be removed.` : ''}
        confirmLabel="Delete" onConfirm={() => { actions.deleteSlot(confirm.id); setConfirm(null) }} onCancel={() => setConfirm(null)} />
    </div>
  )
}