import { useEffect, useState } from "react";
import { getMyVendorProfile } from "../../services/vendors";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import ReviewList from "../../components/ReviewList";
import { errorMessage } from "../../lib/errors";

export default function VendorReviews() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setVendor(await getMyVendorProfile());
    } catch (err) {
      console.error("Failed to load vendor profile:", err);
      setError(errorMessage(err, "Couldn't load your reviews."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Reviews</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

      <div className="mt-8">
        {loading ? (
          <Loader label="Loading your reviews…" />
        ) : error ? (
          <ErrorState title="Couldn't load your reviews" message={error} onRetry={load} />
        ) : vendor.status !== "approved" ? (
          <EmptyState title="Reviews start after approval" hint="Customers can review your kitchen once it's approved and live." />
        ) : (
          <ReviewList vendorId={vendor.id} />
        )}
      </div>
    </div>
  );
}
