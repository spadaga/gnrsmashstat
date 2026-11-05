import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Ban, Check, ChevronDown } from 'lucide-react'
import Avatar from './Avatar'
import { sortPlayersByTier } from '../lib/ranking'

export default function PlayerPicker({
  value,
  onChange,
  options = [],
  players = [],
  inactivePlayers = [],
  photoByName = {},
  placeholder = 'Select or type player name',
}) {
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef(null)
  const pickerRef = useRef(null)
  const listId = useId()
  const nameOf = (p) => typeof p === 'string' ? p : p.name

  useEffect(() => {
    if (!open) return
    function closeOutside(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false)
        setSearching(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const inactiveSet = useMemo(() => {
    const names = inactivePlayers.map((name) => String(name).trim().toLowerCase())
    for (const player of [...players, ...options]) {
      if (typeof player === 'object' && player.inactive && player.name) {
        names.push(player.name.trim().toLowerCase())
      }
    }
    return new Set(names)
  }, [players, options, inactivePlayers])

  const sortedOptions = useMemo(
    () => sortPlayersByTier(options, inactiveSet).map(nameOf),
    [options, inactiveSet],
  )
  const isInactive = (name) => inactiveSet.has(name.trim().toLowerCase())
  const query = searching ? (value || '').trim().toLowerCase() : ''
  const filtered = sortedOptions.filter((name) => name.toLowerCase().includes(query))

  function normalize(text) {
    const trimmed = text.trim()
    // Preserve the registered spelling, including for inactive players so the
    // match form can enforce its existing inactive-player validation.
    return [...players, ...options].map(nameOf).find(
      (name) => name.toLowerCase() === trimmed.toLowerCase(),
    ) || trimmed
  }

  function select(name) {
    if (isInactive(name)) return
    onChange(name)
    setOpen(false)
    setSearching(false)
    setHighlighted(-1)
  }

  return (
    <div
      ref={pickerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onChange(normalize(value || ''))
          // Touch browsers can blur with no next focus target before a
          // suggestion's click. Outside pointer events handle that case.
          if (event.relatedTarget) {
            setOpen(false)
            setSearching(false)
            setHighlighted(-1)
          }
        }
      }}
    >
      <div className="flex items-center border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-orange-400">
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          enterKeyHint="done"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
          autoComplete="off"
          value={value || ''}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
            setSearching(false)
          }}
          onChange={(event) => {
            onChange(event.target.value)
            setSearching(true)
            setOpen(true)
            setHighlighted(-1)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              const direction = event.key === 'ArrowDown' ? 1 : -1
              let next = highlighted
              for (let step = 0; step < filtered.length; step++) {
                next = (next + direction + filtered.length) % filtered.length
                if (!isInactive(filtered[next])) {
                  setHighlighted(next)
                  break
                }
              }
            } else if (event.key === 'Enter') {
              event.preventDefault()
              if (open && highlighted >= 0 && filtered[highlighted]) {
                select(filtered[highlighted])
              } else {
                onChange(normalize(value || ''))
                setOpen(false)
                setSearching(false)
              }
            } else if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
              setHighlighted(-1)
            }
          }}
          className="flex-1 min-w-0 min-h-7 bg-transparent text-base sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          aria-label="Show player suggestions"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            inputRef.current?.focus()
            setSearching(false)
            setOpen(true)
          }}
          className="ml-2 text-slate-400"
        >
          <ChevronDown size={14} />
        </button>
      </div>
      {open && (
        <div id={listId} role="listbox" className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400">
              No matching players. Keep typing to enter a name.
            </p>
          )}
          {filtered.map((name, index) => {
            const inactive = isInactive(name)
            return (
              <button
                key={name}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={name === value}
                disabled={inactive}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(name)}
                className={`w-full min-h-11 flex items-center justify-between gap-2 px-3 py-2 text-left text-sm ${inactive ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-800 dark:text-slate-100 hover:bg-orange-50 dark:hover:bg-orange-900/20'} ${index === highlighted || name === value ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Avatar name={name} photo={photoByName[name]} size="sm" />
                  <span className="truncate">{name}</span>
                </span>
                {inactive ? (
                  <span className="flex items-center gap-1 text-[10px]"><Ban size={9} /> Inactive</span>
                ) : name === value ? <Check size={13} className="text-orange-600 shrink-0" /> : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
