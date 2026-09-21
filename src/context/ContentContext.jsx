import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSiteContent } from "../services/content";
import { DEFAULT_CONTENT } from "../lib/contentDefaults";
import { fillTokens, mergeContent } from "../lib/content";

const ContentContext = createContext(null);
const CACHE_KEY = "lt:content:v1";

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private mode) — no cache, no harm
  }
};

// The editable website content (Admin > Site content). Starts from the last
// copy this browser saw (so returning visitors never see a flash of old text),
// falls back to the built-in defaults if the server can't be reached, and
// replaces both as soon as fresh content arrives.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(() => mergeContent(DEFAULT_CONTENT, readCache()));
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getSiteContent();
      setContent(mergeContent(DEFAULT_CONTENT, data));
      writeCache(data);
    } catch (err) {
      console.error("Failed to load site content:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => {
    const siteName = content.brand.siteName;
    return {
      content,
      loaded,
      siteName,
      reload: load,
      // Fill in {siteName} / {year} in any piece of editable text.
      t: (text) => fillTokens(text, { siteName }),
    };
  }, [content, loaded, load]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
