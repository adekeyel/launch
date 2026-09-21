import { useCallback, useEffect, useState } from "react";
import { getPublicSettings } from "../services/settings";
import ErrorState from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { errorMessage } from "../lib/errors";
import { useContent } from "../context/ContentContext";

// The text lives in Admin > Pages; the page's name and the "not written yet"
// message live in Admin > Site content > Page names.
export default function StaticPage({ pageKey }) {
  const { content, t } = useContent();
  const settingKey = `page_${pageKey}`;
  const title = t(content.pages[`${pageKey}Title`]);
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const settings = await getPublicSettings();
      setBody(settings[settingKey] || "");
    } catch (err) {
      console.error(`Failed to load page content for ${settingKey}:`, err);
      setError(errorMessage(err, "We couldn't load this page."));
    } finally {
      setLoading(false);
    }
  }, [settingKey]);

  useEffect(() => {
    load();
  }, [load]);

  const paragraphs = (body || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <div className="mt-8">
        {loading ? (
          <div className="space-y-3" role="status" aria-busy="true">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : error ? (
          <ErrorState title="Couldn't load this page" message={error} onRetry={load} />
        ) : paragraphs.length === 0 ? (
          <p className="text-sm text-ink/45">{t(content.pages.emptyMessage)}</p>
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
