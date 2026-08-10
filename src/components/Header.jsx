import { useState } from 'react'
import { Activity, CalendarClock, LogIn, LogOut, Phone, Plus, ShieldCheck, Users } from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'log', label: 'Log Match', icon: Plus, adminOnly: true },
  { key: 'players', label: 'Players', icon: Users },
  { key: 'slots', label: 'Court Slots', icon: CalendarClock },
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
    <span className="group relative shrink-0">
      <img src="/logo.jpeg" alt="GNR SmashStats logo" onError={() => setBroken(true)} className="w-9 h-9 rounded-lg object-cover" />
      <img
        src="/logo.jpeg"
        alt=""
        className="pointer-events-none absolute left-0 top-full mt-2 w-48 h-48 rounded-xl object-cover shadow-2xl ring-1 ring-black/10 opacity-0 scale-95 origin-top-left transition duration-150 group-hover:opacity-100 group-hover:scale-100 z-50"
      />
    </span>
  )
}

export default function Header({ page, onNavigate, isAdmin, adminName, onLoginClick, onLogout }) {
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

        <nav className="flex items-center gap-1 flex-wrap">
          {NAV.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ key, label, icon: Icon }) => (
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
          <a
            href="tel:7569475439"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            <Phone size={13} /> Bhavani: 7569475439
          </a>

          {isAdmin ? (
            <div className="flex items-center gap-2 ml-1">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
                <ShieldCheck size={13} /> {adminName}
              </span>
              <button
                onClick={onLogout}
                title="Logout"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-orange-600 border border-orange-200 hover:bg-orange-50 transition ml-1"
            >
              <LogIn size={13} /> Admin Login
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
