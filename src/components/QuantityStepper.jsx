import { IconMinus, IconPlus } from "./icons";

export default function QuantityStepper({ value, onChange, min = 0, disabled }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-ink/15 bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:text-ink disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <IconMinus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center font-mono text-sm font-semibold text-ink">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:text-ink disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <IconPlus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
