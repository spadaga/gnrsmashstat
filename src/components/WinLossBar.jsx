export default function WinLossBar({ label, wins = 0, losses = 0, played = 0, max = 1, showLabel = true, showTotal = true }) {
  const total = played || wins + losses;
  const width = max > 0 ? Math.min(100, (total / max) * 100) : 0;
  const winShare = total ? (wins / total) * 100 : 0;
  const lossShare = total ? (losses / total) * 100 : 0;
  const labelCharacters = (wins ? `${wins}W`.length : 0) + (losses ? `${losses}L`.length : 0);
  const segmentCount = Number(wins > 0) + Number(losses > 0);
  return (
    <div className="flex items-center gap-2" aria-label={`${label}: ${wins} wins, ${losses} losses, ${total} total matches`}>
      {showLabel && <span title={label} className="w-24 sm:w-36 shrink-0 text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{label}</span>}
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full flex overflow-hidden rounded-full text-[11px]" style={{ width: `${width}%`, minWidth: `calc(${labelCharacters}ch + ${segmentCount * 24}px)`, maxWidth: "100%" }}>
            {wins > 0 && <span title={`${wins} wins`} style={{ width: `${winShare}%`, minWidth: "max-content" }} className="min-w-max h-full px-3 bg-emerald-500 flex items-center justify-center text-[11px] leading-none font-bold text-white whitespace-nowrap">{wins}W</span>}
            {losses > 0 && <span title={`${losses} losses`} style={{ width: `${lossShare}%`, minWidth: "max-content" }} className="min-w-max h-full px-3 bg-red-500 flex items-center justify-center text-[11px] leading-none font-bold text-white whitespace-nowrap">{losses}L</span>}
          </div>
        </div>
      </div>
      {showTotal && <span title="Total matches" className="w-8 shrink-0 text-right text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{total}</span>}
    </div>
  );
}
