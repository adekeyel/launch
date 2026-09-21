import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getVendor } from "../services/vendors";
import { listFoods } from "../services/foods";
import FoodCard from "../components/FoodCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { VendorMenuSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useAddToCart } from "../hooks/useAddToCart";
import { usePageTitle } from "../hooks/usePageTitle";
import { errorMessage, isNotFound } from "../lib/errors";
import { groupFoodsByCategory } from "../lib/categories";
import { optimizedImage } from "../lib/media";
import { IconClock, IconPin } from "../components/icons";
import TierBadge from "../components/TierBadge";
import OpenBadge from "../components/OpenBadge";
import ReviewList from "../components/ReviewList";
import { RatingSummary } from "../components/StarRating";
import { deliveryLabel } from "../lib/delivery";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function VendorMenu() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, addingId } = useAddToCart();
  const [vendor, setVendor] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState(null);
  const tabRefs = useRef({});
  // While a tab-click scroll is in flight (or when the last sections are too
  // short to reach the top of the screen) the observer must not steal the
  // highlight back from the tab the customer just chose.
  const lockUntil = useRef(0);

  usePageTitle(vendor?.business_name, vendor?.tagline || undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setError("");
    try {
      const [v, f] = await Promise.all([getVendor(id), listFoods({ vendorId: id, limit: 60 })]);
      setVendor(v);
      setFoods(f.foods);
    } catch (err) {
      console.error("Failed to load vendor menu:", err);
      if (isNotFound(err)) setNotFound(true);
      else setError(errorMessage(err, "We couldn't load this menu."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => groupFoodsByCategory(foods), [foods]);
  const showTabs = sections.length > 1;

  // Highlight the tab for whichever category is under the sticky bar.
  useEffect(() => {
    if (!showTabs) return;
    setActiveId(sections[0].id);
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" }
    );
    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, showTabs]);

  // Keep the active tab in view inside the horizontally scrolling bar.
  useEffect(() => {
    const tab = tabRefs.current[activeId];
    if (tab) {
      tab.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }
  }, [activeId]);

  const jumpTo = (sectionId) => {
    lockUntil.current = Date.now() + 900;
    setActiveId(sectionId);
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  if (loading) return <VendorMenuSkeleton />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <EmptyState title="Vendor not found" hint="This kitchen may not be verified yet, or the link is wrong." />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <ErrorState title="Couldn't load this menu" message={error} onRetry={load} />
      </div>
    );
  }

  // A closed (or paused) kitchen can be browsed but not ordered from.
  const canAdd = (!user || user.role === "customer") && vendor.open_now !== false;
  const paused = vendor.open_status === "paused";

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden bg-ink sm:h-64">
        {vendor.banner_url ? (
          <img
            src={optimizedImage(vendor.banner_url, 1600)}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink to-basil" />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-10 flex items-end gap-4">
          {vendor.logo_url ? (
            <img
              src={optimizedImage(vendor.logo_url, 200)}
              alt=""
              className="h-20 w-20 rounded-2xl border-4 border-paper object-cover shadow"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-paper bg-marigold-soft font-display text-2xl font-bold text-marigold-dark shadow">
              {vendor.business_name?.[0]}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold text-ink">{vendor.business_name}</h1>
            <TierBadge tier={vendor.tier} />
            <OpenBadge status={vendor.open_status} label={vendor.open_label} />
          </div>
          {vendor.tagline && <p className="mt-1 text-ink/60">{vendor.tagline}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink/50">
            {vendor.eta && (
              <span className="inline-flex items-center gap-1.5">
                <IconClock className="h-4 w-4" /> {vendor.eta}
              </span>
            )}
            {vendor.address && (
              <span className="inline-flex items-center gap-1.5">
                <IconPin className="h-4 w-4" /> {vendor.address}
              </span>
            )}
            <span>{deliveryLabel(vendor)}</span>
            {vendor.rating_count > 0 ? (
              <a href="#reviews" className="hover:text-ink">
                <RatingSummary avg={vendor.rating_avg} count={vendor.rating_count} />
              </a>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
          {vendor.categories?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {vendor.categories.map((c) => (
                <span key={c} className="rounded-full bg-basil-soft px-2.5 py-1 text-xs font-medium text-basil">
                  {c}
                </span>
              ))}
            </div>
          )}
          {vendor.description && <p className="mt-4 max-w-2xl text-sm text-ink/60">{vendor.description}</p>}

          {vendor.open_now === false && (
            <div role="status" className="mt-5 max-w-2xl rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink/70">
              <p className="font-semibold text-ink">{paused ? "Not taking orders right now" : "Closed right now"}</p>
              <p className="mt-0.5">
                {paused
                  ? "You can browse the menu. Check back soon."
                  : `${vendor.open_label ? `${vendor.open_label}. ` : ""}You can browse the menu; ordering opens when they do.`}
              </p>
            </div>
          )}
        </div>

        {foods.length === 0 ? (
          <div className="mt-10 pb-12">
            <h2 className="mb-5 font-display text-xl font-bold text-ink">Menu</h2>
            <EmptyState title="No items on the menu yet" hint="This vendor hasn't published any dishes." />
          </div>
        ) : (
          <>
            {showTabs && (
              <nav
                aria-label="Menu categories"
                className="sticky top-16 z-30 mt-8 flex gap-2 overflow-x-auto border-b border-line bg-paper/95 py-3 backdrop-blur"
              >
                {sections.map((section) => {
                  const active = activeId === section.id;
                  return (
                    <button
                      key={section.id}
                      ref={(el) => {
                        tabRefs.current[section.id] = el;
                      }}
                      type="button"
                      onClick={() => jumpTo(section.id)}
                      aria-current={active ? "true" : undefined}
                      className={`h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : "border-ink/15 bg-white text-ink/70 hover:border-ink/30 hover:text-ink"
                      }`}
                    >
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className={`space-y-10 pb-12 ${showTabs ? "mt-6" : "mt-10"}`}>
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-36">
                  <h2 className="mb-5 font-display text-xl font-bold text-ink">{section.label}</h2>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                    {section.foods.map((f) => (
                      <FoodCard
                        key={f.id}
                        food={f}
                        onAdd={canAdd ? addToCart : undefined}
                        adding={addingId === f.id}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        <section id="reviews" className="scroll-mt-24 border-t border-line pb-20 pt-10" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="mb-5 font-display text-xl font-bold text-ink">
            Reviews
          </h2>
          <ReviewList vendorId={vendor.id} />
        </section>
      </div>
    </div>
  );
}
