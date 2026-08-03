import { useEffect, useState } from "react";
import { listAllVendors, setVendorStatus, setVendorTier } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import TierBadge from "../../components/TierBadge";

const STATUS_OPTIONS = ["pending", "approved", "suspended", "rejected"];

export default function AdminDashboard() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllVendors({ limit: 100 });
      setVendors(data.vendors);
    } catch (err) {
      console.error("Failed to load vendors:", err);
      setError("Couldn't load vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (vendor, status) => {
    setBusyId(vendor.id);
    setError("");
    try {
      const updated = await setVendorStatus(vendor.id, status);
      setVendors((vs) => vs.map((v) => (v.id === vendor.id ? { ...v, ...updated } : v)));
    } catch (err) {
      setError(err?.message || "Couldn't update vendor status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleVerify = async (vendor) => {
    setBusyId(vendor.id);
    setError("");
    try {
      const updated = await setVendorTier(vendor.id, vendor.tier >= 1 ? 0 : 1);
      setVendors((vs) => vs.map((v) => (v.id === vendor.id ? { ...v, ...updated } : v)));
    } catch (err) {
      setError(err?.message || "Couldn't update vendor tier.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Vendors</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
      <p className="mt-6 max-w-xl text-sm text-ink/55">
        Approve a vendor's status and verify their Tier 1 payment account to make their menu visible to customers.
        Tier 2 (Pro) and advertising are managed from the Subscriptions and Campaigns tabs once a vendor requests
        them.
      </p>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader label="Loading vendors…" />
        ) : vendors.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink/50">No vendors have registered yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {vendors.map((vendor) => (
              <li key={vendor.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{vendor.business_name}</p>
                    <TierBadge tier={vendor.tier} />
                  </div>
                  <p className="text-xs text-ink/45">
                    {vendor.owner_name} · {vendor.owner_email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={vendor.status}
                    disabled={busyId === vendor.id}
                    onChange={(e) => handleStatus(vendor, e.target.value)}
                    className="h-9 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-ink"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleVerify(vendor)}
                    disabled={busyId === vendor.id}
                    className={vendor.tier >= 1 ? "btn-outline h-9 px-4 text-xs" : "btn-accent h-9 px-4 text-xs"}
                  >
                    {vendor.tier >= 1 ? "Un-verify" : "Verify (Tier 1)"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
