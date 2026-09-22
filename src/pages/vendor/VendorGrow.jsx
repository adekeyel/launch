import { useEffect, useRef, useState } from "react";
import { getPublicSettings } from "../../services/settings";
import { getMyVendorProfile } from "../../services/vendors";
import * as monetization from "../../services/monetization";
import VendorTabs from "../../components/VendorTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import { formatMoney, formatDate } from "../../lib/format";
import {
  IconMegaphone,
  IconSearch,
  IconMenu,
  IconStar,
  IconClock,
  IconSparkle,
  IconCheck,
} from "../../components/icons";

const TYPE_ICONS = { megaphone: IconMegaphone, search: IconSearch, menu: IconMenu, star: IconStar, clock: IconClock, sparkle: IconSparkle };

const PRO_CYCLES = [
  { value: "monthly", label: "Monthly", priceKey: "pro_price_monthly" },
  { value: "quarterly", label: "Quarterly", priceKey: "pro_price_quarterly" },
  { value: "yearly", label: "Yearly", priceKey: "pro_price_yearly" },
];

const SUB_STATUS_LABEL = {
  pending_payment: "Awaiting payment confirmation",
  active: "Active",
  expired: "Expired",
};

export default function VendorGrow() {
  const [settings, setSettings] = useState({});
  const [vendor, setVendor] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adSpaces, setAdSpaces] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, v, subs, camps, spaces] = await Promise.all([
        getPublicSettings(),
        getMyVendorProfile(),
        monetization.listMySubscriptions(),
        monetization.listMyCampaigns(),
        monetization.getAdSpaces(),
      ]);
      setSettings(s);
      setVendor(v);
      setSubscriptions(subs.subscriptions);
      setCampaigns(camps.campaigns);
      setAdSpaces(spaces);
    } catch (err) {
      console.error("Failed to load Grow page:", err);
      setError("Couldn't load this page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader label="Loading…" />;
  if (!vendor) return null;

  const offpayUrl = settings.offpay_registration_url;
  const activeProSub = subscriptions.find((s) => s.plan === "pro" && s.status === "active");
  const pendingProSub = subscriptions.find((s) => s.plan === "pro" && s.status === "pending_payment");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Vendor dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Grow your kitchen</h1>
      <div className="mt-6">
        <VendorTabs />
      </div>
      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {/* Tier 1 — OffPay verification */}
      {vendor.tier < 1 ? (
        <section className="card mt-8 p-6">
          <h2 className="font-display text-lg font-bold text-ink">Step 1 · Set up your payment account</h2>
          <p className="mt-2 text-sm text-ink/60">
            Publish your menu and start receiving orders by setting up a payment account with OffPay. Complete
            OffPay's registration, then an admin will verify and upgrade you to Verified (Tier 1) — after that a 5%
            platform commission applies to completed orders, covering payment processing and platform costs.
          </p>
          <a href={offpayUrl} target="_blank" rel="noopener noreferrer" className="btn-accent mt-4 inline-flex">
            Set up payment account on OffPay
          </a>
        </section>
      ) : (
        <>
          {/* Pro subscription */}
          <section className="card mt-8 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink">Go Pro</h2>
              {activeProSub && (
                <span className="rounded-full bg-basil-soft px-2.5 py-1 text-xs font-semibold text-basil">
                  Active until {formatDate(activeProSub.current_period_end)}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-ink/60">
              Priority homepage placement, higher search ranking, a Pro badge on your shop, featured collections,
              advanced analytics, and discount/coupon tools.
            </p>

            {pendingProSub ? (
              <PendingPaymentCard
                item={pendingProSub}
                onSubmitRef={async (ref) => {
                  await monetization.attachSubscriptionPaymentRef(pendingProSub.id, ref);
                  await load();
                }}
              />
            ) : activeProSub ? (
              <button
                onClick={async () => {
                  await monetization.cancelMySubscription(activeProSub.id);
                  await load();
                }}
                className="btn-outline mt-4"
              >
                Cancel renewal
              </button>
            ) : (
              <ProSubscribeForm
                settings={settings}
                onSubscribe={async (cycle) => {
                  await monetization.subscribe("pro", cycle);
                  await load();
                }}
              />
            )}
          </section>

          {/* Advertising */}
          <section className="card mt-8 overflow-hidden p-0">
            <div className="border-b border-line bg-gradient-to-br from-ink to-ink/90 p-6 text-paper">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-paper/15">
                  <IconMegaphone className="h-5 w-5" />
                </span>
                <h2 className="font-display text-lg font-bold">Advertise</h2>
              </div>
              <p className="mt-2 max-w-xl text-sm text-paper/70">
                Run a paid campaign to get more eyes on your kitchen — homepage banners, sponsored search
                placement, category promotion, and more. Sponsored campaigns are always clearly labeled to
                customers, so trust in your shop stays intact.
              </p>
            </div>

            <div className="p-6">
              {adSpaces ? (
                <CampaignForm
                  adSpaces={adSpaces}
                  onCreate={async (payload) => {
                    await monetization.createCampaign(payload);
                    await load();
                  }}
                />
              ) : (
                <p className="text-sm text-ink/50">Ad space pricing isn't available right now.</p>
              )}

              {campaigns.length > 0 && (
                <div className="mt-8 border-t border-line pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/45">Your campaigns</h3>
                  <ul className="mt-3 divide-y divide-line">
                    {campaigns.map((c) => {
                      const space = adSpaces?.spaces.find((s) => s.key === c.campaign_type);
                      const Icon = TYPE_ICONS[monetization.PLACEMENT_ICONS[c.campaign_type]] || IconMegaphone;
                      return (
                        <li key={c.id} className="flex items-center justify-between gap-3 py-3.5 text-sm">
                          <div className="flex items-center gap-3">
                            {c.media_type === "video" ? (
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink/5 text-[9px] text-ink/50">
                                Video
                              </span>
                            ) : c.media_url ? (
                              <img src={c.media_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                            ) : (
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60">
                                <Icon className="h-4.5 w-4.5" />
                              </span>
                            )}
                            <div>
                              <p className="font-medium text-ink">{space?.label || c.campaign_type}</p>
                              <p className="text-xs text-ink/45">
                                {c.duration_days} day{c.duration_days > 1 ? "s" : ""} · {formatMoney(c.price)}
                                {c.payment_ref && <span className="font-mono"> · ref {c.payment_ref}</span>}
                              </p>
                            </div>
                          </div>
                          <CampaignStatus status={c.status} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function ProSubscribeForm({ settings, onSubscribe }) {
  const [cycle, setCycle] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubscribe(cycle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="grid grid-cols-3 gap-2">
        {PRO_CYCLES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCycle(c.value)}
            className={`rounded-xl border p-3 text-left transition ${
              cycle === c.value ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink/30"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{c.label}</p>
            <p className="mt-1 font-mono text-base font-bold">{formatMoney(settings[c.priceKey])}</p>
          </button>
        ))}
      </div>
      <button type="submit" disabled={submitting} className="btn-accent mt-4">
        {submitting ? "Starting…" : "Subscribe to Pro"}
      </button>
    </form>
  );
}

function readMediaSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const done = (value, err) => {
      URL.revokeObjectURL(url);
      err ? reject(err) : resolve(value);
    };
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => done({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
      v.onerror = () => done(null, new Error("Couldn't read that video."));
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => done({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => done(null, new Error("Couldn't read that image."));
      img.src = url;
    }
  });
}

// Plain-English problem with this file for this ad space, or "" if it's fine.
function checkBannerFile(file, size, space) {
  if (!file) return "";
  if (!space.mimeTypes.includes(file.type)) return `Wrong file type. ${space.note}`;
  if (file.size > space.maxMb * 1024 * 1024) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit for this space is ${space.maxMb} MB.`;
  }
  if (!size) return "";
  if (size.duration && size.duration > 30.5) return "Videos can be at most 30 seconds long.";
  if (size.width < space.minWidth) {
    return `Too small: ${size.width}×${size.height}px. Use at least ${space.minWidth}px wide (ideal ${space.width}×${space.height}px).`;
  }
  const target = space.width / space.height;
  const actual = size.width / size.height;
  if (Math.abs(actual - target) / target > space.tolerance) {
    return `Wrong shape: yours is ${size.width}×${size.height}px. This space needs about ${space.width}×${space.height}px.`;
  }
  return "";
}

function CampaignForm({ adSpaces, onCreate }) {
  const [placement, setPlacement] = useState(adSpaces.spaces[0].key);
  const [days, setDays] = useState(7);
  const [paymentRef, setPaymentRef] = useState("");
  const [banner, setBanner] = useState(null);
  const [bannerSize, setBannerSize] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bannerInput = useRef(null);

  const space = adSpaces.spaces.find((s) => s.key === placement);
  const price = space.prices[days];
  const bannerProblem = checkBannerFile(banner, bannerSize, space);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const clearBanner = () => {
    setBanner(null);
    setBannerSize(null);
    setPreviewUrl("");
    if (bannerInput.current) bannerInput.current.value = "";
  };

  const onPickPlacement = (key) => {
    setPlacement(key);
    clearBanner(); // a banner sized for one space is rarely right for another
  };

  const onPickBanner = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBanner(file);
    setPreviewUrl(URL.createObjectURL(file));
    setBannerSize(null);
    try {
      setBannerSize(await readMediaSize(file));
    } catch {
      setBannerSize(null); // the server still checks file type and size
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!banner) return setError("Please upload your banner (step 3).");
    if (bannerProblem) return setError(bannerProblem);
    if (paymentRef.trim().length < 4) {
      return setError("Enter the OffPay payment reference for this campaign (at least 4 characters).");
    }
    setSubmitting(true);
    try {
      await onCreate({ placement, durationDays: days, paymentRef: paymentRef.trim(), bannerFile: banner });
      setPaymentRef("");
      clearBanner();
    } catch (err) {
      setError(err?.message || "Couldn't start this campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Ad space */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45">1. Choose an ad space</p>
        <div className="overflow-hidden rounded-xl border border-ink/12">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-ink/[0.03] text-xs uppercase tracking-wide text-ink/45">
                <th className="w-8 px-3 py-2" />
                <th className="px-3 py-2 font-semibold">Space</th>
                <th className="px-3 py-2 font-semibold">Size</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {adSpaces.spaces.map((s) => {
                const Icon = TYPE_ICONS[monetization.PLACEMENT_ICONS[s.key]] || IconMegaphone;
                const active = placement === s.key;
                return (
                  <tr
                    key={s.key}
                    onClick={() => onPickPlacement(s.key)}
                    aria-pressed={active}
                    className={`cursor-pointer transition ${active ? "bg-ink text-paper" : "hover:bg-ink/[0.03]"}`}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full ${
                          active ? "bg-paper/15" : "bg-ink/5 text-ink/60"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold">{s.label}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {s.width}×{s.height}
                    </td>
                    <td className={`px-3 py-3 text-xs ${active ? "text-paper/70" : "text-ink/50"}`}>{s.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink/45">{space.description}</p>
      </div>

      {/* 2. Duration */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45">2. Choose how long it runs</p>
        <div className="grid grid-cols-4 gap-2">
          {adSpaces.durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-xl border py-3 text-center transition ${
                days === d ? "border-ink bg-ink text-paper" : "border-ink/12 text-ink/60 hover:border-ink/30"
              }`}
            >
              <p className="text-sm font-bold">
                {d} day{d > 1 ? "s" : ""}
              </p>
              <p className={`mt-0.5 text-xs ${days === d ? "text-paper/70" : "text-ink/45"}`}>{formatMoney(space.prices[d])}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Banner upload */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45">3. Upload your banner</p>
        <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
          <p className="text-sm font-semibold text-ink">
            {space.label}: {space.width}×{space.height}px
          </p>
          <p className="mt-1 text-xs text-ink/55">
            {space.note} Up to {space.maxMb} MB, at least {space.minWidth}px wide.
          </p>
          <input
            ref={bannerInput}
            type="file"
            accept={space.mimeTypes.join(",")}
            onChange={onPickBanner}
            className="mt-3 block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-semibold file:text-paper"
          />
          {banner && (
            <div className="mt-3 space-y-2">
              <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
                {banner.type.startsWith("video/") ? (
                  <video src={previewUrl} className="mx-auto max-h-48 w-full object-contain" muted controls />
                ) : (
                  <img src={previewUrl} alt="Your banner preview" className="mx-auto max-h-48 w-full object-contain" />
                )}
              </div>
              {bannerSize && (
                <p className="text-xs text-ink/55">
                  Your file: {bannerSize.width}×{bannerSize.height}px · {(banner.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
              {bannerProblem ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{bannerProblem}</p>
              ) : bannerSize ? (
                <p className="text-sm font-semibold text-emerald-700">✓ This banner fits the {space.label.toLowerCase()}.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 4. Summary + OffPay payment */}
      <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">4. Pay with OffPay</p>
            <p className="mt-1 text-sm text-ink/70">
              {space.label} · {days} day{days > 1 ? "s" : ""}
            </p>
          </div>
          <p className="font-display text-2xl font-bold text-ink">{formatMoney(price)}</p>
        </div>
        <p className="mt-3 rounded-lg bg-marigold-soft px-3 py-2 text-xs text-marigold-dark">
          Pay {formatMoney(price)} to LAUNCH TIME on OffPay, then enter the reference from your payment below. Your
          campaign starts as soon as an admin confirms it.
        </p>
        <div className="mt-3">
          <label className="field-label" htmlFor="campaignPaymentRef">
            OffPay payment reference
          </label>
          <input
            id="campaignPaymentRef"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            maxLength={100}
            className="field-input"
            placeholder="e.g. the transaction ID from your OffPay receipt"
          />
        </div>
      </div>

      <ErrorBanner message={error} />

      <button type="submit" disabled={submitting} className="btn-accent w-full">
        {submitting ? "Sending…" : `Submit ad request · ${formatMoney(price)}`}
      </button>
    </form>
  );
}

function PendingPaymentCard({ item, onSubmitRef }) {
  const [ref, setRef] = useState(item.payment_ref || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitRef(ref);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-marigold/30 bg-marigold-soft/40 p-4">
      <p className="text-sm font-semibold text-marigold-dark">
        {SUB_STATUS_LABEL[item.status]} · {formatMoney(item.amount)}
      </p>
      <p className="mt-1 text-xs text-ink/55">Pay via OffPay, then submit your payment reference below.</p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="OffPay payment reference"
          className="field-input"
          required
        />
        <button type="submit" disabled={submitting} className="btn-primary shrink-0">
          {submitting ? "Saving…" : "Submit"}
        </button>
      </form>
    </div>
  );
}

function CampaignStatus({ status }) {
  const styles = {
    pending_payment: "bg-marigold-soft text-marigold-dark",
    active: "bg-basil-soft text-basil",
    expired: "bg-ink/10 text-ink/50",
  };
  const labels = { pending_payment: "Awaiting activation", active: "Active", expired: "Ended" };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-ink/10 text-ink/50"}`}>
      {labels[status] || status}
    </span>
  );
}
