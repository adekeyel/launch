export const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export const DEFAULT_WINDOW = { open: "08:00", close: "21:00" };

// Starting point when a vendor switches opening hours on.
export function defaultHours() {
  return Object.fromEntries(DAYS.map((d) => [d.key, d.key === "sun" ? null : { ...DEFAULT_WINDOW }]));
}

// Whatever the API returned (an object, null, or missing days) -> all seven days.
export function normalizeHours(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    DAYS.map((d) => [d.key, source[d.key] ? { open: source[d.key].open, close: source[d.key].close } : null])
  );
}

// A close time earlier than the open time means "after midnight".
export function closesAfterMidnight(window) {
  return Boolean(window && window.open && window.close && window.close < window.open);
}
