import { useState } from 'react'
import { Activity, CalendarClock, LogIn, LogOut, Moon, Phone, Plus, ShieldCheck, Sun, Users } from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'log',       label: 'Log Match', icon: Plus, adminOnly: true },
  { key: 'players',   label: 'Players',   icon: Users },
  { key: 'slots',     label: 'Court Slots', icon: CalendarClock },
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
      <img src="/logo.jpeg" alt=""
        className="pointer-events-none absolute left-0 top-full mt-2 w-48 h-48 rounded-xl object-cover shadow-2xl ring-1 ring-black/10 opacity-0 scale-95 origin-top-left transition duration-150 group-hover:opacity-100 group-hover:scale-100 z-50" />
    </span>
  )
}

export default function Header({ page, onNavigate, isAdmin, adminName, onLoginClick, onLogout, dark, onToggleDark }) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-left">
          <Logo />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              GNR SMASH<span className="text-orange-600">STATS</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Gentlemen Play Here
            </span>
          </span>
        </button>

        <nav className="flex items-center gap-1 flex-wrap">
          {NAV.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => onNavigate(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                page === key
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}>
              {Icon && <Icon size={15} />}{label}
            </button>
          ))}

          <a href="tel:7569475439"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <Phone size={13} /> Bhavani
          </a>

          {/* Dark mode toggle */}
          <button onClick={onToggleDark}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-2 ml-1">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-xs font-semibold text-orange-700 dark:text-orange-400">
                <ShieldCheck size={13} /> {adminName}
              </span>
              <button onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <LogOut size={13} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-orange-600 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition ml-1">
              <LogIn size={13} /> Admin Login
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}