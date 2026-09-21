import { useEffect, useState } from "react";
import { getMyVendorProfile, updateMyVendorProfile, uploadMyLogo, uploadMyBanner } from "../../services/vendors";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import Toggle from "../../components/Toggle";
import HoursEditor from "../../components/HoursEditor";
import { IconUpload } from "../../components/icons";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { defaultHours, normalizeHours } from "../../lib/hours";

export default function VendorProfile() {
  const toast = useToast();
  const [vendor, setVendor] = useState(null);
  const [hoursEnabled, setHoursEnabled] = useState(false);
  const [hours, setHours] = useState(defaultHours());
  const [delivery, setDelivery] = useState({ fee: "0", freeAbove: "" });
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const v = await getMyVendorProfile();
      setVendor(v);
      setForm({
        business_name: v.business_name || "",
        tagline: v.tagline || "",
        description: v.description || "",
        address: v.address || "",
        phone: v.phone || "",
        eta: v.eta || "",
        categories: (v.categories || []).join(", "),
      });
      setHoursEnabled(Boolean(v.opening_hours));
      setHours(v.opening_hours ? normalizeHours(v.opening_hours) : defaultHours());
      setDelivery({
        fee: String(v.delivery_fee ?? 0),
        freeAbove: v.free_delivery_above == null ? "" : String(v.free_delivery_above),
      });
    } catch (err) {
      console.error("Failed to load vendor profile:", err);
      setError("Couldn't load your shop profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError("");
    try {
      const updated = await uploadMyLogo(file);
      setVendor(updated);
    } catch (err) {
      setError(err?.message || "Couldn't upload logo.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError("");
    try {
      const updated = await uploadMyBanner(file);
      setVendor(updated);
    } catch (err) {
      setError(err?.message || "Couldn't upload banner.");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setError("");
    setSavingDetails(true);
    setSavedDetails(false);
    try {
      const categories = form.categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const updated = await updateMyVendorProfile({ ...form, categories });
      setVendor(updated);
      setSavedDetails(true);
      setTimeout(() => setSavedDetails(false), 2000);
    } catch (err) {
      setError(err?.message || "Couldn't save your shop details.");
    } finally {
      setSavingDetails(false);
    }
  };

  // Saves a slice of the profile (status, hours, delivery) and confirms with a toast.
  const saveSetting = async (patch, message, setBusy) => {
    setError("");
    setBusy(true);
    try {
      const updated = await updateMyVendorProfile(patch);
      setVendor(updated);
      toast.success(message);
    } catch (err) {
      console.error("Failed to save shop settings:", err);
      setError(errorMessage(err, "Couldn't save that. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const acceptingOrders = vendor ? !vendor.orders_paused : true;

  const handleToggleOrders = (accepting) =>
    saveSetting({ orders_paused: !accepting }, accepting ? "Orders resumed." : "Orders paused.", setSavingStatus);

  const handleSaveHours = (e) => {
    e.preventDefault();
    saveSetting({ opening_hours: hoursEnabled ? hours : null }, "Opening hours saved.", setSavingHours);
  };

  const handleSaveDelivery = (e) => {
    e.preventDefault();
    saveSetting(
      {
        delivery_fee: delivery.fee === "" ? 0 : Number(delivery.fee),
        free_delivery_above: delivery.freeAbove === "" ? null : Number(delivery.freeAbove),
      },
      "Delivery settings saved.",
      setSavingDelivery
    );
  };

  if (loading) return <Loader label="Loading your shop profile…" />;
  if (!vendor || !form) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Shop profile</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {/* Banner + logo preview, matching how customers see it on your vendor card */}
      <section className="card mt-6 overflow-hidden">
        <div className="relative h-36 w-full overflow-hidden bg-ink/5">
          {vendor.banner_url ? (
            vendor.banner_media_type === "video" ? (
              <video src={vendor.banner_url} className="h-full w-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-marigold-soft to-basil-soft font-display text-3xl font-extrabold text-ink/20">
              {vendor.business_name?.[0] ?? "?"}
            </div>
          )}
          <label
            htmlFor="banner-upload"
            className="absolute bottom-3 right-3 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-ink/80 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-ink"
          >
            <IconUpload className="h-3.5 w-3.5" />
            {uploadingBanner ? "Uploading…" : "Change banner"}
          </label>
          <input
            id="banner-upload"
            type="file"
            accept="image/*,video/*"
            className="hidden"
            disabled={uploadingBanner}
            onChange={handleBannerChange}
          />
        </div>

        <div className="flex items-center gap-4 px-5 py-4">
          <div className="relative h-16 w-16 shrink-0">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt="" className="h-16 w-16 rounded-2xl border border-line object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-marigold-soft font-display text-xl font-bold text-marigold-dark">
                {vendor.business_name?.[0] ?? "?"}
              </div>
            )}
            <label
              htmlFor="logo-upload"
              className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow hover:bg-charcoal"
              aria-label="Change logo"
            >
              <IconUpload className="h-3 w-3" />
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingLogo}
              onChange={handleLogoChange}
            />
          </div>
          <div>
            <p className="font-display text-base font-bold text-ink">{vendor.business_name}</p>
            <p className="text-xs text-ink/50">
              {uploadingLogo ? "Uploading logo…" : "This is exactly how customers see your shop."}
            </p>
          </div>
        </div>
      </section>

      {/* Store status: the instant pause switch */}
      <section className="card mt-6 p-5">
        <Toggle
          label="Accepting orders"
          description={
            acceptingOrders
              ? vendor.open_now
                ? vendor.open_label || "Customers can order from you now."
                : `Closed right now. ${vendor.open_label || ""}`
              : "Paused. Customers can browse your menu but can't order."
          }
          checked={acceptingOrders}
          disabled={savingStatus}
          onChange={handleToggleOrders}
        />
      </section>

      {/* Shop details */}
      <form onSubmit={handleSaveDetails} className="card mt-6 space-y-4 p-5">
        <h2 className="font-display text-base font-bold text-ink">Shop details</h2>
        <div>
          <label className="field-label">Business name</label>
          <input value={form.business_name} onChange={update("business_name")} required className="field-input" />
        </div>
        <div>
          <label className="field-label">Tagline (optional)</label>
          <input value={form.tagline} onChange={update("tagline")} className="field-input" placeholder="A short line under your name" />
        </div>
        <div>
          <label className="field-label">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={3}
            className="field-input h-auto py-2.5"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Address</label>
            <input value={form.address} onChange={update("address")} className="field-input" />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input value={form.phone} onChange={update("phone")} className="field-input" />
          </div>
          <div>
            <label className="field-label">Estimated delivery time (optional)</label>
            <input value={form.eta} onChange={update("eta")} className="field-input" placeholder="e.g. 30–45 mins" />
          </div>
          <div>
            <label className="field-label">Categories (comma-separated)</label>
            <input value={form.categories} onChange={update("categories")} className="field-input" placeholder="Rice, Grills, Drinks" />
          </div>
        </div>
        <button type="submit" disabled={savingDetails} className="btn-primary">
          {savingDetails ? "Saving…" : savedDetails ? "Saved ✓" : "Save changes"}
        </button>
      </form>

      {/* Opening hours */}
      <form onSubmit={handleSaveHours} className="card mt-6 space-y-4 p-5">
        <h2 className="font-display text-base font-bold text-ink">Opening hours</h2>
        <Toggle
          label="Set opening hours"
          description="Off means you're open whenever “Accepting orders” is on. Times are Lagos time."
          checked={hoursEnabled}
          onChange={setHoursEnabled}
        />
        {hoursEnabled && <HoursEditor hours={hours} onChange={setHours} />}
        <button type="submit" disabled={savingHours} className="btn-primary">
          {savingHours ? "Saving…" : "Save opening hours"}
        </button>
      </form>

      {/* Delivery */}
      <form onSubmit={handleSaveDelivery} className="card mt-6 space-y-4 p-5">
        <h2 className="font-display text-base font-bold text-ink">Delivery fee</h2>
        <p className="text-sm text-ink/55">
          Customers pay this on top of their food. You keep it (the 5% commission applies to food only). Leave it at 0
          for free delivery.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="delivery-fee">
              Delivery fee (₦)
            </label>
            <input
              id="delivery-fee"
              type="number"
              min="0"
              step="50"
              inputMode="decimal"
              value={delivery.fee}
              onChange={(e) => setDelivery((d) => ({ ...d, fee: e.target.value }))}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="free-above">
              Free delivery on orders over (₦, optional)
            </label>
            <input
              id="free-above"
              type="number"
              min="0"
              step="100"
              inputMode="decimal"
              value={delivery.freeAbove}
              onChange={(e) => setDelivery((d) => ({ ...d, freeAbove: e.target.value }))}
              className="field-input"
              placeholder="e.g. 5000"
            />
          </div>
        </div>
        <button type="submit" disabled={savingDelivery} className="btn-primary">
          {savingDelivery ? "Saving…" : "Save delivery settings"}
        </button>
      </form>
    </div>
  );
}
