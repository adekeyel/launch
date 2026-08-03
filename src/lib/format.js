export function formatMoney(value) {
  const n = Number(value || 0);
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Short, receipt-style order code from a UUID, e.g. "LT-8F3A2C"
export function orderCode(id) {
  if (!id) return "LT-000000";
  return `LT-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
