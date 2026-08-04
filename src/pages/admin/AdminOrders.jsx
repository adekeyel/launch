import { useEffect, useState } from "react";
import { listAllOrders, forceUpdateOrderStatus } from "../../services/admin";
import { STATUS_LABEL } from "../../services/orders";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { formatMoney, formatDate, orderCode } from "../../lib/format";

const FILTERS = ["all", "pending", "preparing", "ready", "delivered", "cancelled"];
const ALL_STATUSES = ["pending", "preparing", "ready", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllOrders(filter === "all" ? { limit: 100 } : { status: filter, limit: 100 });
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Couldn't load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleStatus = async (order, status) => {
    setBusyId(order.id);
    setError("");
    try {
      await forceUpdateOrderStatus(order.id, status);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't update this order.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Orders</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
      <p className="mt-6 max-w-xl rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink/50">
        There's no automatic payment-verification gate yet — vendors can still self-advance an order without
        waiting on you. Use this page to check each order's receipt against what landed in the company account,
        then message the vendor (or use the status override below) once you've confirmed it. A real "held until
        verified" gate needs a small backend addition — flag it if you want that built next.
      </p>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold transition ${
              filter === f ? "bg-ink text-paper" : "bg-white text-ink/55 hover:text-ink"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader label="Loading orders…" />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders here" />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="ticket-edge card p-5 pt-9 shadow-ticket">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink/40">{orderCode(order.id)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 font-semibold text-ink">
                      {order.customer_name} → {order.business_name}
                    </p>
                    <p className="text-xs text-ink/45">{formatDate(order.created_at)}</p>
                  </div>
                  <span className="font-mono text-lg font-bold text-ink">{formatMoney(order.total)}</span>
                </div>

                <div className="mt-3 grid gap-1 text-sm text-ink/60">
                  {order.payment_method && (
                    <p>
                      Payment method: <span className="font-medium capitalize text-ink">{order.payment_method}</span>
                    </p>
                  )}
                  {order.payment_ref && (
                    <p>
                      Reference: <span className="font-mono text-ink">{order.payment_ref}</span>
                    </p>
                  )}
                  {order.receipt_url ? (
                    <a
                      href={order.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-marigold-dark hover:underline"
                    >
                      View payment receipt →
                    </a>
                  ) : (
                    <p className="text-chili">No receipt was uploaded for this order.</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink/40">Set status:</span>
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatus(order, s)}
                      disabled={busyId === order.id || order.status === s}
                      className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                        order.status === s ? "bg-ink/10 text-ink/40" : "border border-ink/15 text-ink/60 hover:border-ink/30"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
