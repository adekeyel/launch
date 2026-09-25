import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listOrders, getOrder } from "../services/orders";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import { StatusBadge, StatusTimeline } from "../components/StatusBadge";
import { formatMoney, formatDate, orderCode } from "../lib/format";
import { orderBreakdown } from "../lib/delivery";
import { IconChevronRight } from "../components/icons";
import ReviewForm from "../components/ReviewForm";
import { StarRating } from "../components/StarRating";

// Orders still in play — while any of these exist we poll quietly in the
// background so a customer watching their food come doesn't have to hit
// refresh themselves.
const ACTIVE_STATUSES = new Set(["pending", "preparing", "ready"]);
const POLL_INTERVAL_MS = 15000;

export default function MyOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listOrders();
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(errorMessage(err, "We couldn't load your orders."));
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent refresh for polling: no skeleton flash, no error banner — if it
  // fails we just try again on the next tick.
  const refreshQuietly = useCallback(async () => {
    try {
      const data = await listOrders();
      setOrders((current) => {
        // Preserve object identity for orders that haven't changed, so this
        // doesn't disturb anything relying on reference equality.
        const byId = new Map(current.map((o) => [o.id, o]));
        return data.orders.map((next) => {
          const prev = byId.get(next.id);
          return prev && prev.status === next.status && prev.review_rating === next.review_rating ? prev : next;
        });
      });
    } catch (err) {
      console.error("Background order refresh failed:", err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll every 15s while there's an active order and the tab is visible.
  useEffect(() => {
    const hasActive = () => ordersRef.current.some((o) => ACTIVE_STATUSES.has(o.status));

    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && hasActive()) {
        refreshQuietly();
      }
    }, POLL_INTERVAL_MS);

    // Also catch up immediately when the tab regains focus.
    const onVisible = () => {
      if (document.visibilityState === "visible" && hasActive()) refreshQuietly();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshQuietly]);

  // After a review is saved, mark the order as reviewed without refetching.
  const markReviewed = (orderId, rating) => {
    setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, review_rating: rating } : o)));
  };

  const toggleExpand = async (order) => {
    const willExpand = expandedId !== order.id;
    setExpandedId(willExpand ? order.id : null);
    if (willExpand && !details[order.id]) {
      try {
        const full = await getOrder(order.id);
        setDetails((d) => ({ ...d, [order.id]: full }));
      } catch (err) {
        console.error("Failed to load order details:", err);
        toast.error(errorMessage(err, "Couldn't load that order's items. Please try again."));
        setExpandedId(null);
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">My orders</h1>

      {location.state?.justOrdered && (
        <div className="mt-4 rounded-xl border border-basil/25 bg-basil-soft px-4 py-3 text-sm text-basil">
          Order placed! The vendor has been notified — track its status below.
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <ListSkeleton rows={3} />
        ) : error ? (
          <ErrorState title="Couldn't load your orders" message={error} onRetry={load} />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            hint="Once you check out, your orders will show up here."
            action={
              <Link to="/vendors" className="btn-accent">
                Browse vendors
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const isOpen = expandedId === order.id;
              const full = details[order.id];
              return (
                <li key={order.id} className="ticket-edge card overflow-hidden pt-2 shadow-ticket">
                  <button
                    onClick={() => toggleExpand(order)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink/40">{orderCode(order.id)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 truncate font-semibold text-ink">{order.business_name}</p>
                      <p className="text-xs text-ink/45">{formatDate(order.created_at)}</p>
                      {order.status === "delivered" && order.review_rating == null && (
                        <p className="mt-1 text-xs font-semibold text-marigold-dark">Rate this order</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono font-semibold text-ink">{formatMoney(order.total)}</span>
                      <IconChevronRight className={`h-4 w-4 text-ink/40 transition ${isOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-dashed border-line px-5 py-4">
                      <StatusTimeline status={order.status} />
                      {!full ? (
                        <p className="mt-4 text-sm text-ink/45">Loading items…</p>
                      ) : (
                        <ul className="mt-4 space-y-2">
                          {full.items?.map((item) => (
                            <li key={item.id} className="flex justify-between text-sm">
                              <span className="text-ink/70">
                                <span className="font-mono text-ink/40">{item.quantity}×</span> {item.food_name}
                              </span>
                              <span className="font-mono text-ink">{formatMoney(item.price * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {(() => {
                        const { subtotal, fee, total } = orderBreakdown(order);
                        return (
                          <dl className="mt-4 space-y-1 border-t border-dashed border-line pt-3 text-sm">
                            <div className="flex justify-between text-ink/60">
                              <dt>Food</dt>
                              <dd className="font-mono">{formatMoney(subtotal)}</dd>
                            </div>
                            <div className="flex justify-between text-ink/60">
                              <dt>Delivery</dt>
                              <dd className="font-mono">{fee > 0 ? formatMoney(fee) : "Free"}</dd>
                            </div>
                            <div className="flex justify-between font-semibold text-ink">
                              <dt>Total</dt>
                              <dd className="font-mono">{formatMoney(total)}</dd>
                            </div>
                          </dl>
                        );
                      })()}
                      {order.delivery_address && (
                        <p className="mt-4 text-xs text-ink/45">Delivering to: {order.delivery_address}</p>
                      )}
                      {order.status === "delivered" &&
                        (order.review_rating != null ? (
                          <p className="mt-4 flex items-center gap-2 text-sm text-ink/60">
                            You rated this order <StarRating value={order.review_rating} />
                          </p>
                        ) : (
                          <ReviewForm
                            orderId={order.id}
                            vendorName={order.business_name}
                            onSubmitted={(rating) => markReviewed(order.id, rating)}
                          />
                        ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
