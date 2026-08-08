import { Trophy } from 'lucide-react'

export default function TopSeeds({ stats }) {
  const top3 = stats.slice(0, 3)
  if (top3.length === 0) return null

  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 mb-3">
        <Trophy size={16} className="text-orange-600" /> Top Seeds
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {top3.map((s, i) => (
          <div
            key={s.name}
            className={`rounded-2xl p-4 relative overflow-hidden ${
              i === 0 ? 'bg-orange-600 text-white' : 'bg-white border'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <span
                className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  i === 0 ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Seed #{i + 1}
              </span>
              <span className="text-right">
                <span className="text-xl font-extrabold block">{s.winRate}%</span>
                <span className={`text-[10px] uppercase tracking-wide ${i === 0 ? 'text-orange-100' : 'text-slate-400'}`}>
                  Win Rate
                </span>
              </span>
            </div>
            <Trophy size={64} className={`absolute -bottom-3 -right-3 ${i === 0 ? 'text-white/10' : 'text-slate-100'}`} />
            <p className="font-bold text-lg relative">{s.name}</p>
            <p className={`text-sm relative ${i === 0 ? 'text-orange-100' : 'text-slate-500'}`}>
              {s.wins}W - {s.losses}L
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
