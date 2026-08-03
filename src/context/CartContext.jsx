import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import * as cartApi from "../services/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.role !== "customer") {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setLoading(false);
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

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, count, loading, add, updateQuantity, remove, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
