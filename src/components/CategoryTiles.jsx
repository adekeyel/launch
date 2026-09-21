import { Link } from "react-router-dom";
import { Skeleton } from "./Skeleton";

// "Shop by category": one card per kitchen category, straight from the data.
export default function CategoryTiles({ categories, loading, limit = 12 }) {
  if (loading && categories.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" role="status" aria-busy="true">
        <span className="sr-only">Loading categories…</span>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl2" />
        ))}
      </div>
    );
  }
  if (categories.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.slice(0, limit).map(({ label, count }) => (
        <li key={label}>
          <Link
            to={`/vendors?category=${encodeURIComponent(label)}`}
            className="card flex h-full items-center gap-3 p-3 transition hover:shadow-ticket"
          >
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marigold-soft font-display text-lg font-bold text-marigold-dark"
            >
              {label[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{label}</span>
              <span className="block text-xs text-ink/45">
                {count} kitchen{count === 1 ? "" : "s"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
