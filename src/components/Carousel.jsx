import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Carousel({ items, interval = 4000 }) {
  const [index, setIndex] = useState(0)
  const currentIndex = Math.max(0, Math.min(index, items.length - 1))

  useEffect(() => {
    setIndex(0)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval)
    return () => clearInterval(id)
  }, [items.length, interval])

  return (
    <div className="relative overflow-hidden rounded-xl" role="region" aria-label="Photo gallery slideshow">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, i) => (
          <div key={item.key || i} className="w-full shrink-0">
            {(i === currentIndex || i === (currentIndex + 1) % items.length || i === (currentIndex - 1 + items.length) % items.length) ? item : null}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <>
          <button type="button" onClick={() => setIndex((currentIndex - 1 + items.length) % items.length)} aria-label="Previous gallery photo" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 hover:bg-black/65 text-white p-3 transition"><ChevronLeft size={20} /></button>
          <button type="button" onClick={() => setIndex((currentIndex + 1) % items.length)} aria-label="Next gallery photo" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 hover:bg-black/65 text-white p-3 transition"><ChevronRight size={20} /></button>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 text-white text-xs px-3 py-1">{currentIndex + 1} / {items.length}</span>
        </>
      )}
    </div>
  )
}
