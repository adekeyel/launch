import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { errorMessage } from "../lib/errors";
import * as cartApi from "../services/cart";

const CartContext = createContext(null);

// A dish a signed-out visitor tried to add; applied right after they log in.
export const PENDING_ADD_KEY = "lt:pendingAdd";
const PENDING_ADD_MAX_AGE_MS = 30 * 60 * 1000;

// Per-vendor delivery fees and open/closed state, as returned by GET /cart.
// (`?? ` fallbacks keep the app working against an older backend.)
const EMPTY_SUMMARY = { subtotal: 0, deliveryTotal: 0, grandTotal: 0, vendors: [], hasClosedVendor: false };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  // true once the first load for this signed-in customer has finished, so
  // pages can show a skeleton once instead of flashing on every +/- click.
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user || user.role !== "customer") {
      setItems([]);
      setTotal(0);
      setSummary(EMPTY_SUMMARY);
      setLoaded(false);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setItems(data.items);
      setTotal(data.total);
      setSummary({
        subtotal: data.subtotal ?? data.total,
        deliveryTotal: data.delivery_total ?? 0,
        grandTotal: data.grand_total ?? data.total,
        vendors: data.vendors ?? [],
        hasClosedVendor: Boolean(data.has_closed_vendor),
      });
      setError(null);
    } catch (err) {
      console.error("Failed to load cart:", err);
      setError(err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (foodId, quantity = 1) => {
      await cartApi.addToCart(foodId, quantity);
      await refresh();
    },
    [refresh]
  );

  const updateQuantity = useCallback(
    async (id, quantity) => {
      await cartApi.updateCartItem(id, quantity);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      await cartApi.removeCartItem(id);
      await refresh();
    },
    [refresh]
  );

  // Finish the "add to cart" a visitor started before they were logged in.
  useEffect(() => {
    if (!user) return;
    let raw = null;
    try {
      raw = sessionStorage.getItem(PENDING_ADD_KEY);
      if (raw) sessionStorage.removeItem(PENDING_ADD_KEY);
    } catch {
      return;
    }
    if (!raw || user.role !== "customer") return;

    let pending;
    try {
      pending = JSON.parse(raw);
    } catch {
      return;
    }
    if (!pending?.foodId || Date.now() - (pending.at || 0) > PENDING_ADD_MAX_AGE_MS) return;

    (async () => {
      try {
        await add(pending.foodId, pending.quantity || 1);
        toast.success(`${pending.name || "Your dish"} added to your cart.`, {
          action: { label: "View cart", to: "/cart" },
        });
      } catch (err) {
        console.error("Failed to apply pending add-to-cart:", err);
        toast.error(errorMessage(err, "We couldn't add that dish to your cart. Please try again."));
      }
    })();
  }, [user, add, toast]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, total, ...summary, count, loading, loaded, error, add, updateQuantity, remove, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
