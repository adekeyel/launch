import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { listVendors } from "../services/vendors";
import { categoryCounts } from "../lib/categories";
import { errorMessage } from "../lib/errors";

const CatalogContext = createContext(null);

// The vendor list, loaded once and shared by the header's category bar and the
// home page (so they don't each fetch it).
export function CatalogProvider({ children }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listVendors({ limit: 60 });
      setVendors(data.vendors);
    } catch (err) {
      console.error("Failed to load vendors:", err);
      setError(errorMessage(err, "We couldn't load vendors."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => categoryCounts(vendors, 30), [vendors]);

  const value = useMemo(
    () => ({ vendors, categories, loading, error, reload: load }),
    [vendors, categories, loading, error, load]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
