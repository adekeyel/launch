// Loading placeholders shaped like the content they stand in for, so the page
// doesn't jump when data arrives.

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-ink/10 ${className}`} />;
}

export function VendorCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-3 px-4 pb-4 pt-6">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function FoodCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-3 px-4 pb-4 pt-3">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// className supplies the grid columns so it matches the page it replaces.
export function CardGridSkeleton({ count = 4, variant = "vendor", className = "" }) {
  const Card = variant === "food" ? FoodCardSkeleton : VendorCardSkeleton;
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="divide-y divide-line" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 py-5" aria-hidden="true">
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function VendorMenuSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading menu…</span>
      <Skeleton className="h-48 w-full rounded-none sm:h-64" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6" aria-hidden="true">
        <Skeleton className="-mt-10 h-20 w-20 rounded-2xl border-4 border-paper" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <FoodCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FoodDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <span className="sr-only">Loading dish…</span>
      <div className="grid gap-8 sm:grid-cols-2" aria-hidden="true">
        <Skeleton className="aspect-square w-full rounded-xl2" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="mt-6 h-8 w-28" />
          <Skeleton className="mt-6 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Stands in for the hero banner + promo tiles while the ads load, so the top
// of the home page doesn't jump when they arrive.
export function HeroSkeleton() {
  return (
    <div className="h-full w-full animate-pulse rounded-xl2 bg-ink/10" role="status" aria-busy="true">
      <span className="sr-only">Loading offers…</span>
    </div>
  );
}
