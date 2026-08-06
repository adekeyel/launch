import { useEffect, useState } from "react";
import { listAllAds, createAd, updateAd, deleteAd, PLACEMENTS } from "../../services/ads";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";
import EmptyState from "../../components/EmptyState";
import { IconTrash, IconUpload } from "../../components/icons";
import { formatDate } from "../../lib/format";

const EMPTY_FORM = { title: "", linkUrl: "", placement: "top", page: "all" };

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllAds({ limit: 100 });
      setAds(data.ads);
    } catch (err) {
      console.error("Failed to load ads:", err);
      setError("Couldn't load ads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (!mediaFile) {
      setError("A banner image or video is required.");
      return;
    }
    setSubmitting(true);
    try {
      await createAd({ ...form, mediaFile });
      setForm(EMPTY_FORM);
      setMediaFile(null);
      await load();
    } catch (err) {
      setError(err?.message || "Couldn't create this ad.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (ad) => {
    setBusyId(ad.id);
    setError("");
    try {
      const updated = await updateAd(ad.id, { isActive: !ad.is_active });
      setAds((list) => list.map((a) => (a.id === ad.id ? updated : a)));
    } catch (err) {
      setError(err?.message || "Couldn't update this ad.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete the ad "${ad.title}"?`)) return;
    setBusyId(ad.id);
    setError("");
    try {
      await deleteAd(ad.id);
      setAds((list) => list.filter((a) => a.id !== ad.id));
    } catch (err) {
      setError(err?.message || "Couldn't delete this ad.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Ads</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
      <p className="mt-6 max-w-xl text-sm text-ink/55">
        Post a banner directly, or approve vendor-purchased campaigns from the{" "}
        <a href="/admin/campaigns" className="font-semibold text-marigold-dark hover:underline">
          Campaigns
        </a>{" "}
        tab — both land here once live. Slots: top &amp; bottom (50px tall), middle (100px tall), each full width.
        A slot stays hidden on any page until an ad is actually posted for it.
      </p>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      <form onSubmit={handleCreate} className="card mt-6 space-y-4 p-5">
        <h2 className="font-display text-base font-bold text-ink">Post a new ad</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">Name / title</label>
            <input value={form.title} onChange={update("title")} required className="field-input" placeholder="July promo — top banner" />
          </div>
          <div>
            <label className="field-label">Link URL (optional)</label>
            <input value={form.linkUrl} onChange={update("linkUrl")} className="field-input" placeholder="https://…" />
          </div>
          <div>
            <label className="field-label">Placement</label>
            <select value={form.placement} onChange={update("placement")} className="field-input">
              {PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Page (path, or "all")</label>
            <input value={form.page} onChange={update("page")} className="field-input" placeholder="all, or e.g. /vendors" />
          </div>
        </div>

        <div>
          <label className="field-label">Banner image or short video</label>
          <label
            htmlFor="ad-media"
            className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 text-sm text-ink/50 hover:border-marigold hover:text-ink"
          >
            <IconUpload className="h-4 w-4" />
            {mediaFile ? mediaFile.name : "Upload banner"}
          </label>
          <input
            id="ad-media"
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-accent">
          {submitting ? "Posting…" : "Post ad"}
        </button>
      </form>

      <div className="mt-8">
        {loading ? (
          <Loader label="Loading ads…" />
        ) : ads.length === 0 ? (
          <EmptyState title="No ads yet" hint="Ads you post or approve from vendor campaigns will show up here." />
        ) : (
          <ul className="divide-y divide-line">
            {ads.map((ad) => (
              <li key={ad.id} className="flex items-center gap-4 py-4">
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                  {ad.media_url && ad.media_type !== "video" && (
                    <img src={ad.media_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{ad.title}</p>
                  <p className="text-xs text-ink/45">
                    {ad.placement} · {ad.page} · posted {formatDate(ad.created_at)}
                  </p>
                  <p className="text-xs text-ink/45">
                    {(ad.impressions ?? 0).toLocaleString()} impressions · {(ad.clicks ?? 0).toLocaleString()} clicks
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(ad)}
                  disabled={busyId === ad.id}
                  className={`h-8 rounded-full px-3 text-xs font-semibold transition ${
                    ad.is_active ? "bg-basil-soft text-basil" : "bg-ink/8 text-ink/50"
                  }`}
                >
                  {ad.is_active ? "Live" : "Paused"}
                </button>
                <button
                  onClick={() => handleDelete(ad)}
                  disabled={busyId === ad.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink/40 transition hover:bg-chili-soft hover:text-chili"
                  aria-label={`Delete ${ad.title}`}
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
