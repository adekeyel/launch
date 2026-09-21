import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getFood } from "../services/foods";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import QuantityStepper from "../components/QuantityStepper";
import { FoodDetailsSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useAddToCart } from "../hooks/useAddToCart";
import { usePageTitle } from "../hooks/usePageTitle";
import { errorMessage, isNotFound } from "../lib/errors";
import { formatMoney } from "../lib/format";
import { optimizedImage } from "../lib/media";

export default function FoodDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, addingId } = useAddToCart();
  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  usePageTitle(food?.name, food?.description ? food.description.slice(0, 155) : undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    setAdded(false);
    try {
      setFood(await getFood(id));
    } catch (err) {
      console.error("Failed to load food item:", err);
      if (isNotFound(err)) setNotFound(true);
      else setError(errorMessage(err, "We couldn't load this dish."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const adding = addingId === food?.id;

  const handleAdd = async () => {
    const ok = await addToCart(food, qty);
    if (ok) setAdded(true);
  };

  if (loading) return <FoodDetailsSkeleton />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <EmptyState title="Dish not found" hint="It may have been removed or is no longer available." />
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <ErrorState title="Couldn't load this dish" message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl2 bg-ink/5">
          {food.image ? (
            food.media_type === "video" ? (
              <video src={food.image} className="h-full w-full object-cover" controls />
            ) : (
              <img src={optimizedImage(food.image, 1000)} alt={food.name} className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-6xl font-extrabold text-ink/15">
              {food.name?.[0]}
            </div>
          )}
        </div>

        <div>
          {food.business_name && (
            <Link to={`/vendors/${food.vendor_id}`} className="text-sm font-semibold text-marigold-dark hover:underline">
              {food.business_name}
            </Link>
          )}
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{food.name}</h1>
          {food.category && (
            <span className="mt-2 inline-block rounded-full bg-basil-soft px-2.5 py-1 text-xs font-medium text-basil">
              {food.category}
            </span>
          )}
          {food.description && <p className="mt-4 text-sm leading-relaxed text-ink/60">{food.description}</p>}

          <p className="mt-6 font-mono text-2xl font-bold text-ink">{formatMoney(food.price)}</p>

          {!food.is_available ? (
            <p className="mt-6 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink/55">
              This item isn't available right now.
            </p>
          ) : food.vendor_is_open === false ? (
            <p role="status" className="mt-6 rounded-xl bg-ink/5 px-4 py-3 text-sm text-ink/60">
              {food.business_name || "This kitchen"} is closed right now
              {food.vendor_open_label ? `. ${food.vendor_open_label}` : ""}. You can order when they open.
            </p>
          ) : (
            <div className="mt-6 flex items-center gap-4">
              <QuantityStepper value={qty} onChange={setQty} min={1} />
              <button onClick={handleAdd} disabled={adding} className="btn-accent flex-1">
                {adding ? "Adding…" : added ? "Added to cart ✓" : "Add to cart"}
              </button>
            </div>
          )}
          {added && (
            <Link to="/cart" className="mt-3 inline-block text-sm font-semibold text-ink hover:text-marigold-dark">
              View cart →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
