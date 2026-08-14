// Player avatar: shows the uploaded photo if there is one, otherwise a
// colored circle with initials. Color is derived from the name so a given
// player always gets the same fallback color.
const COLORS = [
  'bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-indigo-500',
]

function colorFor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function initials(name) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

const SIZES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-20 h-20 text-xl',
}

export default function Avatar({ name, photo, size = 'sm', className = '' }) {
  const sizeCls = SIZES[size] || SIZES.sm
  if (photo) {
    return <img src={photo} alt={name} className={`${sizeCls} rounded-full object-cover shrink-0 ${className}`} />
  }
  return (
    <span className={`${sizeCls} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${colorFor(name || '')} ${className}`}>
      {initials(name || '')}
    </span>
  )
}
