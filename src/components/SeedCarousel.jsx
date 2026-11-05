import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const DELAY = 4500;

export default function SeedCarousel({ children }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const gesture = useRef(null);
  const trackId = useId();
  const count = children.length;
  const playing = count > 1 && !paused && !hovered && !focused && !touching && !reducedMotion && visible;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setActive((index) => (index + 1) % count), DELAY);
    return () => clearTimeout(timer);
  }, [active, count, playing]);

  const move = (direction) => setActive((index) => (index + direction + count) % count);

  return (
    <section
      aria-label="Top three seeds"
      aria-roledescription="carousel"
      className="seed-carousel relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div
        className="overflow-hidden rounded-2xl touch-pan-y"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          gesture.current = { x: touch.clientX, y: touch.clientY };
          setTouching(true);
        }}
        onTouchEnd={(event) => {
          const start = gesture.current;
          const touch = event.changedTouches[0];
          if (start && touch) {
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
          }
          gesture.current = null;
          setTouching(false);
        }}
        onTouchCancel={() => {
          gesture.current = null;
          setTouching(false);
        }}
      >
        <div id={trackId} className="seed-carousel-track flex" style={{ transform: `translateX(-${active * 100}%)` }}>
          {children.map((card, index) => (
            <div
              key={card.key || index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${count}`}
              aria-hidden={index !== active}
              inert={index !== active}
              className={`seed-carousel-slide w-full min-w-0 shrink-0 ${index === active ? "is-active" : ""}`}
            >
              {card}
            </div>
          ))}
        </div>
      </div>
      {count > 1 && (
        <div className="absolute inset-x-4 bottom-1 z-10 flex items-center justify-between gap-3 pointer-events-none">
          <span className="text-[10px] font-bold tracking-widest text-white/90">{active + 1}/{count}</span>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-auto" aria-label="Choose a top seed">
            {children.map((card, index) => (
              <button
                key={card.key || index}
                type="button"
                aria-label={`Show top seed ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                aria-controls={trackId}
                onClick={() => setActive(index)}
                className="flex items-center justify-center min-w-8 min-h-11 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
              >
                <span className={`seed-carousel-dot ${index === active ? "is-active" : ""}`} />
              </button>
            ))}
          </div>
          <div className="pointer-events-auto">
            {!reducedMotion && (
              <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Start automatic slides" : "Pause automatic slides"} aria-pressed={paused} className="seed-carousel-control">
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
