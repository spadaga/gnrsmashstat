import { Medal } from 'lucide-react'

export default function Leaderboard({ stats }) {
  return (
    <div className="bg-white rounded-2xl border p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
        <Medal size={16} className="text-orange-600" /> Leaderboard
      </h2>
      <div className="space-y-1">
        {stats.map((s, i) => (
          <div key={s.name} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">{s.wins}W - {s.losses}L</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{s.winRate}%</p>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Win Rate</p>
            </div>
          </div>
        ))}
        {stats.length === 0 && <p className="text-slate-400 text-center py-4 text-sm">No matches yet.</p>}
      </div>
    </div>
  )
}
