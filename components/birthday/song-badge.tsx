// Título de la canción bajo las barras de progreso, como la música en las stories de Instagram:
// ecualizador animado + texto que se desplaza.
export function SongBadge({ title, playing }: { title: string; playing: boolean }) {
  return (
    <div className="flex max-w-[15rem] min-w-0 items-center gap-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
      <span aria-hidden className="flex h-3.5 shrink-0 items-end gap-[2px]">
        {[0.9, 0.6, 1.1, 0.75].map((duration, i) => (
          <span
            key={i}
            className="bday-motion h-full w-[3px] origin-bottom rounded-full bg-white"
            style={{
              animation: playing ? `eq-bar ${duration}s ease-in-out ${i * -0.2}s infinite` : "none",
              transform: playing ? undefined : "scaleY(0.3)",
            }}
          />
        ))}
      </span>

      <div
        className="min-w-0 flex-1 overflow-hidden"
        style={{ maskImage: "linear-gradient(to right, transparent, #000 8%, #000 88%, transparent)" }}
      >
        <p
          className="bday-motion flex w-max font-sans text-[13px] font-medium whitespace-nowrap"
          style={{ animation: `marquee ${Math.max(8, title.length * 0.35)}s linear infinite` }}
          aria-label={title}
        >
          {/* Duplicado para que el desplazamiento sea continuo */}
          <span className="pr-10">♫ {title}</span>
          <span className="pr-10" aria-hidden>
            ♫ {title}
          </span>
        </p>
      </div>
    </div>
  );
}
