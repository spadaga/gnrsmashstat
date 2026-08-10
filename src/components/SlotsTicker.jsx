// Scrolling horizontal ticker showing court slot names and days remaining.
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d }

function daysLeft(endDate) {
  return Math.round((new Date(`${endDate}T00:00:00`) - today()) / 86400000)
}

export default function SlotsTicker({ slots }) {
  if (!slots || slots.length === 0) return null
  const sorted = [...slots].sort((a, b) => (a.endDate < b.endDate ? -1 : 1))

  // Duplicate items for seamless loop
  const items = [...sorted, ...sorted]

  return (
    <div className="overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-xl py-2 px-0 relative">
      <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {items.map((s, i) => {
          const days = daysLeft(s.endDate)
          const expiring = days < 10
          return (
            <span key={i} className="inline-flex items-center gap-2 px-5 text-sm">
              <span className="font-semibold text-white">{s.name}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                expiring
                  ? 'bg-red-500 text-white'
                  : 'bg-orange-600 text-white'
              }`}>
                {days < 0 ? `Expired ${-days}d` : `${days}d`}
              </span>
              <span className="text-slate-600 mx-2">·</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}