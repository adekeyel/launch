import { useEffect, useState } from "react";
import { listSettings, updateSetting } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";

const PAGES = [
  { key: "page_about", label: "About us", hint: "Shown at /about" },
  { key: "page_founder", label: "About the founder", hint: "Shown at /founder" },
  { key: "page_terms", label: "Terms of service", hint: "Shown at /terms" },
  { key: "page_privacy", label: "Privacy policy", hint: "Shown at /privacy" },
];

export default function AdminPages() {
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await listSettings();
        const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        setDrafts(Object.fromEntries(PAGES.map((p) => [p.key, byKey[p.key] || ""])));
      } catch (err) {
        console.error("Failed to load page content:", err);
        setError("Couldn't load page content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (key) => {
    setSavingKey(key);
    setError("");
    setSavedKey(null);
    try {
      // These are always public — that's the whole point of a site page.
      await updateSetting(key, drafts[key], true);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      setError(err?.message || `Couldn't save this page.`);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Site pages</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
      <p className="mt-6 max-w-xl text-sm text-ink/55">
        Edit the content shown on the footer's About, Terms, Privacy Policy, and About the Founder pages. Leave a
        blank line between paragraphs.
      </p>

      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading pages…" />
      ) : (
        <div className="mt-4 space-y-6">
          {PAGES.map((page) => (
            <section key={page.key} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-ink">{page.label}</h2>
                  <p className="text-xs text-ink/45">{page.hint}</p>
                </div>
                <button
                  onClick={() => handleSave(page.key)}
                  disabled={savingKey === page.key}
                  className="btn-outline h-9 px-4 text-xs"
                >
                  {savingKey === page.key ? "Saving…" : savedKey === page.key ? "Saved ✓" : "Save"}
                </button>
              </div>
              <textarea
                value={drafts[page.key] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [page.key]: e.target.value }))}
                rows={8}
                className="field-input mt-4 h-auto py-3 font-mono text-xs leading-relaxed"
                placeholder={`Write the ${page.label} content here…`}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
