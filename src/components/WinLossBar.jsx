export default function WinLossBar({ label, wins = 0, losses = 0, played = 0, max = 1 }) {
  const total = played || wins + losses;
  const width = max > 0 ? Math.min(100, (total / max) * 100) : 0;
  const winShare = total ? (wins / total) * 100 : 0;
  const lossShare = total ? (losses / total) * 100 : 0;
  const winLabelWidth = wins ? `${wins}W`.length * 6 + 8 : 0;
  const lossLabelWidth = losses ? `${losses}L`.length * 6 + 8 : 0;
  return (
    <div className="flex items-center gap-2" aria-label={`${label}: ${wins} wins, ${losses} losses, ${total} total matches`}>
      <span title={label} className="w-24 sm:w-36 shrink-0 text-xs text-slate-600 dark:text-slate-300 truncate font-medium">{label}</span>
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full flex overflow-hidden rounded-full" style={{ width: `${width}%`, minWidth: winLabelWidth + lossLabelWidth, maxWidth: "100%" }}>
            {wins > 0 && <span title={`${wins} wins`} style={{ width: `${winShare}%`, minWidth: winLabelWidth }} className="min-w-0 h-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">{wins}W</span>}
            {losses > 0 && <span title={`${losses} losses`} style={{ width: `${lossShare}%`, minWidth: lossLabelWidth }} className="min-w-0 h-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">{losses}L</span>}
          </div>
        </div>
      </div>
      <span title="Total matches" className="w-8 shrink-0 text-right text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{total}</span>
    </div>
  );
}
