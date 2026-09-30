import { useEffect, useState } from "react";
import RiderTabs from "../../components/RiderTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { getPublicSettings } from "../../services/settings";
import { getMyRiderProfile, updateMyRiderProfile, VEHICLE_TYPES } from "../../services/riders";

const STATUS_STYLE = {
  pending: "bg-marigold-soft text-marigold-dark",
  approved: "bg-basil-soft text-basil",
  rejected: "bg-chili-soft text-chili",
  suspended: "bg-chili-soft text-chili",
};

const STATUS_HINT = {
  pending: "Waiting for an admin to verify your OffPay account.",
  approved: "Verified — you can see and pick up orders.",
  rejected: "Not approved. Update your OffPay reference below and contact support.",
  suspended: "Suspended. Please contact support.",
};

export default function RiderProfile() {
  const toast = useToast();
  const [rider, setRider] = useState(null);
  const [form, setForm] = useState({ vehicleType: "bike", offpayAccountRef: "" });
  const [offpayUrl, setOffpayUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyRiderProfile();
        setRider(profile);
        setForm({ vehicleType: profile.vehicle_type, offpayAccountRef: profile.offpay_account_ref || "" });
      } catch (err) {
        console.error("Failed to load rider profile:", err);
        setError(errorMessage(err, "We couldn't load your profile."));
      } finally {
        setLoading(false);
      }
    })();
    getPublicSettings()
      .then((s) => setOffpayUrl(s?.offpay_registration_url || ""))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateMyRiderProfile(form);
      setRider((r) => ({ ...r, ...updated }));
      toast.success("Profile saved.");
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Rider dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Profile</h1>
      <div className="mt-6">
        <RiderTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading your profile…" />
      ) : !rider ? null : (
        <>
          <section className="card mt-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-ink">{rider.fullname}</p>
                <p className="text-sm text-ink/55">
                  {rider.email} · {rider.phone}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[rider.status]}`}>
                {rider.status}
              </span>
            </div>
            {rider.rating_count > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-ink/60">
                <span className="font-mono font-bold text-ink">★ {rider.rating_avg}</span>
                <span>
                  ({rider.rating_count} rating{rider.rating_count === 1 ? "" : "s"})
                </span>
              </p>
            )}
            <p className="mt-3 text-sm text-ink/60">{STATUS_HINT[rider.status]}</p>
          </section>

          <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-5">
            <div>
              <label className="field-label" htmlFor="vehicleType">
                Vehicle
              </label>
              <select
                id="vehicleType"
                value={form.vehicleType}
                onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
                className="field-input"
              >
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="offpayAccountRef">
                OffPay account reference
              </label>
              <input
                id="offpayAccountRef"
                value={form.offpayAccountRef}
                onChange={(e) => setForm((f) => ({ ...f, offpayAccountRef: e.target.value }))}
                className="field-input"
                placeholder="Paste your OffPay reference"
              />
              <p className="mt-1 text-xs text-ink/50">
                Delivery earnings are paid through OffPay.{" "}
                {offpayUrl && (
                  <a href={offpayUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-marigold-dark hover:underline">
                    Don't have one? Open an account →
                  </a>
                )}
              </p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
