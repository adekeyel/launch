import { useCallback, useEffect, useState } from "react";
import { listRiders, setRiderStatus, listAllRiderSettlements, decideRiderSettlement } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { formatMoney, formatDate } from "../../lib/format";

const RIDER_FILTERS = ["pending", "approved", "rejected", "suspended", "all"];
const PAYOUT_FILTERS = ["pending", "approved", "rejected", "all"];

// One admin page for the whole rider side: verify OffPay accounts (the gate
// before a rider can see any orders) and review their payout requests.
export default function AdminRiders() {
  const [view, setView] = useState("riders");
  const [filter, setFilter] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = filter === "all" ? {} : { status: filter };
      if (view === "riders") {
        const data = await listRiders(params);
        setItems(data.riders || []);
      } else {
        const data = await listAllRiderSettlements(params);
        setItems(data.settlements || []);
      }
    } catch (err) {
      console.error("Failed to load riders:", err);
      setError("Couldn't load this list.");
    } finally {
      setLoading(false);
    }
  }, [view, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const switchView = (next) => {
    setView(next);
    setFilter("pending");
  };

  const act = async (id, fn, status) => {
    setBusyId(id);
    setError("");
    try {
      await fn(id, status);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't update this.");
    } finally {
      setBusyId(null);
    }
  };

  const filters = view === "riders" ? RIDER_FILTERS : PAYOUT_FILTERS;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Riders</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>

      <div className="mt-6 grid max-w-xs grid-cols-2 gap-1 rounded-full border border-ink/15 bg-white p-1">
        {[
          { v: "riders", label: "Riders" },
          { v: "payouts", label: "Payouts" },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => switchView(t.v)}
            className={`h-9 rounded-full text-sm font-semibold transition ${
              view === t.v ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold capitalize transition ${
              filter === f ? "bg-ink text-paper" : "bg-white text-ink/55 hover:text-ink"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader label="Loading…" />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nothing here"
            hint={view === "riders" ? "New rider applications show up here for OffPay verification." : "Rider payout requests show up here."}
          />
        ) : view === "riders" ? (
          <ul className="divide-y divide-line">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-ink">{r.fullname}</p>
                  <p className="text-xs text-ink/45">
                    {r.email} · {r.phone} · {r.vehicle_type} · applied {formatDate(r.created_at)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/60">
                    OffPay ref:{" "}
                    {r.offpay_account_ref ? (
                      <span className="font-mono font-semibold">{r.offpay_account_ref}</span>
                    ) : (
                      <span className="italic text-chili">none submitted</span>
                    )}
                    {r.rating_count > 0 && (
                      <>
                        {" · "}
                        <span className="font-mono font-semibold">★ {r.rating_avg}</span> ({r.rating_count})
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ink/8 px-2.5 py-1 text-xs font-semibold capitalize text-ink/60">{r.status}</span>
                  {r.status !== "approved" && (
                    <button
                      onClick={() => act(r.id, setRiderStatus, "approved")}
                      disabled={busyId === r.id}
                      className="btn-accent h-9 px-4 text-xs"
                    >
                      Approve
                    </button>
                  )}
                  {r.status === "pending" && (
                    <button
                      onClick={() => act(r.id, setRiderStatus, "rejected")}
                      disabled={busyId === r.id}
                      className="btn-outline h-9 px-4 text-xs"
                    >
                      Reject
                    </button>
                  )}
                  {r.status === "approved" && (
                    <button
                      onClick={() => act(r.id, setRiderStatus, "suspended")}
                      disabled={busyId === r.id}
                      className="btn-outline h-9 px-4 text-xs"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-ink">{s.rider_name}</p>
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
                      onClick={() => act(s.id, decideRiderSettlement, "approved")}
                      disabled={busyId === s.id}
                      className="btn-accent h-9 px-4 text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => act(s.id, decideRiderSettlement, "rejected")}
                      disabled={busyId === s.id}
                      className="btn-outline h-9 px-4 text-xs"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-ink/8 px-2.5 py-1 text-xs font-semibold capitalize text-ink/60">{s.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
