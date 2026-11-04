import { useEffect, useRef, useState, useMemo } from 'react'
import { ChevronDown, Ban, UserPlus, Check, ArrowLeft } from 'lucide-react'
import Avatar from './Avatar'
import { sortPlayersByTier } from '../lib/ranking'

const GUEST_PREFIX = "Guest - ";

export default function PlayerPicker({
  value,
  onChange,
  options = [],
  players = [],
  inactivePlayers = [],
  photoByName = {},
  placeholder = 'Select player',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('select') // 'select' (autocomplete) or 'guest' (free text)
  const [guestText, setGuestText] = useState(GUEST_PREFIX)
  const ref = useRef(null)
  const guestInputRef = useRef(null)

  // Initialize guestText when value is a guest or changes
  useEffect(() => {
    if (value && value.startsWith(GUEST_PREFIX)) {
      setGuestText(value)
    } else {
      setGuestText(GUEST_PREFIX)
    }
  }, [value])

  // When opening, default mode: if current value starts with "Guest - ", open in guest mode
  useEffect(() => {
    if (open) {
      if (value && value.startsWith(GUEST_PREFIX)) {
        setMode('guest')
        setGuestText(value)
        setTimeout(() => {
          if (guestInputRef.current) {
            guestInputRef.current.focus()
            guestInputRef.current.setSelectionRange(value.length, value.length)
          }
        }, 50)
      } else {
        setMode('select')
        setQuery('')
      }
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // Build a set of inactive player names from players / inactivePlayers / options
  const inactiveSet = useMemo(() => {
    const set = new Set(
      (Array.isArray(inactivePlayers) ? inactivePlayers : []).map((n) =>
        String(n).trim().toLowerCase()
      )
    )
    players.forEach((p) => {
      if (typeof p === 'object' && p.inactive && p.name) {
        set.add(p.name.trim().toLowerCase())
      }
    })
    options.forEach((p) => {
      if (typeof p === 'object' && p.inactive && p.name) {
        set.add(p.name.trim().toLowerCase())
      }
    });
    return set;
  }, [players, inactivePlayers, options]);

  // Main players first, other players middle, guest players last, inactive at the bottom
  const sortedOptions = useMemo(() => {
    return sortPlayersByTier(options, inactiveSet).map((p) =>
      typeof p === "string" ? p : p.name,
    );
  }, [options, inactiveSet]);

  const isInactive = (name) => {
    if (!name) return false;
    return inactiveSet.has(String(name).trim().toLowerCase());
  };

  function select(v) {
    if (isInactive(v)) return; // Cannot select inactive player
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  function handleGuestChange(e) {
    let val = e.target.value;
    if (!val.startsWith(GUEST_PREFIX)) {
      // If user attempted to delete/backspace into the prefix, restore it
      const suffix = val.replace(/^G?u?e?s?t?\s*[-–—]?\s*/i, "");
      val = GUEST_PREFIX + suffix;
    }
    setGuestText(val);
  }

  function handleGuestKeyDown(e) {
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    // Prevent Backspace or Delete inside the "Guest - " prefix
    if (e.key === "Backspace" && start <= GUEST_PREFIX.length && start === end) {
      e.preventDefault();
      return;
    }
    if (e.key === "Delete" && start < GUEST_PREFIX.length) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      confirmGuest();
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleGuestClick(e) {
    // If clicked inside the prefix, move cursor to right after prefix
    if (e.target.selectionStart < GUEST_PREFIX.length) {
      e.target.setSelectionRange(GUEST_PREFIX.length, GUEST_PREFIX.length);
    }
  }

  function formatAsGuest(text) {
    const cleaned = String(text || '').replace(/^Guest\s*[-–—:]\s*/i, '').trim();
    return `${GUEST_PREFIX}${cleaned}`;
  }

  function confirmGuest() {
    const suffix = guestText.slice(GUEST_PREFIX.length).trim();
    if (!suffix) return;
    select(formatAsGuest(suffix));
  }

  function switchToGuest(initialSuffix = "") {
    setMode('guest');
    const full = initialSuffix ? `${GUEST_PREFIX}${initialSuffix.trim()}` : GUEST_PREFIX;
    setGuestText(full);
    setTimeout(() => {
      if (guestInputRef.current) {
        guestInputRef.current.focus();
        guestInputRef.current.setSelectionRange(full.length, full.length);
      }
    }, 50);
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sortedOptions.filter((p) => p.toLowerCase().includes(q))
    : sortedOptions;

  const firstSelectable = filtered.find((p) => !isInactive(p));
  const valueIsInactive = isInactive(value);
  const isGuest = value && value.startsWith(GUEST_PREFIX);

  return (
    <div className="relative" ref={ref}>
      {open ? (
        <div className="border border-orange-400 dark:border-orange-500 rounded-lg bg-white dark:bg-slate-700 ring-2 ring-orange-400 overflow-hidden">
          {mode === 'select' ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setQuery('');
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filtered.length === 1 && !isInactive(filtered[0])) {
                      select(filtered[0]);
                    } else if (firstSelectable && filtered.length > 0) {
                      select(firstSelectable);
                    } else if (query.trim()) {
                      switchToGuest(query.trim());
                    }
                  }
                }}
                placeholder={value || placeholder}
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => switchToGuest(query.trim())}
                className="text-xs px-2 py-0.5 rounded font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition shrink-0 flex items-center gap-1 border border-orange-200 dark:border-orange-800/60"
                title="Switch to Guest free-text mode"
              >
                <UserPlus size={12} />
                <span>Guest -</span>
              </button>
              <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50/50 dark:bg-orange-950/20">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
                title="Back to Player List"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="flex-1 flex items-center bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 px-2.5 py-1">
                <input
                  ref={guestInputRef}
                  type="text"
                  value={guestText}
                  onChange={handleGuestChange}
                  onKeyDown={handleGuestKeyDown}
                  onClick={handleGuestClick}
                  onKeyUp={handleGuestClick}
                  placeholder="Guest - name"
                  className="w-full text-sm font-medium bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={confirmGuest}
                disabled={!guestText.slice(GUEST_PREFIX.length).trim()}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
              >
                OK
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2 border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400 text-left"
        >
          {value ? (
            <>
              {isGuest ? (
                <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-orange-200 dark:border-orange-800">
                  G
                </span>
              ) : (
                <Avatar name={value} photo={photoByName[value]} size="sm" />
              )}
              <span className="flex-1 truncate text-sm flex items-center gap-1.5">
                <span className={isGuest ? "font-semibold text-orange-700 dark:text-orange-300" : ""}>
                  {value}
                </span>
                {isGuest && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 px-1.5 py-0.2 rounded-md">
                    Guest
                  </span>
                )}
                {valueIsInactive && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-md">
                    Inactive
                  </span>
                )}
              </span>
            </>
          ) : (
            <span className="flex-1 text-sm text-slate-400">{placeholder}</span>
          )}
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </button>
      )}

      {open && mode === 'select' && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg py-1">
          {/* Quick option to switch to Guest mode or add typed query as Guest */}
          <div className="px-1.5 pb-1 mb-1 border-b dark:border-slate-700">
            {q ? (
              <button
                type="button"
                onClick={() => select(formatAsGuest(query.trim()))}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition text-left"
              >
                <UserPlus size={13} className="shrink-0" />
                <span className="truncate">
                  Add as Guest: <strong>{formatAsGuest(query.trim())}</strong>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchToGuest()}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold rounded-md text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition text-left"
              >
                <span className="flex items-center gap-1.5">
                  <UserPlus size={13} />
                  <span>Enter Guest (Free text: <strong>Guest - ...</strong>)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Switch</span>
              </button>
            )}
          </div>

          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400 text-center">
              No matching regular players.
            </p>
          )}

          {filtered.map((p) => {
            const inactive = isInactive(p)
            const isSelected = p === value
            return (
              <button
                key={p}
                type="button"
                disabled={inactive}
                onClick={() => select(p)}
                title={inactive ? `${p} is deactivated and cannot be selected` : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition ${
                  inactive
                    ? 'opacity-40 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/50 text-slate-400'
                    : isSelected
                    ? 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    : 'hover:bg-orange-50 dark:hover:bg-orange-900/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={p} photo={photoByName[p]} size="sm" />
                  <span
                    className={`text-sm truncate ${
                      inactive
                        ? 'text-slate-400 dark:text-slate-500 line-through'
                        : 'text-slate-800 dark:text-slate-100 font-medium'
                    }`}
                  >
                    {p}
                  </span>
                </div>
                {inactive && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <Ban size={9} /> Inactive
                  </span>
                )}
                {isSelected && (
                  <Check size={13} className="text-orange-600 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
