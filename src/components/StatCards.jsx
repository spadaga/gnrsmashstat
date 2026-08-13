import { Activity, Trophy } from 'lucide-react'

export default function StatCards({ matches, players }) {
  return (
    <div className="rounded-2xl bg-orange-600 text-white p-5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Activity size={32} className="text-orange-200 shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-100">Total Matches</p>
          <p className="text-4xl font-extrabold mt-1">{matches.length}</p>
        </div>
      </div>
      <div className="w-px self-stretch bg-orange-400/40" />
      <div className="flex items-center gap-3">
        <Trophy size={32} className="text-orange-200 shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-100">Total Players</p>
          <p className="text-4xl font-extrabold mt-1">{players.length}</p>
        </div>
      </div>
    </div>
  )
}
