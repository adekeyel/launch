import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RiderTabs from "../../components/RiderTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { formatMoney, orderCode } from "../../lib/format";
import { getPosition } from "../../lib/geo";
import { IconPin } from "../../components/icons";
import { getMyRiderProfile, setAvailability, listAvailableOrders, claimOrder } from "../../services/riders";

const POLL_MS = 15000;

const NOT_APPROVED_COPY = {
  pending: "Your account is waiting for approval. We're verifying your OffPay account — you'll see orders here as soon as that's done.",
  rejected: "Your rider application wasn't approved. Check your OffPay reference on your profile and contact support if you think this is a mistake.",
  suspended: "Your rider account is suspended. Please contact support.",
};

export default function RiderAvailable() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [coords, setCoords] = useState(null);
  const [locationNote, setLocationNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingId, setClaimingId] = useState(null);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const coordsRef = useRef(null);
  coordsRef.current = coords;

  const fetchOrders = useCallback(async () => {
    const data = await listAvailableOrders(coordsRef.current);
    setOrders(data.orders);
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      const pos = await getPosition();
      setCoords(pos);
      coordsRef.current = pos;
      setLocationNote("");
      return pos;
    } catch (err) {
      setLocationNote(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMyRiderProfile();
        if (cancelled) return;
        setRider(profile);
        if (profile.status === "approved") {
          await refreshLocation();
          await fetchOrders();
        }
      } catch (err) {
        console.error("Failed to load rider home:", err);
        if (!cancelled) setError(errorMessage(err, "We couldn't load your dashboard."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOrders, refreshLocation]);

  // Keep the queue fresh while approved, online, and the tab is visible.
  useEffect(() => {
    if (rider?.status !== "approved" || !rider.is_online) return undefined;
    const tick = () => {
      if (document.visibilityState === "visible") fetchOrders().catch(() => {});
    };
    const interval = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [rider?.status, rider?.is_online, fetchOrders]);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const goingOnline = !rider.is_online;
      const pos = goingOnline ? await refreshLocation() : null;
      const updated = await setAvailability(goingOnline, pos || undefined);
      setRider((r) => ({ ...r, ...updated }));
      if (goingOnline) await fetchOrders();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't change your availability."));
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleClaim = async (order) => {
    setClaimingId(order.id);
    try {
      await claimOrder(order.id);
      toast.success("Order claimed — head to the kitchen to pick it up.");
      navigate("/rider/deliveries");
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't claim this order."));
      // Most likely another rider got there first — refresh the queue.
      fetchOrders().catch(() => {});
    } finally {
      setClaimingId(null);
    }
  };

  const approved = rider?.status === "approved";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Rider dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Available orders</h1>
      <div className="mt-6">
        <RiderTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading your dashboard…" />
      ) : !rider ? null : !approved ? (
        <div className="card mt-6 p-6">
          <h2 className="font-display text-lg font-bold text-ink">Account {rider.status}</h2>
          <p className="mt-1 text-sm text-ink/60">{NOT_APPROVED_COPY[rider.status]}</p>
          {!rider.offpay_account_ref && (
            <p className="mt-3 rounded-lg bg-marigold-soft px-3 py-2 text-sm text-marigold-dark">
              You haven't added an OffPay account reference yet.{" "}
              <Link to="/rider/profile" className="font-semibold underline">
                Add it on your profile
              </Link>{" "}
              so we can verify you.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="card mt-6 flex items-center justify-between gap-4 p-5">
            <div>
              <p className="font-display font-bold text-ink">{rider.is_online ? "You're online" : "You're offline"}</p>
              <p className="text-sm text-ink/55">
                {rider.is_online
                  ? "New orders near you appear below and refresh automatically."
                  : "Go online to see orders waiting for a rider."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleOnline}
              disabled={togglingOnline}
              className={rider.is_online ? "btn-outline" : "btn-primary"}
            >
              {togglingOnline ? "…" : rider.is_online ? "Go offline" : "Go online"}
            </button>
          </div>

          {locationNote && <p className="mt-3 rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink/55">{locationNote}</p>}

          {!rider.is_online ? null : orders.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No orders waiting right now" hint="We'll keep checking. New ready orders show up here as kitchens finish them." />
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-ink">{o.business_name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                        <IconPin className="h-3.5 w-3.5" />
                        {o.vendor_address || "Pickup address not set"}
                        {o.distance_km != null && <span className="ml-1 font-semibold text-ink/70">· {o.distance_km} km away</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink/45">You earn</p>
                      <p className="font-mono text-lg font-bold text-basil">{formatMoney(o.delivery_fee)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink/60">
                    <span className="font-semibold text-ink/75">Deliver to:</span> {o.delivery_address}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono text-xs text-ink/40">{orderCode(o.id)}</span>
                    <button
                      type="button"
                      onClick={() => handleClaim(o)}
                      disabled={claimingId === o.id}
                      className="btn-accent h-10 px-5 text-sm"
                    >
                      {claimingId === o.id ? "Claiming…" : "Pick this order"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
