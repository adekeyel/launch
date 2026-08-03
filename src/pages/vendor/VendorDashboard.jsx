import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyVendorProfile } from "../../services/vendors";
import { listMyFoods } from "../../services/foods";
import { listOrders } from "../../services/orders";
import { getPublicSettings } from "../../services/settings";
import VendorTabs from "../../components/VendorTabs";
import TierBadge from "../../components/TierBadge";
import Loader from "../../components/Loader";
import { formatMoney } from "../../lib/format";

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

      {vendor.status === "approved" && vendor.tier < 1 && (
        <div className="mt-6 rounded-xl border border-marigold/30 bg-marigold-soft px-4 py-4 text-sm text-marigold-dark">
          <p className="font-semibold">You're approved — one step left before you can sell.</p>
          <p className="mt-1 text-marigold-dark/80">
            Your menu items save as drafts and your shop is hidden from customers until you set up a payment account
            and an admin verifies it (Tier 1). A 5% platform commission applies to completed orders once you're live.
          </p>
          <a
            href={settings.offpay_registration_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent mt-3 inline-flex h-9 px-4 text-xs"
          >
            Set up payment account on OffPay
          </a>
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
