import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Avatar from './Avatar'

// Avatar-aware replacement for a native <select> of player names — a plain
// <select><option> can't render an inline <img>, so this is a small custom
// listbox instead. Validation is left to the caller (MatchForm already
// checks all four slots are filled before submit); this only handles pick UI.
export default function PlayerPicker({ value, onChange, options, photoByName = {}, placeholder = 'Select player' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function select(v) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400 text-left">
        {value ? (
          <>
            <Avatar name={value} photo={photoByName[value]} size="sm" />
            <span className="flex-1 truncate text-sm">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-sm text-slate-400">{placeholder}</span>
        )}
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg py-1">
          {options.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No players available.</p>}
          {options.map((p) => (
            <button key={p} type="button" onClick={() => select(p)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition ${p === value ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
              <Avatar name={p} photo={photoByName[p]} size="sm" />
              <span className="text-sm text-slate-800 dark:text-slate-100">{p}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
