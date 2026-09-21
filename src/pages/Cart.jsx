import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import QuantityStepper from "../components/QuantityStepper";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { ListSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";
import { optimizedImage } from "../lib/media";
import { IconTrash } from "../components/icons";
import OpenBadge from "../components/OpenBadge";
import { groupCartItems } from "../lib/cartGroups";
import { formatMoney } from "../lib/format";

export default function Cart() {
  const { items, subtotal, deliveryTotal, grandTotal, vendors, hasClosedVendor, loaded, error, refresh, updateQuantity, remove } =
    useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const handleQty = async (item, value) => {
    setBusyId(item.id);
    try {
      await updateQuantity(item.id, value);
    } catch (err) {
      console.error("Failed to update cart item:", err);
      toast.error(errorMessage(err, "Couldn't update your cart. Please try again."));
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
      toast.error(errorMessage(err, "Couldn't remove that item. Please try again."));
    } finally {
      setBusyId(null);
    }
  };

  const hasUnavailable = items.some((i) => !i.is_available);
  const groups = groupCartItems(items, vendors);
  const showBreakdown = vendors.length > 0;

  // Skeleton only for the first load — not on every +/- click.
  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">Your cart</h1>
        <div className="mt-8">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">Your cart</h1>
        <div className="mt-8">
          <ErrorState title="Couldn't load your cart" message={errorMessage(error)} onRetry={refresh} />
        </div>
      </div>
    );
  }

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
          {groups.map((group) => {
            const closed = group.is_open === false;
            return (
              <section key={group.key} className="mt-8" aria-label={`Items from ${group.business_name}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-ink">{group.business_name}</h2>
                  <OpenBadge status={group.open_status} label={group.open_label} />
                </div>
                {closed && (
                  <p role="status" className="mt-2 rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink/65">
                    {group.business_name}{" "}
                    {group.open_status === "paused"
                      ? "isn't taking orders right now."
                      : `is closed right now${group.open_label ? `. ${group.open_label}` : ""}.`}{" "}
                    Remove these items to check out, or come back when they open.
                  </p>
                )}

                <ul className="mt-2 divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-5">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                        {item.image && (
                          <img
                            src={optimizedImage(item.image, 160)}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{item.name}</p>
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

                {showBreakdown && group.subtotal !== undefined && (
                  <div className="border-t border-dashed border-line pt-3 text-sm">
                    <div className="flex justify-between text-ink/60">
                      <span>Food</span>
                      <span className="font-mono">{formatMoney(group.subtotal)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-ink/60">
                      <span>Delivery</span>
                      <span className="font-mono">{group.delivery_fee > 0 ? formatMoney(group.delivery_fee) : "Free"}</span>
                    </div>
                    {group.amount_to_free_delivery != null && (
                      <p className="mt-1.5 text-xs text-basil">
                        Add {formatMoney(group.amount_to_free_delivery)} more from {group.business_name} for free delivery.
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          <div className="ticket-edge mt-8 rounded-xl2 border border-line bg-white p-6 pt-9 shadow-ticket">
            {showBreakdown && (
              <dl className="mb-4 space-y-1.5 border-b border-dashed border-line pb-4 text-sm text-ink/60">
                <div className="flex justify-between">
                  <dt>Food</dt>
                  <dd className="font-mono">{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd className="font-mono">{deliveryTotal > 0 ? formatMoney(deliveryTotal) : "Free"}</dd>
                </div>
              </dl>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink/60">Total</span>
              <span className="font-mono text-xl font-bold text-ink">{formatMoney(grandTotal)}</span>
            </div>
            {hasUnavailable && (
              <p className="mt-3 text-xs text-chili">Remove unavailable items before checking out.</p>
            )}
            {hasClosedVendor && (
              <p className="mt-3 text-xs text-chili">A kitchen in your cart is closed. Remove its items to check out.</p>
            )}
            <button
              onClick={() => navigate("/checkout")}
              disabled={hasUnavailable || hasClosedVendor}
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
