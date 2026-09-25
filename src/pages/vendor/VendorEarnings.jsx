import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listMySettlements,
  listEligibleSettlementOrders,
  listMySubscriptions,
  listMyCampaigns,
  listMyBilling,
} from "../../services/monetization";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import { formatMoney, formatDate } from "../../lib/format";
import { IconChevronRight, IconMegaphone, IconSparkle } from "../../components/icons";

const SETTLEMENT_ACTIVE = new Set(["pending", "approved"]);
const CAMPAIGN_SPENDING = new Set(["pending_payment", "active"]);

// One place a vendor can see everything money-related — what's been settled
// to them, what's still working its way there, and what they're currently
// spending on growth (ads + Pro) — instead of hunting across three separate
// pages. This page only aggregates; the actual payout request and campaign
// forms stay on their existing pages (Payouts, Grow) so nothing about how
// those work changes.
export default function VendorEarnings() {
  const [settlements, setSettlements] = useState([]);
  const [eligible, setEligible] = useState({ orders: [], total: 0 });
  const [subscriptions, setSubscriptions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [settlementsData, eligibleData, subsData, campaignsData, billingData] = await Promise.all([
          listMySettlements(),
          listEligibleSettlementOrders(),
          listMySubscriptions(),
          listMyCampaigns(),
          listMyBilling(),
        ]);
        if (cancelled) return;
        setSettlements(settlementsData.settlements);
        setEligible(eligibleData);
        setSubscriptions(subsData.subscriptions);
        setCampaigns(campaignsData.campaigns);
        setBilling(billingData.records);
      } catch (err) {
        console.error("Failed to load earnings overview:", err);
        if (!cancelled) setError("Couldn't load your earnings overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const settledTotal = settlements.filter((s) => s.status === "approved").reduce((sum, s) => sum + Number(s.amount), 0);
  const awaitingApproval = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const readyToRequest = Number(eligible.total || 0);

  const activeSub = subscriptions.find((s) => s.status === "active");
  const campaignSpend = campaigns
    .filter((c) => CAMPAIGN_SPENDING.has(c.status))
    .reduce((sum, c) => sum + Number(c.price), 0);
  const growthSpend = campaignSpend + Number(activeSub?.amount || 0);

  const recentBilling = [...billing].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Earnings</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading your earnings…" />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Settled to you" value={formatMoney(settledTotal)} tone="basil" />
            <SummaryCard label="Ready to request" value={formatMoney(readyToRequest)} tone="marigold" />
            <SummaryCard label="Awaiting approval" value={formatMoney(awaitingApproval)} tone="ink" />
            <SummaryCard label="Spent on growth" value={formatMoney(growthSpend)} tone="chili" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <EarningsLinkCard
              to="/vendor/payouts"
              title="Payouts"
              description={
                readyToRequest > 0
                  ? `${formatMoney(readyToRequest)} ready to request from delivered orders.`
                  : "Request settlement once you have delivered, payment-verified orders."
              }
            />
            <EarningsLinkCard
              to="/vendor/grow"
              title="Advertising & Pro"
              icon={<IconMegaphone className="h-4 w-4" />}
              description={
                activeSub
                  ? `Pro is active until ${formatDate(activeSub.current_period_end)}.`
                  : campaigns.length > 0
                    ? `${campaigns.filter((c) => c.status === "active").length} campaign(s) currently running.`
                    : "Run an ad campaign or go Pro to get more orders."
              }
            />
          </div>

          <section className="card mt-8 p-6">
            <div className="flex items-center gap-2">
              <IconSparkle className="h-4 w-4 text-marigold-dark" />
              <h2 className="font-display text-lg font-bold text-ink">Recent billing</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">Charges from your Pro subscription — the money side of Advertising & Pro.</p>

            {recentBilling.length === 0 ? (
              <p className="mt-4 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink/50">No billing activity yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {recentBilling.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-mono font-semibold text-ink">{formatMoney(r.amount)}</p>
                      <p className="text-xs text-ink/45">{formatDate(r.created_at)} · {r.billing_cycle}</p>
                    </div>
                    <BillingStatus status={r.status} />
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

function SummaryCard({ label, value, tone }) {
  const toneClass = {
    basil: "text-basil",
    marigold: "text-marigold-dark",
    ink: "text-ink",
    chili: "text-chili",
  }[tone];
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function EarningsLinkCard({ to, title, description, icon }) {
  return (
    <Link
      to={to}
      className="card flex items-center justify-between gap-3 p-5 transition hover:border-ink/25 hover:shadow-ticket"
    >
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60">{icon}</span>}
        <div>
          <h3 className="font-display font-bold text-ink">{title}</h3>
          <p className="mt-0.5 text-sm text-ink/55">{description}</p>
        </div>
      </div>
      <IconChevronRight className="h-4 w-4 shrink-0 text-ink/35" />
    </Link>
  );
}

function BillingStatus({ status }) {
  const styles = {
    pending: "bg-marigold-soft text-marigold-dark",
    paid: "bg-basil-soft text-basil",
    failed: "bg-chili-soft text-chili",
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-ink/10 text-ink/50"}`}>
      {status}
    </span>
  );
}
