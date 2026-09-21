import { useCallback, useEffect, useState } from "react";
import { listVendorReviews } from "../services/vendors";
import { StarRating } from "./StarRating";
import ErrorState from "./ErrorState";
import { Skeleton } from "./Skeleton";
import { errorMessage } from "../lib/errors";
import { formatDay } from "../lib/format";

const PAGE_SIZE = 10;

// A vendor's reviews: rating summary on top, newest first, "Show more" for
// the rest. Used on the public menu page and in the vendor dashboard.
export default function ReviewList({ vendorId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avg: null, count: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [moreError, setMoreError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listVendorReviews(vendorId, { page: 1, limit: PAGE_SIZE });
      setReviews(data.reviews);
      setSummary({ avg: data.rating_avg, count: data.rating_count, total: data.total });
      setPage(1);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError(errorMessage(err, "We couldn't load reviews."));
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const showMore = async () => {
    setLoadingMore(true);
    setMoreError("");
    try {
      const data = await listVendorReviews(vendorId, { page: page + 1, limit: PAGE_SIZE });
      setReviews((list) => [...list, ...data.reviews]);
      setPage(page + 1);
    } catch (err) {
      console.error("Failed to load more reviews:", err);
      setMoreError(errorMessage(err, "Couldn't load more reviews."));
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <span className="sr-only">Loading reviews…</span>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState title="Couldn't load reviews" message={error} onRetry={load} />;

  if (summary.count === 0 && reviews.length === 0) {
    return <p className="text-sm text-ink/50">No reviews yet. Reviews appear here after customers rate a delivered order.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-display text-4xl font-bold text-ink">{Number(summary.avg).toFixed(1)}</span>
        <div>
          <StarRating value={summary.avg} className="h-5 w-5" />
          <p className="mt-0.5 text-xs text-ink/50">
            {summary.count} review{summary.count === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-line">
        {reviews.map((review) => (
          <li key={review.id} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StarRating value={review.rating} />
                <span className="text-sm font-semibold text-ink">{review.customer_name}</span>
              </div>
              <span className="text-xs text-ink/40">{formatDay(review.created_at)}</span>
            </div>
            {review.comment && <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{review.comment}</p>}
          </li>
        ))}
      </ul>

      {reviews.length < summary.total && (
        <div className="mt-2">
          {moreError && <p className="mb-2 text-sm text-chili">{moreError}</p>}
          <button type="button" onClick={showMore} disabled={loadingMore} className="btn-outline">
            {loadingMore ? "Loading…" : "Show more reviews"}
          </button>
        </div>
      )}
    </div>
  );
}
