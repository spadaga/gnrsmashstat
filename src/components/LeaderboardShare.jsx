import { useState } from "react";
import { Copy, Share2, X } from "lucide-react";
import { localISODate } from "../lib/date";

export default function LeaderboardShare({ rows, ranks, mode, periodLabel }) {
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const title = `GNR SmashStats Leaderboard · ${periodLabel} · ${mode === "singles" ? "Singles" : "Doubles"}`;
  const text = [
    title,
    `As of ${localISODate()}`,
    "",
    ...rows.map((row, index) => `${ranks[index] ?? "NA"}. ${mode === "singles" ? row.name : row.players.join(" & ")} — ${row.wins}W / ${row.losses}L · ${row.played} played · ${row.winRate}% wins`),
    "",
    "https://gnrsmashstat.vercel.app/",
  ].join("\n");

  async function share() {
    setMessage("");
    if (!navigator.share) {
      setShowOptions(true);
      return;
    }
    setBusy(true);
    try {
      await navigator.share({ title, text });
    } catch (error) {
      if (error.name !== "AbortError") setShowOptions(true);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Leaderboard copied. Paste it into any app.");
    } catch {
      setMessage("Select and copy the text below to share it.");
    }
  }

  return (
    <>
      <button type="button" onClick={share} disabled={busy || !rows.length}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 disabled:opacity-40"
        title="Share selected leaderboard" aria-label="Share leaderboard">
        <Share2 size={15} /> Share
      </button>
      {showOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => event.target === event.currentTarget && setShowOptions(false)}
          onKeyDown={(event) => event.key === "Escape" && setShowOptions(false)}>
          <section role="dialog" aria-modal="true" aria-label="Share leaderboard"
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Share leaderboard</h3>
              <button type="button" autoFocus onClick={() => setShowOptions(false)} aria-label="Close share options" className="p-2 text-slate-500"><X size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"
                className="rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-semibold">WhatsApp</a>
              <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-3 py-2 text-sm font-semibold"><Copy size={15} /> Copy text</button>
            </div>
            <textarea readOnly value={text} aria-label="Leaderboard sharing text" rows={9}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent p-2 text-xs text-slate-700 dark:text-slate-200" />
            <p role="status" className="mt-2 text-xs text-slate-500 dark:text-slate-400">{message}</p>
          </section>
        </div>
      )}
    </>
  );
}
