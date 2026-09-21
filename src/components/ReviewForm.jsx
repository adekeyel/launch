import { useState } from "react";
import { reviewOrder } from "../services/orders";
import { StarInput } from "./StarRating";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";

const MAX_COMMENT = 1000;

// "How was your order?" — shown under a delivered order that hasn't been
// reviewed yet. onSubmitted(rating) lets the parent switch to the read-only view.
export default function ReviewForm({ orderId, vendorName, onSubmitted }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Tap a star to rate your order.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await reviewOrder(orderId, { rating, comment: comment.trim() });
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
