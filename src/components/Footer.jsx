export default function Footer() {
  const year = new Date().getFullYear()
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <footer className="border-t dark:border-slate-700 bg-white dark:bg-slate-800 mt-8">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
        <span>© {year} <span className="font-semibold text-orange-600">GNR SmashStats</span>. All rights reserved.</span>
        <span className="flex items-center gap-1">
          🏸 GNR Team &nbsp;·&nbsp; {today}
        </span>
      </div>
    </footer>
  )
}