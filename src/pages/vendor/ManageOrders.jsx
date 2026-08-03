import { useEffect, useState } from "react";
import { listOrders, updateOrderStatus, NEXT_STATUS, STATUS_LABEL } from "../../services/orders";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import ErrorBanner from "../../components/ErrorBanner";
import { StatusBadge } from "../../components/StatusBadge";
import { formatMoney, formatDate, orderCode } from "../../lib/format";

const FILTERS = ["all", "pending", "preparing", "ready", "delivered", "cancelled"];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listOrders(filter === "all" ? {} : { status: filter });
      setOrders(data.orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Couldn't load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleStatusChange = async (order, status) => {
    setBusyId(order.id);
    setError("");
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
    } catch (err) {
      setError(err?.message || "Couldn't update this order.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Manage orders</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

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
          <EmptyState title="No orders here" hint="Orders placed by customers will show up in this list." />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const nextOptions = NEXT_STATUS[order.status] || [];
              return (
                <li key={order.id} className="ticket-edge card p-5 pt-9 shadow-ticket">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink/40">{orderCode(order.id)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 font-semibold text-ink">{order.customer_name}</p>
                      <p className="text-xs text-ink/45">{order.customer_phone}</p>
                      <p className="text-xs text-ink/45">{formatDate(order.created_at)}</p>
                    </div>
                    <span className="font-mono text-lg font-bold text-ink">{formatMoney(order.total)}</span>
                  </div>
                  {order.delivery_address && (
                    <p className="mt-3 text-sm text-ink/55">Deliver to: {order.delivery_address}</p>
                  )}
                  {order.notes && <p className="mt-1 text-sm italic text-ink/45">"{order.notes}"</p>}

                  {nextOptions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-line pt-4">
                      {nextOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(order, status)}
                          disabled={busyId === order.id}
                          className={status === "cancelled" ? "btn-outline h-9 px-4 text-xs" : "btn-accent h-9 px-4 text-xs"}
                        >
                          {status === "cancelled" ? "Cancel order" : `Mark as ${STATUS_LABEL[status]}`}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
