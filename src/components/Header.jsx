import { useState } from 'react'
import { Activity, Plus, Users } from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'log', label: 'Log Match', icon: Plus },
  { key: 'players', label: 'Players', icon: Users },
]

function Logo() {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <span className="w-9 h-9 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
        <Activity size={18} />
      </span>
    )
  }
  return (
    <img
      src="/logo.jpeg"
      alt="GNR SmashStats logo"
      onError={() => setBroken(true)}
      className="w-9 h-9 rounded-lg object-cover shrink-0"
    />
  )
}

export default function Header({ page, onNavigate }) {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-left">
          <Logo />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight">
              GNR SMASH<span className="text-orange-600">STATS</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Gentlemen Play Here
            </span>
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
