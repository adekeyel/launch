import { useEffect, useState } from "react";
import { getPublicSettings } from "../services/settings";
import Loader from "../components/Loader";

export default function StaticPage({ title, settingKey }) {
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const settings = await getPublicSettings();
        if (!cancelled) setBody(settings[settingKey] || "");
      } catch (err) {
        console.error(`Failed to load page content for ${settingKey}:`, err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settingKey]);

  const paragraphs = (body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <div className="mt-8">
        {loading ? (
          <Loader label="Loading…" />
        ) : paragraphs.length === 0 ? (
          <p className="text-sm text-ink/45">This page hasn't been written yet — check back soon.</p>
        ) : (
          <div className="space-y-4 text-sm leading-relaxed text-ink/70">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
