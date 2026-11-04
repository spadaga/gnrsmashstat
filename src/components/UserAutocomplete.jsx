import { useState, useRef, useEffect, useMemo } from "react";
import { User, X, Check, Plus } from "lucide-react";
import Avatar from "./Avatar";

export default function UserAutocomplete({
  value = "",
  onChange,
  players = [],
  photoByName = {},
  placeholder = "Select or type user name...",
  label = "Logged By",
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Extract unique sorted player names
  const allNames = useMemo(() => {
    const list = players
      .map((p) => (typeof p === "string" ? p : p?.name))
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [players]);

  const q = query.trim().toLowerCase();

  const filteredNames = useMemo(() => {
    if (!q) return allNames;
    return allNames.filter((name) => name.toLowerCase().includes(q));
  }, [allNames, q]);

  const exactMatch = allNames.some((name) => name.toLowerCase() === q);

  function selectName(name) {
    const trimmed = name.trim();
    setQuery(trimmed);
    onChange(trimmed);
    setOpen(false);
    setHighlightIndex(-1);
  }

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
    setHighlightIndex(-1);
  }

  function handleKeyDown(e) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    const totalOptions = filteredNames.length + (q && !exactMatch ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < totalOptions ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      if (open && highlightIndex >= 0) {
        e.preventDefault();
        if (highlightIndex < filteredNames.length) {
          selectName(filteredNames[highlightIndex]);
        } else if (q && !exactMatch) {
          selectName(query.trim());
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightIndex(-1);
    }
  }

  function handleClear() {
    setQuery("");
    onChange("");
    setOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }

  const isKnownPlayer = allNames.includes(value);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User size={14} className="text-orange-600" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Autocomplete or enter new name
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {value && isKnownPlayer && (
          <div className="absolute left-2.5 z-10 pointer-events-none">
            <Avatar name={value} photo={photoByName[value]} size="xs" />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full border dark:border-slate-600 rounded-lg py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm ${
            value && isKnownPlayer ? "pl-9 pr-8" : "px-3 pr-8"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 rounded-full"
            title="Clear user name"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1 text-xs">
          {filteredNames.length > 0 && (
            <div className="space-y-0.5">
              {filteredNames.map((name, idx) => {
                const isSelected = value.toLowerCase() === name.toLowerCase();
                const isHighlighted = highlightIndex === idx;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectName(name)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      isHighlighted
                        ? "bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200"
                        : isSelected
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar name={name} photo={photoByName[name]} size="xs" />
                      <span className="truncate">{name}</span>
                    </div>
                    {isSelected && (
                      <Check size={13} className="text-orange-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* If the typed query is not an existing player, offer "Add / Use new user name" */}
          {q && !exactMatch && (
            <div
              className={
                filteredNames.length > 0
                  ? "pt-1 mt-1 border-t dark:border-slate-700"
                  : ""
              }
            >
              <button
                type="button"
                onClick={() => selectName(query.trim())}
                onMouseEnter={() => setHighlightIndex(filteredNames.length)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
                  highlightIndex === filteredNames.length
                    ? "bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200"
                    : "hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                  <Plus size={12} />
                </span>
                <span className="truncate">
                  Add / Use "<strong>{query.trim()}</strong>" as user name
                </span>
              </button>
            </div>
          )}

          {filteredNames.length === 0 && !q && (
            <div className="px-3 py-2 text-slate-400 text-center">
              Type a name to search or add...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

