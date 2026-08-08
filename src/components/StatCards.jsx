import { Activity, Trophy } from 'lucide-react'

export default function StatCards({ matches, players }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-2xl bg-orange-600 text-white p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-100">Total Matches</p>
          <p className="text-4xl font-extrabold mt-1">{matches.length}</p>
        </div>
        <Activity size={32} className="text-orange-200" />
      </div>
      <div className="rounded-2xl bg-slate-900 text-white p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Active Players</p>
          <p className="text-4xl font-extrabold mt-1">{players.length}</p>
        </div>
        <Trophy size={32} className="text-slate-600" />
      </div>
    </div>
  )
}
