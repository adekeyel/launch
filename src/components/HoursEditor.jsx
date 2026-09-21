import { DAYS, DEFAULT_WINDOW, closesAfterMidnight } from "../lib/hours";

// Seven rows: is the kitchen open that day, and from/to what time (Lagos time).
//   hours: { mon: {open, close} | null, ... }     onChange(nextHours)
export default function HoursEditor({ hours, onChange }) {
  const setDay = (key, value) => onChange({ ...hours, [key]: value });

  const copyMondayToOpenDays = () => {
    const monday = hours.mon;
    if (!monday) return;
    const next = { ...hours };
    DAYS.forEach((d) => {
      if (next[d.key]) next[d.key] = { ...monday };
    });
    onChange(next);
  };

  return (
    <div>
      <ul className="divide-y divide-line">
        {DAYS.map((day) => {
          const window = hours[day.key];
          return (
            <li key={day.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <label className="flex w-36 items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(window)}
                  onChange={(e) => setDay(day.key, e.target.checked ? { ...DEFAULT_WINDOW } : null)}
                  className="h-4 w-4 rounded border-ink/30"
                />
                {day.label}
              </label>
              {window ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink/60">
                  <input
                    type="time"
                    aria-label={`${day.label} opens at`}
                    value={window.open}
                    onChange={(e) => setDay(day.key, { ...window, open: e.target.value })}
                    className="field-input h-10 w-32 px-2"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    aria-label={`${day.label} closes at`}
                    value={window.close}
                    onChange={(e) => setDay(day.key, { ...window, close: e.target.value })}
                    className="field-input h-10 w-32 px-2"
                  />
                  {closesAfterMidnight(window) && <span className="text-xs text-ink/45">closes after midnight</span>}
                </div>
              ) : (
                <span className="text-sm text-ink/40">Closed</span>
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={copyMondayToOpenDays} disabled={!hours.mon} className="btn-outline mt-3 h-9 px-4 text-xs">
        Copy Monday's hours to every open day
      </button>
    </div>
  );
}
