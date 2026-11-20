import { useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Trophy } from "lucide-react";
import MatchesModal from "./MatchesModal";
import Avatar from "./Avatar";
import { localISODate } from "../lib/date";

function PlayersModal({ players, onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mt-8 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-4">
          Total Players{" "}
          <span className="text-slate-400 dark:text-slate-500 font-medium normal-case">
            ({players.length})
          </span>
        </h3>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {players.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Avatar name={name} size="sm" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function StatCards({ matches, players, allMatches = matches }) {
  const [showMatches, setShowMatches] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const today = localISODate();
  const startDate = "2026-03-01";
  const totalDays = Math.max(0, Math.floor((Date.parse(today) - Date.parse(startDate)) / 86400000) + 1);
  const sundaysPlayed = new Set(allMatches
    .filter(({ date }) => date >= startDate && date <= today && new Date(date + "T00:00:00Z").getUTCDay() === 0)
    .map(({ date }) => date)).size;
  const names = players.map((p) => (typeof p === "string" ? p : p.name));

  return (
    <div className="rounded-2xl bg-orange-600 text-white p-3 sm:p-5 grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center gap-2 sm:gap-4">
      <button
        type="button"
        onClick={() => setShowMatches(true)}
        className="min-w-0 flex items-center gap-1.5 sm:gap-3 text-left hover:opacity-90 transition"
      >
        <Activity size={32} className="size-5 sm:size-8 text-orange-200 shrink-0" />
        <div>
          <p className="text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-orange-100 whitespace-nowrap">
            Total Matches
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1">{matches.length}</p>
        </div>
      </button>
      <div className="w-px self-stretch bg-orange-400/40" />
      <button
        type="button"
        onClick={() => setShowPlayers(true)}
        className="justify-self-end min-w-0 flex items-center gap-1.5 sm:gap-3 text-left hover:opacity-90 transition"
      >
        <Trophy size={32} className="size-5 sm:size-8 text-orange-200 shrink-0" />
        <div>
          <p className="text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold uppercase tracking-wide text-orange-100 whitespace-nowrap">
            Total Players
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1">{players.length}</p>
        </div>
      </button>
      <p className="col-span-3 border-t border-orange-400/30 pt-2 text-center text-[10px] sm:text-xs text-orange-100 leading-relaxed">
        {totalDays} days since 1 Mar 2026 <span className="mx-1" aria-hidden="true">·</span> {sundaysPlayed} Sundays played
      </p>
      {showMatches && (
        <MatchesModal
          title="Matches in this period"
          matches={matches}
          onClose={() => setShowMatches(false)}
        />
      )}
      {showPlayers && (
        <PlayersModal players={names} onClose={() => setShowPlayers(false)} />
      )}
    </div>
  );
}
