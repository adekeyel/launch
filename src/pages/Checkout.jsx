import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { checkout } from "../services/orders";
import { getPublicSettings } from "../services/settings";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import { formatMoney } from "../lib/format";
import { IconUpload } from "../components/icons";

// Cash on delivery isn't offered. Bank transfer is confirmed manually
// against an uploaded receipt; card is charged and verified automatically
// through Flutterwave (see /checkout/callback).
const PAYMENT_METHODS = [
  { value: "transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
];

export default function Checkout() {
  const { items, total, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ deliveryAddress: "", phone: "", notes: "", paymentMethod: "transfer" });
  const [receiptFile, setReceiptFile] = useState(null);
  const [account, setAccount] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPublicSettings()
      .then(setAccount)
      .catch((err) => console.error("Failed to load payment account details:", err));
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isTransfer = form.paymentMethod === "transfer";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isTransfer && !receiptFile) {
      setError("Upload your payment receipt or screenshot to place the order.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkout({ ...form, receiptFile: isTransfer ? receiptFile : null });
      if (result.paymentLink) {
        // Card: hand off to Flutterwave's hosted checkout. It redirects
        // back to /checkout/callback, which verifies and marks orders paid.
        window.location.href = result.paymentLink;
        return;
      }
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

  const hasAccountDetails = account.company_account_number || account.company_bank_name;

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
          <div className="grid grid-cols-2 gap-2">
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

        {isTransfer ? (
          <>
            <div className="rounded-xl border border-marigold/30 bg-marigold-soft/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">Pay into this account</p>
              {hasAccountDetails ? (
                <dl className="mt-2 space-y-1 text-sm text-ink">
                  {account.company_bank_name && (
                    <div className="flex justify-between">
                      <dt className="text-ink/55">Bank</dt>
                      <dd className="font-medium">{account.company_bank_name}</dd>
                    </div>
                  )}
                  {account.company_account_number && (
                    <div className="flex justify-between">
                      <dt className="text-ink/55">Account number</dt>
                      <dd className="font-mono font-semibold">{account.company_account_number}</dd>
                    </div>
                  )}
                  {account.company_account_name && (
                    <div className="flex justify-between">
                      <dt className="text-ink/55">Account name</dt>
                      <dd className="font-medium">{account.company_account_name}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="mt-1 text-sm text-ink/55">Account details haven't been set up yet — check back shortly.</p>
              )}
              <p className="mt-3 text-xs text-ink/55">
                Pay {formatMoney(total)} into this account, then upload your receipt below. We verify payment
                before the vendor is notified to start preparing your order.
              </p>
            </div>

            <div>
              <label className="field-label" htmlFor="receipt">
                Payment receipt
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
          </>
        ) : (
          <div className="rounded-xl border border-marigold/30 bg-marigold-soft/50 p-4 text-sm text-ink/70">
            You'll be taken to Flutterwave's secure checkout to pay {formatMoney(total)} by card. Payment is
            verified automatically — no receipt needed.
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Placing order…" : isTransfer ? `Place order — ${formatMoney(total)}` : `Pay ${formatMoney(total)} by card`}
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
