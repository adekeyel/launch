// Small "Open" / "Closed" / "Paused" pill. Vendors that never set opening
// hours are simply always open, so we don't badge them "Open" — that would be
// noise on every card — we only badge when there's real information.
//   status: "open" | "closed" | "paused"     label: e.g. "Opens 8:00 AM"
//   overImage: true when drawn on top of a banner photo
export default function OpenBadge({ status = "open", label, overImage = false, className = "" }) {
  if (status === "open" && !label) return null;

  // Over a photo the "closed" pill needs a solid light background to stay readable.
  const quiet = overImage ? "bg-white/90 text-ink/70" : "bg-ink/10 text-ink/70";
  const styles = {
    open: "bg-basil-soft text-basil",
    closed: quiet,
    paused: quiet,
  };
  const text = { open: "Open", closed: "Closed", paused: "Paused" };

  return (
    <span
      title={label || undefined}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.open} ${className}`}
    >
      {text[status] || text.open}
    </span>
  );
}
