import { useState } from "react";
import { reviewOrder } from "../services/orders";
import { StarInput } from "./StarRating";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";

const MAX_COMMENT = 1000;

// "How was your order?" — shown under a delivered order that hasn't been
// reviewed yet. onSubmitted(rating) lets the parent switch to the read-only view.
// `items` (optional) lets the customer also rate individual dishes from this
// same order, and `riderId` (optional) shows a "rate your rider" row when
// this order actually had one (self-delivered orders won't pass it) —
// everything extra here is skippable, only the overall rating is required.
export default function ReviewForm({ orderId, vendorName, items = [], riderId = null, onSubmitted }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [itemRatings, setItemRatings] = useState({});
  const [riderRating, setRiderRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // A dish ordered twice shows up once here — one rating covers it.
  const uniqueItems = items.filter((item, i) => item.food_id && items.findIndex((x) => x.food_id === item.food_id) === i);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Tap a star to rate your order.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const ratedItems = Object.entries(itemRatings)
        .filter(([, r]) => r > 0)
        .map(([foodId, r]) => ({ foodId, rating: r }));
      await reviewOrder(orderId, {
        rating,
        comment: comment.trim(),
        items: ratedItems,
        riderRating: riderId && riderRating > 0 ? riderRating : undefined,
      });
      toast.success("Thanks for your review.");
      onSubmitted(rating);
    } catch (err) {
      console.error("Failed to submit review:", err);
      // Already reviewed (e.g. from another tab): show it as reviewed.
      if (err?.status === 409) {
        toast.info("You've already reviewed this order.");
        onSubmitted(rating);
        return;
      }
      setError(errorMessage(err, "Couldn't send your review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">How was your order{vendorName ? ` from ${vendorName}` : ""}?</p>
      <div className="mt-2">
        <StarInput value={rating} onChange={setRating} disabled={submitting} />
      </div>
      <label htmlFor={`review-${orderId}`} className="sr-only">
        Comment (optional)
      </label>
      <textarea
        id={`review-${orderId}`}
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
        rows={3}
        disabled={submitting}
        placeholder="Tell others what you liked (optional)"
        className="field-input mt-3 h-auto py-2.5"
      />

      {riderId && (
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3">
          <span className="text-sm font-medium text-ink/70">Rate your rider (optional)</span>
          <StarInput size="sm" value={riderRating} onChange={setRiderRating} disabled={submitting} />
        </div>
      )}

      {uniqueItems.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-dashed border-line pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Rate individual dishes (optional)</p>
          {uniqueItems.map((item) => (
            <div key={item.food_id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink/70">{item.food_name}</span>
              <StarInput
                size="sm"
                value={itemRatings[item.food_id] || 0}
                onChange={(v) => setItemRatings((r) => ({ ...r, [item.food_id]: v }))}
                disabled={submitting}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-chili">
          {error}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn-primary mt-3">
        {submitting ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
