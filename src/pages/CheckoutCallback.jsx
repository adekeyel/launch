import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyCardPayment } from "../services/orders";
import { useCart } from "../context/CartContext";
import Loader from "../components/Loader";

export default function CheckoutCallback() {
  const [searchParams] = useSearchParams();
  const { refresh } = useCart();
  const [state, setState] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("");

  useEffect(() => {
    const txRef = searchParams.get("tx_ref");
    const flwStatus = searchParams.get("status");

    if (!txRef) {
      setState("failed");
      setMessage("No payment reference was returned. If you completed payment, check My Orders shortly.");
      return;
    }
    if (flwStatus === "cancelled") {
      setState("failed");
      setMessage("Payment was cancelled.");
      return;
    }

    verifyCardPayment(txRef)
      .then((data) => {
        if (data.verified) {
          setState("success");
          refresh();
        } else {
          setState("failed");
          setMessage("Payment could not be confirmed. If you were charged, contact support with your reference.");
        }
      })
      .catch((err) => {
        console.error("Payment verification failed:", err);
        setState("failed");
        setMessage(err?.message || "Couldn't verify payment. If you were charged, contact support.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {state === "verifying" && <Loader label="Confirming your payment…" />}

      {state === "success" && (
        <>
          <h1 className="font-display text-2xl font-bold text-ink">Payment confirmed</h1>
          <p className="mt-2 text-sm text-ink/55">
            Your order is on its way to the vendor — track it from My Orders.
          </p>
          <Link to="/orders" className="btn-accent mt-6">
            View my orders
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <h1 className="font-display text-2xl font-bold text-ink">Payment not confirmed</h1>
          <p className="mt-2 text-sm text-ink/55">{message}</p>
          <div className="mt-6 flex gap-3">
            <Link to="/checkout" className="btn-outline">
              Try again
            </Link>
            <Link to="/orders" className="btn-accent">
              My orders
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
