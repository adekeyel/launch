import { useEffect, useState } from "react";
import { getPublicSettings } from "../../services/settings";
import { getMyVendorProfile } from "../../services/vendors";
import * as monetization from "../../services/monetization";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import { formatMoney, formatDate } from "../../lib/format";

const PRO_CYCLES = [
  { value: "monthly", label: "Monthly", priceKey: "pro_price_monthly" },
  { value: "quarterly", label: "Quarterly", priceKey: "pro_price_quarterly" },
  { value: "yearly", label: "Yearly", priceKey: "pro_price_yearly" },
];

const SUB_STATUS_LABEL = {
  pending_payment: "Awaiting payment confirmation",
  active: "Active",
  expired: "Expired",
};

export default function VendorGrow() {
  const [settings, setSettings] = useState({});
  const [vendor, setVendor] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, v, subs, camps] = await Promise.all([
        getPublicSettings(),
        getMyVendorProfile(),
        monetization.listMySubscriptions(),
        monetization.listMyCampaigns(),
      ]);
      setSettings(s);
      setVendor(v);
      setSubscriptions(subs.subscriptions);
      setCampaigns(camps.campaigns);
    } catch (err) {
      console.error("Failed to load Grow page:", err);
      setError("Couldn't load this page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader label="Loading…" />;
  if (!vendor) return null;

  const offpayUrl = settings.offpay_registration_url;
  const activeProSub = subscriptions.find((s) => s.plan === "pro" && s.status === "active");
  const pendingProSub = subscriptions.find((s) => s.plan === "pro" && s.status === "pending_payment");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Grow your kitchen</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>
      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {/* Tier 1 — OffPay verification */}
      {vendor.tier < 1 ? (
        <section className="card mt-8 p-6">
          <h2 className="font-display text-lg font-bold text-ink">Step 1 · Set up your payment account</h2>
          <p className="mt-2 text-sm text-ink/60">
            Publish your menu and start receiving orders by setting up a payment account with OffPay. Complete
            OffPay's registration, then an admin will verify and upgrade you to Verified (Tier 1) — after that a 5%
            platform commission applies to completed orders, covering payment processing and platform costs.
          </p>
          <a href={offpayUrl} target="_blank" rel="noopener noreferrer" className="btn-accent mt-4 inline-flex">
            Set up payment account on OffPay
          </a>
        </section>
      ) : (
        <>
          {/* Pro subscription */}
          <section className="card mt-8 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Go Pro</h2>
              {activeProSub && (
                <span className="rounded-full bg-basil-soft px-2.5 py-1 text-xs font-semibold text-basil">
                  Active until {formatDate(activeProSub.current_period_end)}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-ink/60">
              Priority homepage placement, higher search ranking, a Pro badge on your shop, featured collections,
              advanced analytics, and discount/coupon tools.
            </p>

            {pendingProSub ? (
              <PendingPaymentCard
                item={pendingProSub}
                onSubmitRef={async (ref) => {
                  await monetization.attachSubscriptionPaymentRef(pendingProSub.id, ref);
                  await load();
                }}
              />
            ) : activeProSub ? (
              <button
                onClick={async () => {
                  await monetization.cancelMySubscription(activeProSub.id);
                  await load();
                }}
                className="btn-outline mt-4"
              >
                Cancel renewal
              </button>
            ) : (
              <ProSubscribeForm
                settings={settings}
                onSubscribe={async (cycle) => {
                  await monetization.subscribe("pro", cycle);
                  await load();
                }}
              />
            )}
          </section>

          {/* Advertising */}
          <section className="card mt-8 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Advertise</h2>
            <p className="mt-2 text-sm text-ink/60">
              Run a paid campaign — homepage banners, sponsored search placement, category promotion, and more.
              Sponsored campaigns are always clearly labeled to customers.
            </p>
            <CampaignForm
              settings={settings}
              onCreate={async (type, days) => {
                await monetization.createCampaign(type, days);
                await load();
              }}
            />

            {campaigns.length > 0 && (
              <ul className="mt-6 divide-y divide-line border-t border-line">
                {campaigns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">
                        {c.campaign_type.replace("_", " ")} · {c.duration_days} day{c.duration_days > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-ink/45">{formatMoney(c.price)}</p>
                    </div>
                    <CampaignStatus status={c.status} paymentRef={c.payment_ref} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ProSubscribeForm({ settings, onSubscribe }) {
  const [cycle, setCycle] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubscribe(cycle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid grid-cols-3 gap-2">
        {PRO_CYCLES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCycle(c.value)}
            className={`rounded-xl border p-3 text-left transition ${
              cycle === c.value ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink/30"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="mt-1 font-mono text-base font-bold">{formatMoney(settings[c.priceKey])}</p>
          </button>
        ))}
      </div>
      <button type="submit" disabled={submitting} className="btn-accent mt-4">
        {submitting ? "Starting…" : "Subscribe to Pro"}
      </button>
    </form>
  );
}

function CampaignForm({ settings, onCreate }) {
  const [type, setType] = useState(monetization.CAMPAIGN_TYPES[0].value);
  const [days, setDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const priceKey = { 1: "campaign_price_1day", 3: "campaign_price_3day", 7: "campaign_price_7day", 30: "campaign_price_30day" }[days];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(type, days);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="field-input"
      >
        {monetization.CAMPAIGN_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-4 gap-2">
        {monetization.CAMPAIGN_DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`h-10 rounded-xl border text-sm font-semibold transition ${
              days === d ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>
      <p className="font-mono text-sm text-ink/60">{formatMoney(settings[priceKey])}</p>
      <button type="submit" disabled={submitting} className="btn-accent">
        {submitting ? "Starting…" : "Start campaign"}
      </button>
    </form>
  );
}

function PendingPaymentCard({ item, onSubmitRef }) {
  const [ref, setRef] = useState(item.payment_ref || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitRef(ref);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-marigold/30 bg-marigold-soft/40 p-4">
      <p className="text-sm font-semibold text-marigold-dark">
        {SUB_STATUS_LABEL[item.status]} · {formatMoney(item.amount)}
      </p>
      <p className="mt-1 text-xs text-ink/55">Pay via OffPay, then submit your payment reference below.</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="OffPay payment reference"
          className="field-input"
          required
        />
        <button type="submit" disabled={submitting} className="btn-primary shrink-0">
          {submitting ? "Saving…" : "Submit"}
        </button>
      </form>
    </div>
  );
}

function CampaignStatus({ status }) {
  const styles = {
    pending_payment: "bg-marigold-soft text-marigold-dark",
    active: "bg-basil-soft text-basil",
    expired: "bg-ink/10 text-ink/50",
  };
  const labels = { pending_payment: "Awaiting activation", active: "Active", expired: "Ended" };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-ink/10 text-ink/50"}`}>
      {labels[status] || status}
    </span>
  );
}
