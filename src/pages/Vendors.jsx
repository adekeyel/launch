import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listVendors } from "../services/vendors";
import { listFoods } from "../services/foods";
import VendorCard from "../components/VendorCard";
import FoodCard from "../components/FoodCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import CategoryChips from "../components/CategoryChips";
import AdvertiseBanner from "../components/AdvertiseBanner";
import { CardGridSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useAddToCart } from "../hooks/useAddToCart";
import { useContent } from "../context/ContentContext";
import { errorMessage } from "../lib/errors";
import { etaMinutes, topCategories, vendorHasCategory } from "../lib/categories";
import { IconSearch } from "../components/icons";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "fastest", label: "Fastest delivery" },
  { value: "name", label: "Name (A–Z)" },
];

export default function Vendors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { content, t } = useContent();
  const copy = content.vendors_page;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const openOnly = searchParams.get("open") === "1";
  const sort = SORT_OPTIONS.some((o) => o.value === searchParams.get("sort")) ? searchParams.get("sort") : "recommended";

  const [input, setInput] = useState(search);
  const [vendors, setVendors] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { addToCart, addingId } = useAddToCart();

  useEffect(() => {
    setInput(search);
  }, [search]);

  // Merge changes into the URL so filters survive refresh and can be shared.
  const setParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    // When someone searches, also look for matching dishes — the search box
    // says "meals, vendors, cuisines", so it should find meals.
    const [v, f] = await Promise.allSettled([
      listVendors({ search, limit: 60 }),
      search ? listFoods({ search, limit: 8 }) : Promise.resolve({ foods: [] }),
    ]);
    if (v.status === "fulfilled") {
      setVendors(v.value.vendors);
    } else {
      console.error("Failed to load vendors:", v.reason);
      setError(errorMessage(v.reason, "We couldn't load vendors."));
    }
    setFoods(f.status === "fulfilled" ? f.value.foods : []);
    if (f.status === "rejected") console.error("Failed to search dishes:", f.reason);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => topCategories(vendors, 12), [vendors]);

  const visibleVendors = useMemo(() => {
    // Kitchens with no opening hours set are always open (open_now is true).
    const filtered = vendors.filter((v) => vendorHasCategory(v, category) && (!openOnly || v.open_now !== false));
    if (sort === "rating") {
      const score = (v) => (v.rating_count > 0 ? Number(v.rating_avg) : -1);
      return [...filtered].sort((a, b) => score(b) - score(a) || (b.rating_count || 0) - (a.rating_count || 0));
    }
    if (sort === "fastest") return [...filtered].sort((a, b) => etaMinutes(a.eta) - etaMinutes(b.eta));
    if (sort === "name") return [...filtered].sort((a, b) => a.business_name.localeCompare(b.business_name));
    return filtered; // server order = ranking
  }, [vendors, category, sort, openOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    // A new search starts fresh: the old category may not exist in the results.
    setParams({ search: input.trim(), category: "" });
  };

  const clearFilters = () => setSearchParams({});
  const canAdd = !user || user.role === "customer";
  const filtersActive = Boolean(search || category || openOnly);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {copy.eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">{t(copy.eyebrow)}</p>}
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">{t(copy.title)}</h1>

      <form onSubmit={handleSearch} role="search" className="mt-6 flex max-w-md gap-2">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Search vendors and dishes"
            placeholder={t(copy.searchPlaceholder)}
            className="field-input pl-11"
          />
        </div>
        <button type="submit" className="btn-outline px-5">
          Search
        </button>
      </form>

      <AdvertiseBanner />

      {!error && (
        <div className="mt-6 space-y-4">
          <CategoryChips
            options={categories}
            value={category}
            onChange={(next) => setParams({ category: next })}
            allLabel="All kitchens"
          />
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-ink/50" aria-live="polite">
              {loading ? "Loading…" : `${visibleVendors.length} ${visibleVendors.length === 1 ? "kitchen" : "kitchens"}`}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-pressed={openOnly}
                onClick={() => setParams({ open: openOnly ? "" : "1" })}
                className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${
                  openOnly ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white text-ink/70 hover:border-ink/30 hover:text-ink"
                }`}
              >
                Open now
              </button>
              <label htmlFor="vendor-sort" className="text-sm text-ink/50">
                Sort by
              </label>
              <select
                id="vendor-sort"
                value={sort}
                onChange={(e) => setParams({ sort: e.target.value === "recommended" ? "" : e.target.value })}
                className="field-input h-10 w-auto pr-8"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {search && foods.length > 0 && (
        <section className="mt-8" aria-label={`Dishes matching ${search}`}>
          <h2 className="mb-4 font-display text-xl font-bold text-ink">Dishes matching “{search}”</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {foods.map((f) => (
              <FoodCard key={f.id} food={f} onAdd={canAdd ? addToCart : undefined} adding={addingId === f.id} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8">
        {search && foods.length > 0 && !loading && !error && visibleVendors.length > 0 && (
          <h2 className="mb-4 font-display text-xl font-bold text-ink">Kitchens</h2>
        )}
        {loading ? (
          <CardGridSkeleton count={6} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" />
        ) : error ? (
          <ErrorState title="Couldn't load vendors" message={error} onRetry={load} />
        ) : visibleVendors.length === 0 && search && !category && foods.length > 0 ? null : visibleVendors.length === 0 ? (
          <EmptyState
            title={
              filtersActive
                ? category
                  ? `No ${openOnly ? "open " : ""}${category} kitchens${search ? ` matching “${search}”` : ""}`
                  : search
                    ? `Nothing matches “${search}”`
                    : "No kitchens are open right now"
                : "No vendors yet"
            }
            hint={
              filtersActive
                ? "Try a different search or clear your filters."
                : "Verified vendors will appear here once they're approved."
            }
            action={
              filtersActive ? (
                <button type="button" onClick={clearFilters} className="btn-outline">
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
