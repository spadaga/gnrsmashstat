import { useEffect, useState } from 'react'

export default function Carousel({ items, interval = 4000 }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval)
    return () => clearInterval(id)
  }, [items.length, interval])

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="w-full shrink-0">
            {item}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-orange-600' : 'bg-white/70'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
