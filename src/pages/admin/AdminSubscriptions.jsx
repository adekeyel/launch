import { useEffect, useState } from "react";
import { listAllSubscriptions, activateSubscription, rejectSubscription } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { formatMoney, formatDate } from "../../lib/format";

const FILTERS = ["all", "pending_payment", "active", "expired"];

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState("pending_payment");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllSubscriptions(filter === "all" ? {} : { status: filter });
      setSubs(data.rows || data.subscriptions || []);
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
      setError("Couldn't load subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleActivate = async (sub) => {
    setBusyId(sub.id);
    setError("");
    try {
      await activateSubscription(sub.id);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't activate this subscription.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (sub) => {
    setBusyId(sub.id);
    setError("");
    try {
      await rejectSubscription(sub.id);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't reject this subscription.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Subscriptions</h1>
      <div className="mt-6">
        <AdminTabs />
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
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader label="Loading subscriptions…" />
        ) : subs.length === 0 ? (
          <EmptyState title="Nothing here" hint="Vendor subscription requests will show up in this list." />
        ) : (
          <ul className="divide-y divide-line">
            {subs.map((sub) => (
              <li key={sub.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-ink">
                    {sub.business_name} · <span className="capitalize">{sub.plan}</span> ({sub.billing_cycle})
                  </p>
                  <p className="text-xs text-ink/45">
                    {formatMoney(sub.amount)} · {formatDate(sub.created_at)}
                    {sub.payment_ref && ` · ref: ${sub.payment_ref}`}
                  </p>
                </div>
                {sub.status === "pending_payment" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleActivate(sub)}
                      disabled={busyId === sub.id}
                      className="btn-accent h-9 px-4 text-xs"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleReject(sub)}
                      disabled={busyId === sub.id}
                      className="btn-outline h-9 px-4 text-xs"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-ink/8 px-2.5 py-1 text-xs font-semibold capitalize text-ink/60">
                    {sub.status}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
