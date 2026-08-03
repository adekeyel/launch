import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listOrders, getOrder } from "../services/orders";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { StatusBadge, StatusTimeline } from "../components/StatusBadge";
import { formatMoney, formatDate, orderCode } from "../lib/format";
import { IconChevronRight } from "../components/icons";

export default function MyOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listOrders();
        if (!cancelled) setOrders(data.orders);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExpand = async (order) => {
    const willExpand = expandedId !== order.id;
    setExpandedId(willExpand ? order.id : null);
    if (willExpand && !details[order.id]) {
      try {
        const full = await getOrder(order.id);
        setDetails((d) => ({ ...d, [order.id]: full }));
      } catch (err) {
        console.error("Failed to load order details:", err);
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">My orders</h1>

      {location.state?.justOrdered && (
        <div className="mt-4 rounded-xl border border-basil/25 bg-basil-soft px-4 py-3 text-sm text-basil">
          Order placed! The vendor has been notified — track its status below.
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <Loader label="Loading your orders…" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            hint="Once you check out, your orders will show up here."
            action={
              <Link to="/vendors" className="btn-accent">
                Browse vendors
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const isOpen = expandedId === order.id;
              const full = details[order.id];
              return (
                <li key={order.id} className="ticket-edge card overflow-hidden pt-2 shadow-ticket">
                  <button
                    onClick={() => toggleExpand(order)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink/40">{orderCode(order.id)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 truncate font-semibold text-ink">{order.business_name}</p>
                      <p className="text-xs text-ink/45">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono font-semibold text-ink">{formatMoney(order.total)}</span>
                      <IconChevronRight className={`h-4 w-4 text-ink/40 transition ${isOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-dashed border-line px-5 py-4">
                      <StatusTimeline status={order.status} />
                      {!full ? (
                        <p className="mt-4 text-sm text-ink/45">Loading items…</p>
                      ) : (
                        <ul className="mt-4 space-y-2">
                          {full.items?.map((item) => (
                            <li key={item.id} className="flex justify-between text-sm">
                              <span className="text-ink/70">
                                <span className="font-mono text-ink/40">{item.quantity}×</span> {item.food_name}
                              </span>
                              <span className="font-mono text-ink">{formatMoney(item.price * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {order.delivery_address && (
                        <p className="mt-4 text-xs text-ink/45">Delivering to: {order.delivery_address}</p>
                      )}
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
