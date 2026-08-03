import { useEffect, useState } from "react";
import { getAnalytics } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import { formatMoney } from "../../lib/format";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getAnalytics();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        if (!cancelled) setError("Couldn't load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Analytics</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading analytics…" />
      ) : data ? (
        <div className="mt-6 space-y-8">
          <section>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <div className="card px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink/45">Total revenue (non-cancelled)</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">
                  {formatMoney(data.revenue?.total_revenue)}
                </p>
              </div>
              <div className="card px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink/45">Total orders</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">{data.revenue?.total_orders ?? 0}</p>
              </div>
            </div>
          </section>

          <BreakdownSection title="Users by role" rows={data.usersByRole} labelKey="role" />
          <BreakdownSection title="Vendors by status" rows={data.vendorsByStatus} labelKey="status" />
          <BreakdownSection title="Orders by status" rows={data.ordersByStatus} labelKey="status" />
        </div>
      ) : null}
    </div>
  );
}

function BreakdownSection({ title, rows }) {
  const total = rows?.reduce((s, r) => s + r.count, 0) || 0;
  return (
    <section>
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/50">{title}</h2>
      <div className="card divide-y divide-line">
        {rows?.map((row) => (
          <div key={row.role ?? row.status} className="flex items-center justify-between p-4">
            <span className="text-sm font-medium capitalize text-ink">{row.role ?? row.status}</span>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-marigold"
                  style={{ width: `${total ? (row.count / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-sm text-ink/60">{row.count}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
