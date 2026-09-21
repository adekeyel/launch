// Shown when a request FAILED — deliberately different from EmptyState, which
// means "the request worked and there's nothing here". Mixing the two makes an
// outage look like an empty marketplace.
export default function ErrorState({ title = "Couldn't load this", message, onRetry, className = "" }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-xl2 border border-chili/25 bg-chili-soft/60 px-6 py-14 text-center ${className}`}
    >
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {message && <p className="max-w-sm text-sm text-ink/60">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline mt-1">
          Try again
        </button>
      )}
    </div>
  );
}
