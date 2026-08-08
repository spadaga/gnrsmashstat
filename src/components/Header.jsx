import { Activity, Plus, Users } from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'log', label: 'Log Match', icon: Plus },
  { key: 'players', label: 'Players', icon: Users },
]

export default function Header({ page, onNavigate }) {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center">
            <Activity size={18} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            SMASH<span className="text-orange-600">STATS</span>
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                page === key ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {Icon && <Icon size={15} />}
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
