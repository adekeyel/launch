import { IconStar } from "./icons";

// Read-only row of five stars.
export function StarRating({ value, className = "h-4 w-4" }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5 text-marigold" role="img" aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} filled={n <= filled} className={`${className} ${n <= filled ? "" : "text-ink/20"}`} />
      ))}
    </span>
  );
}

// "★ 4.6 (12)" — renders nothing until there's at least one review.
export function RatingSummary({ avg, count, className = "" }) {
  if (!count || avg == null) return null;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={`${Number(avg).toFixed(1)} out of 5, ${count} review${count === 1 ? "" : "s"}`}>
      <IconStar filled className="h-3.5 w-3.5 text-marigold" />
      <span className="font-semibold text-ink/70">{Number(avg).toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}

// Tap-to-rate control (a radio group, so it works with a keyboard too).
export function StarInput({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="Your rating" className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          className="rounded p-0.5 text-marigold transition hover:scale-110 disabled:opacity-50"
        >
          <IconStar filled={n <= value} className={`h-8 w-8 ${n <= value ? "" : "text-ink/25"}`} />
        </button>
      ))}
    </div>
  );
}
