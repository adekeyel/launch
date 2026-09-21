import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import SchemaForm, { withIds, withoutIds } from "../../components/admin/SchemaForm";
import { getAdminContent, saveContentSection, resetContentSection } from "../../services/content";
import { useContent } from "../../context/ContentContext";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";
import { IconChevronLeft, IconChevronRight } from "../../components/icons";

// Parts of the site that are edited on their own screens.
const ELSEWHERE = [
  { to: "/admin/ads", title: "Ads and banners", text: "The rotating home banner, promo tiles and the strips above and below pages: images, GIFs and videos." },
  { to: "/admin/pages", title: "Page text", text: "The text of About us, About the founder, Terms of service and Privacy policy." },
  { to: "/admin/settings", title: "Payments and prices", text: "The bank account customers pay into, subscription and advertising prices, and commission." },
];

const cardClass = "card group flex h-full flex-col p-5 transition hover:shadow-ticket";

export default function AdminContent() {
  const { section } = useParams();
  const { reload: reloadSite } = useContent();
  const toast = useToast();

  const [data, setData] = useState(null); // { schema, content, customised }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setData(await getAdminContent());
    } catch (err) {
      console.error("Failed to load site content:", err);
      setLoadError(errorMessage(err, "Couldn't load the site content."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const definition = useMemo(() => data?.schema.find((s) => s.key === section), [data, section]);

  // ---- the editor's working copy ----
  const [form, setForm] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [problems, setProblems] = useState({ summary: "", items: [] });

  useEffect(() => {
    if (!definition || !data) {
      setForm(null);
      return;
    }
    const saved = data.content[definition.key];
    setForm(withIds(definition.fields, saved));
    setSavedSnapshot(JSON.stringify(saved));
    setProblems({ summary: "", items: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition?.key, data?.schema]);

  const dirty = useMemo(
    () => Boolean(form) && JSON.stringify(withoutIds(form)) !== savedSnapshot,
    [form, savedSnapshot]
  );

  // Warn before the tab is closed with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const applySaved = (key, content, customisedAt) => {
    setData((d) => ({
      ...d,
      content: { ...d.content, [key]: content },
      customised: customisedAt === null ? Object.fromEntries(Object.entries(d.customised).filter(([k]) => k !== key)) : { ...d.customised, [key]: customisedAt },
    }));
    setForm(withIds(definition.fields, content));
    setSavedSnapshot(JSON.stringify(content));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProblems({ summary: "", items: [] });
    try {
      const result = await saveContentSection(definition.key, withoutIds(form));
      applySaved(definition.key, result.content, result.updated_at);
      toast.success("Saved. The website now shows this.");
      reloadSite();
    } catch (err) {
      console.error("Failed to save site content:", err);
      // The server sends a summary ("Please fix 2 things…") plus one message per problem.
      const details = Array.isArray(err?.errors) ? err.errors : [];
      setProblems({
        summary: details.length > 0 ? err.message : errorMessage(err, "Couldn't save. Please try again."),
        items: details,
      });
      window.scrollTo?.({ top: 0 });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Put this section back to the original content? Your edits to it will be lost.")) return;
    setResetting(true);
    setProblems({ summary: "", items: [] });
    try {
      const result = await resetContentSection(definition.key);
      applySaved(definition.key, result.content, null);
      toast.success("Back to the original content.");
      reloadSite();
    } catch (err) {
      console.error("Failed to reset site content:", err);
      setProblems({ summary: errorMessage(err, "Couldn't reset. Please try again."), items: [] });
    } finally {
      setResetting(false);
    }
  };

  const handleDiscard = () => {
    setForm(withIds(definition.fields, JSON.parse(savedSnapshot)));
    setProblems({ summary: "", items: [] });
  };

  // ---- screens ----
  const header = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Site content</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {header}
        <div className="mt-8">
          <Loader label="Loading site content…" />
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {header}
        <div className="mt-8">
          <ErrorState title="Couldn't load site content" message={loadError} onRetry={load} />
        </div>
      </div>
    );
  }

  // The list of everything editable
  if (!section) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {header}
        <p className="mt-6 max-w-2xl text-sm text-ink/60">
          Everything customers see on the website can be changed from here. Pick a part of the site to edit it; changes go live as
          soon as you save. Sections marked "Customised" have been changed from the original.
        </p>

        <h2 className="mt-8 font-display text-lg font-bold text-ink">Parts of the website</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {data.schema.map((s) => (
            <li key={s.key}>
              <Link to={`/admin/content/${s.key}`} className={cardClass}>
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-base font-bold text-ink">{s.label}</span>
                  {data.customised[s.key] && (
                    <span className="shrink-0 rounded-full bg-basil-soft px-2 py-0.5 text-xs font-semibold text-basil">Customised</span>
                  )}
                </span>
                <span className="mt-1 text-sm text-ink/55">{s.description}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-ink/70 group-hover:text-ink">
                  Edit <IconChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-display text-lg font-bold text-ink">Edited on their own screens</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-3">
          {ELSEWHERE.map((e) => (
            <li key={e.to}>
              <Link to={e.to} className={cardClass}>
                <span className="font-display text-base font-bold text-ink">{e.title}</span>
                <span className="mt-1 text-sm text-ink/55">{e.text}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-ink/70 group-hover:text-ink">
                  Open <IconChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {header}
        <div className="mt-8">
          <EmptyState
            title="That part of the site doesn't exist"
            hint="It may have been renamed."
            action={
              <Link to="/admin/content" className="btn-outline">
                Back to site content
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const customised = Boolean(data.customised[definition.key]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {header}

      <Link to="/admin/content" className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
        <IconChevronLeft className="h-4 w-4" /> All parts of the site
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold text-ink">{definition.label}</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink/55">{definition.description}</p>
          <p className="mt-2 text-xs text-ink/40">
            In any text you can write {"{siteName}"} to insert the site name and {"{year}"} for the year.
          </p>
        </div>
        <a href={definition.previewPath} target="_blank" rel="noopener noreferrer" className="btn-outline h-9 shrink-0 px-4 text-xs">
          View on the site
        </a>
      </div>

      {problems.summary && (
        <div role="alert" className="mt-6 rounded-xl border border-chili/25 bg-chili-soft px-4 py-3 text-sm text-chili">
          <p className="font-semibold">{problems.summary}</p>
          {problems.items.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {problems.items.map((item, i) => (
                <li key={i}>{item.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {form && (
        <form onSubmit={handleSave} className="mt-6">
          <div className="card space-y-5 p-5">
            <SchemaForm fields={definition.fields} value={form} onChange={setForm} />
          </div>

          <div className="sticky bottom-0 z-20 mt-4 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 py-3 backdrop-blur">
            <button type="submit" disabled={!dirty || saving} className="btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={handleDiscard} disabled={!dirty || saving} className="btn-outline">
              Discard changes
            </button>
            {customised && (
              <button type="button" onClick={handleReset} disabled={resetting || saving} className="btn-outline ml-auto text-chili">
                {resetting ? "Resetting…" : "Reset to original"}
              </button>
            )}
            <p className="w-full text-xs text-ink/45 sm:w-auto" role="status">
              {dirty ? "You have unsaved changes." : customised ? "Saved. This part of the site has been customised." : "Showing the original content."}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
