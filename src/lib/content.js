// Helpers for the editable site content.

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Lays `over` on top of `base`, section by section and field by field, so a
// field the server (or an old cached copy) doesn't have still gets its default.
// Lists are taken whole from `over`.
export function mergeContent(base, over) {
  if (!isPlainObject(over)) return base;
  const out = { ...base };
  for (const key of Object.keys(over)) {
    out[key] = isPlainObject(base?.[key]) && isPlainObject(over[key]) ? mergeContent(base[key], over[key]) : over[key];
  }
  return out;
}

// Text in the editor may contain {siteName} and {year}.
export function fillTokens(text, { siteName, year = new Date().getFullYear() }) {
  if (typeof text !== "string") return text;
  return text.replace(/\{siteName\}/g, siteName).replace(/\{year\}/g, String(year));
}

// Who a piece of content is meant for. Matches the choices in the admin editor.
export function matchesAudience(audience, user) {
  switch (audience) {
    case "guests":
      return !user;
    case "customers":
      return user?.role === "customer";
    case "guests_customers":
      return !user || user.role === "customer";
    case "vendors":
      return user?.role === "vendor";
    case "admins":
      return user?.role === "admin";
    default:
      return true; // "everyone"
  }
}
