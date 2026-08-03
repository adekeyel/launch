import { useEffect, useState } from "react";
import { createSettlement, listMySettlements } from "../../services/monetization";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { formatMoney, formatDate } from "../../lib/format";
import { IconUpload } from "../../components/icons";

const STATUS_STYLE = {
  pending: "bg-marigold-soft text-marigold-dark",
  approved: "bg-basil-soft text-basil",
  rejected: "bg-chili-soft text-chili",
};

export default function VendorPayouts() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", paymentRef: "", note: "" });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listMySettlements();
      setSettlements(data.settlements);
    } catch (err) {
      console.error("Failed to load settlements:", err);
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
      setForm({ amount: "", paymentRef: "", note: "" });
      setReceiptFile(null);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't submit this payout request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Payouts</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

      <section className="card mt-8 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Request a settlement</h2>
        <p className="mt-1 text-sm text-ink/55">
          Submit the amount OffPay paid out to you along with the payment reference and receipt, and an admin will
          confirm it.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <ErrorBanner message={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.amount}
              onChange={update("amount")}
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Amount (₦)"
              className="field-input"
            />
            <input
              value={form.paymentRef}
              onChange={update("paymentRef")}
              required
              placeholder="OffPay payment reference"
              className="field-input"
            />
          </div>
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
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </section>

      <div className="mt-8">
        {loading ? (
          <Loader label="Loading history…" />
        ) : settlements.length === 0 ? (
          <EmptyState title="No payout requests yet" />
        ) : (
          <ul className="divide-y divide-line">
            {settlements.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-mono font-semibold text-ink">{formatMoney(s.amount)}</p>
                  <p className="text-xs text-ink/45">{formatDate(s.created_at)} · {s.payment_ref}</p>
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
