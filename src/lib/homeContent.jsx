import HouseSlide from "../components/HouseSlide";
import { matchesAudience } from "./content";

// Hero slides: advertisers' banners first; our own slides (edited in Admin >
// Site content > Home page: banner) only fill up to `minSlides`, so paid ads
// are never diluted and the carousel is never empty.
export function buildHeroSlides(ads, user, hero, t, badgeSrc) {
  const adSlides = ads.map((ad) => ({ key: `ad-${ad.id}`, label: ad.title || "Sponsored", ad }));
  const room = Math.max(0, hero.minSlides - adSlides.length);
  if (room === 0) return adSlides;

  const own = hero.slides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => slide.enabled && matchesAudience(slide.audience, user))
    .slice(0, room)
    .map(({ slide, index }) => ({
      key: `house-${index}`,
      label: t(slide.title),
      render: ({ tabIndex }) => (
        <HouseSlide
          tone={slide.tone}
          badge={slide.showBadge}
          badgeSrc={badgeSrc}
          eyebrow={t(slide.eyebrow)}
          title={t(slide.title)}
          body={t(slide.body)}
          cta={slide.ctaLabel && slide.ctaLink ? { label: t(slide.ctaLabel), to: slide.ctaLink } : null}
          tabIndex={tabIndex}
        />
      ),
    }));

  return [...adSlides, ...own];
}

// Our own promo tiles for this visitor (advertisers' tiles take the first
// squares; these fill the rest).
export function buildHouseTiles(user, tiles, t) {
  return tiles
    .filter((tile) => tile.enabled && matchesAudience(tile.audience, user))
    .map((tile, index) => ({
      key: `tile-${index}`,
      tone: tile.tone,
      title: t(tile.title),
      body: t(tile.body),
      cta: t(tile.ctaLabel),
      link: tile.link,
    }));
}
