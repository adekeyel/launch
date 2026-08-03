import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { checkout } from "../services/orders";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import { formatMoney } from "../lib/format";
import { IconUpload } from "../components/icons";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash on delivery" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Bank transfer" },
];

export default function Checkout() {
  const { items, total, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ deliveryAddress: "", phone: "", notes: "", paymentMethod: "cash" });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await checkout({ ...form, receiptFile });
      await refresh();
      navigate("/orders", { state: { justOrdered: true } });
    } catch (err) {
      setError(err?.message || "Couldn't place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <EmptyState
          title="Nothing to check out"
          hint="Your cart is empty."
          action={
            <Link to="/vendors" className="btn-accent">
              Browse vendors
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:grid-cols-5 sm:px-6">
      <form onSubmit={handleSubmit} className="space-y-4 sm:col-span-3">
        <h1 className="font-display text-3xl font-bold text-ink">Checkout</h1>
        <ErrorBanner message={error} />

        <div>
          <label className="field-label" htmlFor="deliveryAddress">
            Delivery address
          </label>
          <input
            id="deliveryAddress"
            required
            value={form.deliveryAddress}
            onChange={update("deliveryAddress")}
            className="field-input"
            placeholder="Street, area, city"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            required
            value={form.phone}
            onChange={update("phone")}
            className="field-input"
            placeholder="080…"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="notes">
            Notes for the vendor (optional)
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={update("notes")}
            rows={3}
            className="field-input h-auto py-2.5"
            placeholder="Extra spicy, no onions, ring the bell…"
          />
        </div>

        <div>
          <p className="field-label">Payment method</p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, paymentMethod: m.value }))}
                className={`h-11 rounded-xl border text-xs font-semibold transition ${
                  form.paymentMethod === m.value
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 text-ink/60 hover:border-ink/30"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {form.paymentMethod === "transfer" && (
          <div>
            <label className="field-label" htmlFor="receipt">
              Payment receipt (optional)
            </label>
            <label
              htmlFor="receipt"
              className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 text-sm text-ink/50 hover:border-marigold hover:text-ink"
            >
              <IconUpload className="h-4 w-4" />
              {receiptFile ? receiptFile.name : "Upload a screenshot or PDF"}
            </label>
            <input
              id="receipt"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Placing order…" : `Place order — ${formatMoney(total)}`}
        </button>
      </form>

      <div className="sm:col-span-2">
        <div className="ticket-edge card p-5 pt-9 shadow-ticket">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink/50">Order summary</p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink/70">
                  <span className="font-mono text-ink/40">{item.quantity}×</span> {item.name}
                </span>
                <span className="font-mono text-ink">{formatMoney(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-4">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="font-mono text-lg font-bold text-ink">{formatMoney(total)}</span>
          </div>
          <p className="mt-3 text-xs text-ink/40">
            Items from different vendors are split into separate orders automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
