// A row of pill filters that scrolls sideways on narrow screens.
//   options: string[]           value: currently selected option or ""
//   onChange(option | "")       allLabel: text for the "no filter" pill
export default function CategoryChips({ options, value, onChange, allLabel = "All", label = "Filter by category" }) {
  if (!options.length) return null;

  const chip = (active) =>
    `h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
      active ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white text-ink/70 hover:border-ink/30 hover:text-ink"
    }`;

  return (
    <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <button type="button" onClick={() => onChange("")} aria-pressed={!value} className={chip(!value)}>
        {allLabel}
      </button>
      {options.map((option) => {
        const active = value.toLowerCase() === option.toLowerCase();
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(active ? "" : option)}
            aria-pressed={active}
            className={chip(active)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
