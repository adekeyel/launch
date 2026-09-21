import { useEffect } from "react";
import { applyPageMeta } from "../lib/pageMeta";
import { useContent } from "../context/ContentContext";

// For pages whose title depends on loaded data (a vendor's name, a dish).
// Layout sets a sensible default per route; this refines it once data arrives.
export function usePageTitle(title, description) {
  const { siteName } = useContent();
  useEffect(() => {
    if (!title) return;
    applyPageMeta({ title: `${title} | ${siteName}`, description });
  }, [title, description, siteName]);
}
