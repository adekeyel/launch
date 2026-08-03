import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import QuantityStepper from "../components/QuantityStepper";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { IconTrash } from "../components/icons";
import { formatMoney } from "../lib/format";

export default function Cart() {
  const { items, total, loading, updateQuantity, remove } = useCart();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const handleQty = async (item, value) => {
    setBusyId(item.id);
    try {
      await updateQuantity(item.id, value);
    } catch (err) {
      console.error("Failed to update cart item:", err);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyId(item.id);
    try {
      await remove(item.id);
    } catch (err) {
      console.error("Failed to remove cart item:", err);
    } finally {
      setBusyId(null);
    }
  };

  const hasUnavailable = items.some((i) => !i.is_available);

  if (loading) return <Loader label="Loading your cart…" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            hint="Add a dish from any vendor's menu to get started."
            action={
              <Link to="/vendors" className="btn-accent">
                Browse vendors
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                  {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-ink/45">{item.business_name}</p>
                  {!item.is_available && <p className="mt-0.5 text-xs font-medium text-chili">No longer available</p>}
                  <p className="mt-1 font-mono text-sm text-ink/70">{formatMoney(item.price)}</p>
                </div>
                <QuantityStepper
                  value={item.quantity}
                  onChange={(v) => handleQty(item, v)}
                  min={0}
                  disabled={busyId === item.id}
                />
                <button
                  onClick={() => handleRemove(item)}
                  disabled={busyId === item.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/40 transition hover:bg-chili-soft hover:text-chili"
                  aria-label={`Remove ${item.name}`}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="ticket-edge mt-8 rounded-xl2 border border-line bg-white p-6 pt-9 shadow-ticket">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink/60">Total</span>
              <span className="font-mono text-xl font-bold text-ink">{formatMoney(total)}</span>
            </div>
            {hasUnavailable && (
              <p className="mt-3 text-xs text-chili">Remove unavailable items before checking out.</p>
            )}
            <button
              onClick={() => navigate("/checkout")}
              disabled={hasUnavailable}
              className="btn-primary mt-5 w-full"
            >
              Proceed to checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
