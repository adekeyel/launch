import { useCallback, useEffect, useState } from "react";
import RiderTabs from "../../components/RiderTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { formatMoney, formatDate, orderCode } from "../../lib/format";
import { IconUpload } from "../../components/icons";
import {
  listMyDeliveries,
  listEligibleForRiderSettlement,
  listMyRiderSettlements,
  createRiderSettlement,
} from "../../services/riders";

const STATUS_STYLE = {
  pending: "bg-marigold-soft text-marigold-dark",
  approved: "bg-basil-soft text-basil",
  rejected: "bg-chili-soft text-chili",
};

export default function RiderEarnings() {
  const toast = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [eligible, setEligible] = useState({ orders: [], total: 0 });
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ paymentRef: "", note: "" });
  const [receiptFile, setReceiptFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [d, e, s] = await Promise.all([
        listMyDeliveries(),
        listEligibleForRiderSettlement(),
        listMyRiderSettlements(),
      ]);
      setDeliveries(d.orders);
      setEligible(e);
      setSettlements(s.settlements);
    } catch (err) {
      console.error("Failed to load earnings:", err);
      setError(errorMessage(err, "We couldn't load your earnings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const earnedTotal = deliveries.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.rider_earning), 0);
  const awaiting = settlements.filter((s) => s.status === "pending").reduce((sum, s) => sum + Number(s.amount), 0);
  const paidOut = settlements.filter((s) => s.status === "approved").reduce((sum, s) => sum + Number(s.amount), 0);
  const readyToRequest = Number(eligible.total || 0);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!receiptFile) {
      setFormError("A receipt file is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createRiderSettlement({ ...form, receiptFile });
      toast.success("Payout request submitted.");
      setForm({ paymentRef: "", note: "" });
      setReceiptFile(null);
      await load();
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't submit this payout request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Rider dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Earnings</h1>
      <div className="mt-6">
        <RiderTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading your earnings…" />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard label="Total earned" value={formatMoney(earnedTotal)} className="text-ink" />
            <SummaryCard label="Ready to request" value={formatMoney(readyToRequest)} className="text-marigold-dark" />
            <SummaryCard label="Awaiting approval" value={formatMoney(awaiting)} className="text-ink" />
            <SummaryCard label="Paid out" value={formatMoney(paidOut)} className="text-basil" />
          </div>

          <section className="card mt-8 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Request a payout</h2>
            <p className="mt-1 text-sm text-ink/55">
              Every delivery you complete earns its delivery fee. Once OffPay has paid you, submit the payment reference
              and receipt here so it can be confirmed.
            </p>

            {eligible.orders.length === 0 ? (
              <p className="mt-4 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink/50">
                Nothing to request yet — complete a delivery and it will show up here.
              </p>
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-basil/25 bg-basil-soft px-4 py-3">
                  <span className="text-sm font-medium text-basil">{eligible.orders.length} delivery(ies) ready</span>
                  <span className="font-mono text-lg font-bold text-basil">{formatMoney(eligible.total)}</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {eligible.orders.map((o) => (
                    <li key={o.id} className="flex justify-between text-xs text-ink/50">
                      <span className="font-mono">{orderCode(o.id)}</span>
                      <span>{formatMoney(o.rider_earning)}</span>
                    </li>
                  ))}
                </ul>

                <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-dashed border-line pt-5">
                  <ErrorBanner message={formError} />
                  <input
                    value={form.paymentRef}
                    onChange={update("paymentRef")}
                    required
                    placeholder="OffPay payment reference"
                    className="field-input"
                  />
                  <textarea
                    value={form.note}
                    onChange={update("note")}
                    rows={2}
                    placeholder="Note (optional)"
                    className="field-input h-auto py-2.5"
                  />
                  <label
                    htmlFor="rider-receipt"
                    className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 text-sm text-ink/50 hover:border-marigold hover:text-ink"
                  >
                    <IconUpload className="h-4 w-4" />
                    {receiptFile ? receiptFile.name : "Upload payout receipt"}
                  </label>
                  <input
                    id="rider-receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? "Submitting…" : `Request payout — ${formatMoney(eligible.total)}`}
                  </button>
                </form>
              </>
            )}
          </section>

          <div className="mt-8">
            {settlements.length === 0 ? (
              <EmptyState title="No payout requests yet" />
            ) : (
              <ul className="divide-y divide-line">
                {settlements.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-mono font-semibold text-ink">{formatMoney(s.amount)}</p>
                      <p className="text-xs text-ink/45">
                        {formatDate(s.created_at)} · {s.payment_ref}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[s.status] || "bg-ink/10 text-ink/50"}`}
                    >
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, className }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${className}`}>{value}</p>
    </div>
  );
}
