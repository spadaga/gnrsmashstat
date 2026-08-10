import { Download, Upload } from 'lucide-react'

const PERIODS = [
  { key: 'all',   label: 'All Time' },
  { key: 'year',  label: 'This Year' },
  { key: 'month', label: 'This Month' },
  { key: 'week',  label: 'This Week' },
]

export default function FilterBar({ period, onPeriod, onExport, onImport, isAdmin }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-1 bg-slate-100 rounded-full p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => onPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition ${
              period === p.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer hover:bg-slate-50">
            <Upload size={15} /> Import
            <input type="file" accept="application/json" onChange={onImport} className="hidden" />
          </label>
          <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-slate-50">
            <Download size={15} /> Export
          </button>
        </div>
      )}
    </div>
  )
}
