import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyVendorProfile, updateMyVendorProfile } from "../../services/vendors";
import { listMyFoods } from "../../services/foods";
import { listOrders } from "../../services/orders";
import { getPublicSettings } from "../../services/settings";
import VendorTabs from "../../components/VendorTabs";
import TierBadge from "../../components/TierBadge";
import Loader from "../../components/Loader";
import { formatMoney } from "../../lib/format";
import OpenBadge from "../../components/OpenBadge";
import { RatingSummary } from "../../components/StarRating";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";

const STATUS_COPY = {
  pending: {
    tone: "border-marigold/30 bg-marigold-soft text-marigold-dark",
    text: "Your kitchen is pending review. An admin needs to approve your account before you can go further.",
  },
  approved: {
    tone: "border-basil/25 bg-basil-soft text-basil",
    text: "Your kitchen is approved.",
  },
  suspended: {
    tone: "border-chili/25 bg-chili-soft text-chili",
    text: "Your kitchen has been suspended. Contact support for details.",
  },
  rejected: {
    tone: "border-chili/25 bg-chili-soft text-chili",
    text: "Your application was not approved. Contact support for details.",
  },
};

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [togglingOrders, setTogglingOrders] = useState(false);
  const [offpayRef, setOffpayRef] = useState("");
  const [savingRef, setSavingRef] = useState(false);
  const toast = useToast();

  // One-tap pause / resume, straight from the dashboard.
  const toggleOrders = async () => {
    setTogglingOrders(true);
    try {
      const updated = await updateMyVendorProfile({ orders_paused: !vendor.orders_paused });
      setVendor(updated);
      toast.success(updated.orders_paused ? "Orders paused." : "Orders resumed.");
    } catch (err) {
      console.error("Failed to update order status:", err);
      toast.error(errorMessage(err, "Couldn't update that. Please try again."));
    } finally {
      setTogglingOrders(false);
    }
  };

  // Vendor submits their OffPay account reference so an admin can verify it.
  const saveOffpayRef = async (e) => {
    e.preventDefault();
    if (!offpayRef.trim()) return;
    setSavingRef(true);
    try {
      const updated = await updateMyVendorProfile({ offpay_merchant_ref: offpayRef.trim() });
      setVendor(updated);
      toast.success("OffPay reference saved. An admin will verify it shortly.");
    } catch (err) {
      console.error("Failed to save OffPay reference:", err);
      toast.error(errorMessage(err, "Couldn't save that. Please try again."));
    } finally {
      setSavingRef(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [v, f, o, s] = await Promise.all([
          getMyVendorProfile(),
          listMyFoods(),
          listOrders(),
          getPublicSettings(),
        ]);
        if (!cancelled) {
          setVendor(v);
          setOffpayRef(v.offpay_merchant_ref || "");
          setFoods(f.foods);
          setOrders(o.orders);
          setSettings(s);
        }
      } catch (err) {
        console.error("Failed to load vendor dashboard:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loader label="Loading your dashboard…" />;
  if (!vendor) return null;

  const pendingOrders = orders.filter((o) => ["pending", "preparing", "ready"].includes(o.status));
  const revenue = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
  const statusCopy = STATUS_COPY[vendor.status] || STATUS_COPY.pending;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="font-display text-3xl font-bold text-ink">{vendor.business_name}</h1>
        <TierBadge tier={vendor.tier} />
      </div>

      <div className="mt-6">
        <VendorTabs />
      </div>

      {vendor.status !== "approved" && (
        <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${statusCopy.tone}`}>{statusCopy.text}</div>
      )}

      {(vendor.status === "approved" || vendor.status === "pending") && vendor.tier < 1 && (
        <div className="mt-6 rounded-xl border border-marigold/30 bg-marigold-soft px-4 py-4 text-sm text-marigold-dark">
          <p className="font-semibold">
            {vendor.status === "approved"
              ? "You're approved — one step left before you can sell."
              : "Set up your OffPay account while you wait for approval."}
          </p>
          <p className="mt-1 text-marigold-dark/80">
            Every vendor needs an OffPay account — it's where your settlements are paid. Until an admin verifies it
            (Tier 1), your menu items save as drafts and your shop is hidden from customers. Once verified, your drafts
            go live automatically. A 5% platform commission applies to completed orders.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-marigold-dark/90">
            <li>Create your OffPay account.</li>
            <li>Paste your OffPay reference below and save.</li>
            <li>An admin verifies it and your shop goes live.</li>
          </ol>
          {settings.offpay_registration_url && (
            <a
              href={settings.offpay_registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent mt-3 inline-flex h-9 px-4 text-xs"
            >
              Set up payment account on OffPay
            </a>
          )}
          <form onSubmit={saveOffpayRef} className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[14rem] flex-1">
              <label className="field-label" htmlFor="offpayRef">
                Your OffPay account reference
              </label>
              <input
                id="offpayRef"
                value={offpayRef}
                onChange={(e) => setOffpayRef(e.target.value)}
                maxLength={150}
                className="field-input"
                placeholder="e.g. the email or merchant ID on your OffPay account"
              />
            </div>
            <button type="submit" disabled={savingRef || !offpayRef.trim()} className="btn-outline h-10">
              {savingRef ? "Saving…" : "Save"}
            </button>
          </form>
          {vendor.offpay_merchant_ref && (
            <p className="mt-2 text-xs font-semibold">Submitted — waiting for an admin to verify it.</p>
          )}
        </div>
      )}

      {vendor.status === "approved" && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-bold text-ink">
                {vendor.orders_paused ? "Orders paused" : vendor.open_now ? "Taking orders" : "Closed right now"}
              </p>
              <OpenBadge status={vendor.open_status} label={vendor.open_label} />
            </div>
            <p className="mt-0.5 text-sm text-ink/55">
              {vendor.orders_paused
                ? "Customers can browse your menu but can't order."
                : vendor.open_label || "Customers can order from you."}
            </p>
          </div>
          <button type="button" onClick={toggleOrders} disabled={togglingOrders} className="btn-outline">
            {togglingOrders ? "Saving…" : vendor.orders_paused ? "Resume orders" : "Pause orders"}
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Menu items" value={foods.length} />
        <StatCard label="Live orders" value={pendingOrders.length} />
        <StatCard label="Total orders" value={orders.length} />
        <StatCard label="Delivered revenue" value={formatMoney(revenue)} />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Shop profile</h2>
          <p className="mt-1 text-sm text-ink/55">Upload your logo and banner, edit your shop details.</p>
          <Link to="/vendor/profile" className="btn-outline mt-4 w-full">
            Edit shop profile
          </Link>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Menu</h2>
            <Link to="/vendor/foods/new" className="text-sm font-semibold text-marigold-dark hover:underline">
              + Add food
            </Link>
          </div>
          <p className="mt-1 text-sm text-ink/55">
            {foods.length} item{foods.length === 1 ? "" : "s"} · {foods.filter((f) => f.is_available).length} live
          </p>
          <Link to="/vendor/foods" className="btn-outline mt-4 w-full">
            Manage foods
          </Link>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Orders</h2>
          <p className="mt-1 text-sm text-ink/55">
            {pendingOrders.length} order{pendingOrders.length === 1 ? "" : "s"} need your attention
          </p>
          <Link to="/vendor/orders" className="btn-outline mt-4 w-full">
            Manage orders
          </Link>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Reviews</h2>
          <p className="mt-1 text-sm text-ink/55">
            {vendor.rating_count > 0 ? (
              <RatingSummary avg={vendor.rating_avg} count={vendor.rating_count} />
            ) : (
              "No reviews yet. Customers can rate delivered orders."
            )}
          </p>
          <Link to="/vendor/reviews" className="btn-outline mt-4 w-full">
            See reviews
          </Link>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Grow</h2>
          <p className="mt-1 text-sm text-ink/55">Go Pro or run an advertising campaign.</p>
          <Link to="/vendor/grow" className="btn-outline mt-4 w-full">
            Open Grow
          </Link>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Payouts</h2>
          <p className="mt-1 text-sm text-ink/55">Request and track settlements.</p>
          <Link to="/vendor/payouts" className="btn-outline mt-4 w-full">
            Open payouts
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/45">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
