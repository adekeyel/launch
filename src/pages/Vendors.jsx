import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listVendors } from "../services/vendors";
import VendorCard from "../components/VendorCard";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import AdvertiseBanner from "../components/AdvertiseBanner";
import { IconSearch } from "../components/icons";

export default function Vendors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [input, setInput] = useState(search);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInput(search);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listVendors({ search, limit: 60 });
        if (!cancelled) setVendors(data.vendors);
      } catch (err) {
        console.error("Failed to load vendors:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(input ? { search: input } : {});
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Full menu board</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Vendors</h1>

      <form onSubmit={handleSearch} className="mt-6 flex max-w-md gap-2">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search vendors or cuisines…"
            className="field-input pl-11"
          />
        </div>
        <button type="submit" className="btn-outline px-5">
          Search
        </button>
      </form>

      <AdvertiseBanner />

      <div className="mt-8">
        {loading ? (
          <Loader label="Loading vendors…" />
        ) : vendors.length === 0 ? (
          <EmptyState
            title={search ? `Nothing matches "${search}"` : "No vendors yet"}
            hint={search ? "Try a different search term." : "Verified vendors will appear here once they're approved."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
