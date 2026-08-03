export default function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-ink/15 px-6 py-16 text-center">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-ink/55">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
