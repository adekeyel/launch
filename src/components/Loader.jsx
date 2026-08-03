export default function Loader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-ink/50">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-marigold" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
