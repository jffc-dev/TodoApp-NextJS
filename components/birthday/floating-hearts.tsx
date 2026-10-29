// Corazones que suben lentamente de fondo. Posiciones deterministas (sin Math.random)
// para que el HTML del servidor y el del cliente coincidan.
export function FloatingHearts({ count = 14 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37 + 11) % 100;
        const size = 12 + ((i * 7) % 18);
        const duration = 11 + ((i * 5) % 9);
        const delay = -((i * 3.7) % duration);
        const drift = ((i % 2 ? 1 : -1) * (10 + ((i * 13) % 40))).toString() + "px";
        return (
          <span
            key={i}
            className="bday-motion absolute -bottom-10 text-sky-300"
            style={
              {
                left: `${left}%`,
                fontSize: size,
                animation: `heart-rise ${duration}s linear ${delay}s infinite`,
                "--heart-drift": drift,
                "--heart-opacity": 0.25 + ((i * 3) % 5) / 10,
              } as React.CSSProperties
            }
          >
            ♥
          </span>
        );
      })}
    </div>
  );
}
