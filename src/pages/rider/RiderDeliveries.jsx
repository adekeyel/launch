import { useCallback, useEffect, useState } from "react";
import RiderTabs from "../../components/RiderTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { formatMoney, formatDate, orderCode } from "../../lib/format";
import { listMyDeliveries, markPickedUp, markDelivered, pingLocation } from "../../services/riders";
import { getPosition } from "../../lib/geo";

const ACTIVE = new Set(["rider_assigned", "picked_up"]);

export default function RiderDeliveries() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [pins, setPins] = useState({});

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await listMyDeliveries();
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to load deliveries:", err);
      setError(errorMessage(err, "We couldn't load your deliveries."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the rider's location fresh while they have an active delivery, so
  // the customer's live map on My Orders isn't showing a stale point from
  // whenever they last went online. Only runs while something is actually
  // in progress — no point pinging every rider's location constantly.
  useEffect(() => {
    const hasActive = orders.some((o) => ACTIVE.has(o.status));
    if (!hasActive) return undefined;
    const ping = () => {
      getPosition()
        .then((pos) => pingLocation(pos.lat, pos.lng))
        .catch(() => {}); // best-effort — a missed ping just means a stale dot for a bit
    };
    ping();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") ping();
    }, 15000);
    return () => clearInterval(interval);
  }, [orders]);

  const handlePickedUp = async (order) => {
    setBusyId(order.id);
    try {
      const updated = await markPickedUp(order.id);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      toast.success("Marked picked up — on your way!");
    } catch (err) {
      toast.error(errorMessage(err, "That didn't go through. Please try again."));
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelivered = async (order) => {
    const pin = (pins[order.id] || "").trim();
    if (pin.length !== 4) {
      toast.error("Ask the customer for their 4-digit delivery code first.");
      return;
    }
    setBusyId(order.id);
    try {
      const updated = await markDelivered(order.id, pin);
      setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      setPins((p) => ({ ...p, [order.id]: "" }));
      toast.success("Delivered! Nice work.");
    } catch (err) {
      // Wrong PIN comes back as a normal error message — keep whatever the
      // rider typed so they can just fix the digit rather than retype it.
      toast.error(errorMessage(err, "That didn't go through. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  const active = orders.filter((o) => ACTIVE.has(o.status));
  const history = orders.filter((o) => !ACTIVE.has(o.status));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Rider dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">My deliveries</h1>
      <div className="mt-6">
        <RiderTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading your deliveries…" />
      ) : (
        <>
          <h2 className="mt-8 font-display text-lg font-bold text-ink">In progress</h2>
          {active.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="Nothing in progress" hint="Pick an order from Available orders to get started." />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {active.map((o) => (
                <li key={o.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-ink">{o.business_name}</p>
                      <p className="mt-0.5 text-xs text-ink/50">Pickup: {o.vendor_address || "address not set"}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-ink/65">
                    <p>
                      <span className="font-semibold text-ink/75">Deliver to:</span> {o.delivery_address}
                    </p>
                    <p>
                      <span className="font-semibold text-ink/75">Customer:</span> {o.customer_name}
                      {o.phone && (
                        <>
                          {" · "}
                          <a href={`tel:${o.phone}`} className="font-semibold text-marigold-dark hover:underline">
                            {o.phone}
                          </a>
                        </>
                      )}
                    </p>
                    {o.notes && (
                      <p>
                        <span className="font-semibold text-ink/75">Notes:</span> {o.notes}
                      </p>
                    )}
                  </div>

                  {o.status === "rider_assigned" ? (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-mono text-xs text-ink/40">
                        {orderCode(o.id)} · earn {formatMoney(o.rider_earning)}
                      </span>
                      <button
                        type="button"
                        disabled={busyId === o.id}
                        onClick={() => handlePickedUp(o)}
                        className="btn-accent h-10 px-5 text-sm"
                      >
                        {busyId === o.id ? "…" : "I've picked it up"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2 border-t border-dashed border-line pt-4">
                      <label htmlFor={`pin-${o.id}`} className="field-label">
                        Ask the customer for their 4-digit delivery code
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`pin-${o.id}`}
                          value={pins[o.id] || ""}
                          onChange={(e) =>
                            setPins((p) => ({ ...p, [o.id]: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                          }
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="0000"
                          className="field-input w-28 text-center font-mono text-lg tracking-[0.3em]"
                        />
                        <button
                          type="button"
                          disabled={busyId === o.id}
                          onClick={() => handleDelivered(o)}
                          className="btn-primary h-10 flex-1 text-sm"
                        >
                          {busyId === o.id ? "…" : "Confirm delivery"}
                        </button>
                      </div>
                      <span className="block font-mono text-xs text-ink/40">
                        {orderCode(o.id)} · earn {formatMoney(o.rider_earning)}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-lg font-bold text-ink">History</h2>
          {history.length === 0 ? (
            <p className="mt-3 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink/50">No completed deliveries yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {history.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">{o.business_name}</p>
                    <p className="text-xs text-ink/45">
                      {orderCode(o.id)} · {formatDate(o.delivered_at || o.assigned_at)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-basil">{formatMoney(o.rider_earning)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
