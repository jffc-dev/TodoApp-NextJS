"use client";

export function StarRating({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (stars: number) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className="flex size-11 items-center justify-center rounded-full transition-transform active:scale-90 disabled:cursor-not-allowed"
          >
            <svg
              viewBox="0 0 24 24"
              className={`size-8 transition-colors ${
                active ? "fill-accent text-accent" : "fill-transparent text-muted/60"
              }`}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 2.8l2.83 5.73 6.33.92-4.58 4.46 1.08 6.3L12 17.24l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92L12 2.8z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
