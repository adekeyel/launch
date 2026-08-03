import { useEffect, useState } from "react";
import { listAllSettlements, decideSettlement } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { formatMoney, formatDate } from "../../lib/format";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllSettlements(filter === "all" ? {} : { status: filter });
      setSettlements(data.settlements || []);
    } catch (err) {
      console.error("Failed to load settlements:", err);
      setError("Couldn't load settlements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleDecide = async (s, status) => {
    setBusyId(s.id);
    setError("");
    try {
      await decideSettlement(s.id, status);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't update this settlement.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Settlements</h1>
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
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader label="Loading settlements…" />
        ) : settlements.length === 0 ? (
          <EmptyState title="Nothing here" hint="Vendor payout requests will show up in this list." />
        ) : (
          <ul className="divide-y divide-line">
            {settlements.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-ink">{s.business_name}</p>
                  <p className="text-xs text-ink/45">
                    {formatMoney(s.amount)} · {formatDate(s.created_at)} · ref: {s.payment_ref}
                  </p>
                  {s.note && <p className="mt-0.5 text-xs italic text-ink/45">"{s.note}"</p>}
                  {s.receipt_url && (
                    <a
                      href={s.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-marigold-dark hover:underline"
                    >
                      View receipt →
                    </a>
                  )}
                </div>
                {s.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecide(s, "approved")}
                      disabled={busyId === s.id}
                      className="btn-accent h-9 px-4 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecide(s, "rejected")}
                      disabled={busyId === s.id}
                      className="btn-outline h-9 px-4 text-xs"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-ink/8 px-2.5 py-1 text-xs font-semibold capitalize text-ink/60">
                    {s.status}
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
