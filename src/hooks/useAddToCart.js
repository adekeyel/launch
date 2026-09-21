import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart, PENDING_ADD_KEY } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { errorMessage } from "../lib/errors";

// One place for "add this dish to my cart", used by Home, Vendors, the vendor
// menu and the dish page.
//  - Signed out: remember the dish, send the visitor to log in, and bring them
//    back to this page afterwards (CartContext adds the remembered dish once
//    they're signed in).
//  - Signed in: add it and confirm with a toast; if it fails, say so.
export function useAddToCart() {
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [addingId, setAddingId] = useState(null);

  const addToCart = useCallback(
    async (food, quantity = 1) => {
      // The dish list tells us whether its kitchen is open; the server
      // re-checks at checkout, this just saves the customer a wasted trip.
      if (food.vendor_is_open === false) {
        toast.error(
          `${food.business_name || "This kitchen"} is closed right now${food.vendor_open_label ? `. ${food.vendor_open_label}` : ""}.`
        );
        return false;
      }
      if (!user) {
        try {
          sessionStorage.setItem(
            PENDING_ADD_KEY,
            JSON.stringify({ foodId: food.id, quantity, name: food.name, at: Date.now() })
          );
        } catch {
          // storage unavailable (private mode) — they'll just have to add it again
        }
        navigate("/login", {
          state: { from: location.pathname + location.search, reason: "Log in to add items to your cart." },
        });
        return false;
      }

      setAddingId(food.id);
      try {
        await add(food.id, quantity);
        toast.success(`${food.name} added to your cart.`, { action: { label: "View cart", to: "/cart" } });
        return true;
      } catch (err) {
        console.error("Failed to add to cart:", err);
        toast.error(errorMessage(err, "Couldn't add that to your cart. Please try again."));
        return false;
      } finally {
        setAddingId(null);
      }
    },
    [user, add, toast, navigate, location.pathname, location.search]
  );

  return { addToCart, addingId };
}
