import { useEffect, useState } from "react";
import { createSettlement, listMySettlements, listEligibleSettlementOrders } from "../../services/monetization";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { formatMoney, formatDate, orderCode } from "../../lib/format";
import { IconUpload } from "../../components/icons";

const STATUS_STYLE = {
  pending: "bg-marigold-soft text-marigold-dark",
  approved: "bg-basil-soft text-basil",
  rejected: "bg-chili-soft text-chili",
};

export default function VendorPayouts() {
  const [settlements, setSettlements] = useState([]);
  const [eligible, setEligible] = useState({ orders: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ paymentRef: "", note: "" });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [settlementsData, eligibleData] = await Promise.all([
        listMySettlements(),
        listEligibleSettlementOrders(),
      ]);
      setSettlements(settlementsData.settlements);
      setEligible(eligibleData);
    } catch (err) {
      console.error("Failed to load payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!receiptFile) {
      setError("A receipt file is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createSettlement({ ...form, receiptFile });
      setForm({ paymentRef: "", note: "" });
      setReceiptFile(null);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't submit this payout request.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasEligible = eligible.orders?.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Payouts</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

      <section className="card mt-8 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Available to settle</h2>
        <p className="mt-1 text-sm text-ink/55">
          An order becomes eligible the day after its payment is verified and it's marked delivered. OffPay pays
          this out to you — submit the payment reference and receipt below once you've received it.
        </p>

        {loading ? (
          <Loader label="Checking eligible orders…" />
        ) : !hasEligible ? (
          <p className="mt-4 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink/50">
            Nothing eligible yet — check back once you have delivered orders whose payment was verified more
            than a day ago.
          </p>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-basil/25 bg-basil-soft px-4 py-3">
              <span className="text-sm font-medium text-basil">{eligible.orders.length} order(s) ready</span>
              <span className="font-mono text-lg font-bold text-basil">{formatMoney(eligible.total)}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {eligible.orders.map((o) => (
                <li key={o.id} className="flex justify-between text-xs text-ink/50">
                  <span className="font-mono">{orderCode(o.id)}</span>
                  <span>{formatMoney(o.payout_amount)}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3 border-t border-dashed border-line pt-5">
              <ErrorBanner message={error} />
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
                htmlFor="receipt"
                className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 text-sm text-ink/50 hover:border-marigold hover:text-ink"
              >
                <IconUpload className="h-4 w-4" />
                {receiptFile ? receiptFile.name : "Upload payout receipt"}
              </label>
              <input
                id="receipt"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Submitting…" : `Request settlement — ${formatMoney(eligible.total)}`}
              </button>
            </form>
          </>
        )}
      </section>

      <div className="mt-8">
        {loading ? null : settlements.length === 0 ? (
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
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[s.status] || "bg-ink/10 text-ink/50"}`}>
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
