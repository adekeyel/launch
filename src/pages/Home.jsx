import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listFoods } from "../services/foods";
import VendorCard from "../components/VendorCard";
import FoodCard from "../components/FoodCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import HeroCarousel from "../components/HeroCarousel";
import PromoTiles from "../components/PromoTiles";
import CategoryTiles from "../components/CategoryTiles";
import { CardGridSkeleton, HeroSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useCatalog } from "../context/CatalogContext";
import { useContent } from "../context/ContentContext";
import { matchesAudience } from "../lib/content";
import logoIcon from "../assets/logo-icon.png";
import { useAddToCart } from "../hooks/useAddToCart";
import { useHomeAds } from "../hooks/useHomeAds";
import { errorMessage } from "../lib/errors";
import { buildHeroSlides, buildHouseTiles } from "../lib/homeContent";
import SmartLink from "../components/SmartLink";
import { IconChevronRight } from "../components/icons";

export default function Home() {
  const { user } = useAuth();
  const catalog = useCatalog();
  const { content, loaded: contentLoaded, t } = useContent();
  const { home_hero: hero, home_tiles: tilesContent, home_sections: sections, brand } = content;
  const ads = useHomeAds();
  const { addToCart, addingId } = useAddToCart();

  const [foods, setFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [foodsError, setFoodsError] = useState("");

  const dishCount = sections.dishes.count;
  const loadFoods = useCallback(async () => {
    setFoodsLoading(true);
    setFoodsError("");
    try {
      const data = await listFoods({ limit: dishCount });
      setFoods(data.foods);
    } catch (err) {
      console.error("Failed to load dishes:", err);
      setFoodsError(errorMessage(err, "We couldn't load dishes."));
    } finally {
      setFoodsLoading(false);
    }
  }, [dishCount]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const heroSlides = useMemo(
    () => buildHeroSlides(ads.hero, user, hero, t, brand.logoIcon || logoIcon),
    [ads.hero, user, hero, t, brand.logoIcon]
  );
  const houseTiles = useMemo(() => buildHouseTiles(user, tilesContent.tiles, t), [user, tilesContent.tiles, t]);
  const showSellBanner = sections.sellBanner.show && matchesAudience(sections.sellBanner.audience, user);
  const heroReady = !ads.loading && contentLoaded;

  const canAdd = !user || user.role === "customer";
  const { vendors, categories, loading: vendorsLoading, error: vendorsError, reload } = catalog;

  return (
    <div>
      {/* Hero: rotating banner (images, GIFs, video) beside four static promo tiles */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6" aria-label="Featured">
        <div className="grid gap-3 lg:grid-cols-3 lg:items-stretch lg:gap-4">
          <div className="aspect-[16/9] sm:aspect-[2/1] lg:col-span-2 lg:aspect-auto lg:min-h-[300px]">
            {!heroReady ? (
              <HeroSkeleton />
            ) : (
              <HeroCarousel slides={heroSlides} autoplay={hero.autoplay} intervalMs={hero.intervalSeconds * 1000} />
            )}
          </div>
          {!heroReady ? (
            <div className="grid grid-cols-2 gap-3 lg:gap-4" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl2 bg-ink/10" />
              ))}
            </div>
          ) : (
            <PromoTiles ads={ads.tile} tiles={houseTiles} />
          )}
        </div>
      </section>

      {/* Shop by category */}
      {sections.categories.show && (vendorsLoading || categories.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6" aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="mb-4 font-display text-xl font-bold text-ink">
            {t(sections.categories.title)}
          </h2>
          <CategoryTiles categories={categories} loading={vendorsLoading} limit={sections.categories.count} />
        </section>
      )}

      {/* Top kitchens */}
      {sections.kitchens.show && (
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            {sections.kitchens.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">{t(sections.kitchens.eyebrow)}</p>
            )}
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">{t(sections.kitchens.title)}</h2>
          </div>
          {sections.kitchens.seeAllLabel && (
            <Link to="/vendors" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink">
              {t(sections.kitchens.seeAllLabel)} <IconChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {vendorsLoading ? (
          <CardGridSkeleton count={4} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" />
        ) : vendorsError ? (
          <ErrorState title="Couldn't load vendors" message={vendorsError} onRetry={reload} />
        ) : vendors.length === 0 ? (
          <EmptyState
            title="No vendors on the platform yet"
            hint="Once vendors register and get verified, they'll show up here."
            action={
              <Link to="/register" className="btn-accent">
                Register your kitchen
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vendors.slice(0, sections.kitchens.count).map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* Popular dishes */}
      {sections.dishes.show && (foodsLoading || foods.length > 0 || foodsError) && (
        <section id="popular" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-14 sm:px-6">
          <div className="mb-6">
            {sections.dishes.eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">{t(sections.dishes.eyebrow)}</p>
            )}
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">{t(sections.dishes.title)}</h2>
          </div>
          {foodsLoading ? (
            <CardGridSkeleton count={4} variant="food" className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4" />
          ) : foodsError ? (
            <ErrorState title="Couldn't load dishes" message={foodsError} onRetry={loadFoods} />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {foods.map((f) => (
                <FoodCard key={f.id} food={f} onAdd={canAdd ? addToCart : undefined} adding={addingId === f.id} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Vendor recruitment banner */}
      {showSellBanner && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-label={t(sections.sellBanner.title)}>
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl2 bg-ink px-6 py-8 text-paper sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-display text-2xl font-extrabold">{t(sections.sellBanner.title)}</h2>
              {sections.sellBanner.body && <p className="mt-1 max-w-lg text-sm text-paper/65">{t(sections.sellBanner.body)}</p>}
            </div>
            {sections.sellBanner.ctaLabel && (
              <SmartLink to={sections.sellBanner.ctaLink} className="btn-accent shrink-0">
                {t(sections.sellBanner.ctaLabel)}
              </SmartLink>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
