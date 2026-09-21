import { useEffect, useRef } from "react";
import SmartLink from "./SmartLink";
import { trackAdHit } from "../services/ads";
import { optimizedImage } from "../lib/media";
import { IconChevronRight } from "./icons";

const TONES = {
  forest: "bg-gradient-to-br from-ink to-basil text-paper",
  marigold: "bg-marigold text-ink",
  basil: "bg-basil text-paper",
  paper: "bg-white text-ink ring-1 ring-ink/10",
};

// The small square promos beside the hero. Advertisers' still pictures come
// first; our own tiles fill whatever is left, up to `max`.
//   tiles: [{ key, tone, title, body, cta, link }]   (our own)
export default function PromoTiles({ ads = [], tiles = [], max = 4 }) {
  // Tiles are stills: a video ad belongs in the hero, not here.
  const adTiles = ads.filter((ad) => ad.media_type !== "video").slice(0, max);
  const houseTiles = tiles.slice(0, Math.max(0, max - adTiles.length));

  const tracked = useRef(new Set());
  useEffect(() => {
    adTiles.forEach((ad) => {
      if (tracked.current.has(ad.id)) return;
      tracked.current.add(ad.id);
      trackAdHit(ad.id, "impression").catch((err) => console.error("Failed to record ad impression:", err));
    });
  }, [adTiles]);

  const base = "group relative block aspect-square overflow-hidden rounded-xl2 shadow-sm transition hover:shadow-ticket";

  return (
    <div className="grid grid-cols-2 gap-3 lg:gap-4" role="group" aria-label="Promotions">
      {adTiles.map((ad) => {
        const inner = (
          <>
            {/* Fitted whole (never cropped); leftover space is a soft blurred copy of the picture. */}
            <img
              src={optimizedImage(ad.media_url, 120)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-xl"
            />
            <img
              src={optimizedImage(ad.media_url, 500)}
              alt={ad.title || ""}
              loading="lazy"
              className="relative h-full w-full object-contain transition group-hover:scale-105"
            />
            <span className="pointer-events-none absolute right-2 top-2 rounded bg-ink/60 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          </>
        );
        return ad.link_url ? (
          <a
            key={ad.id}
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ad.title || "Sponsored"}
            onClick={() => trackAdHit(ad.id, "click").catch((err) => console.error("Failed to record ad click:", err))}
            className={base}
          >
            {inner}
          </a>
        ) : (
          <div key={ad.id} className={base}>
            {inner}
          </div>
        );
      })}

      {houseTiles.map((tile) => {
        const content = (
          <div className={`flex h-full w-full flex-col justify-between p-4 ${TONES[tile.tone] || TONES.paper}`}>
            <div>
              <p className="font-display text-base font-extrabold leading-tight sm:text-lg">{tile.title}</p>
              <p className="mt-1 text-xs opacity-80">{tile.body}</p>
            </div>
            {tile.cta ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                {tile.cta} <IconChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            ) : (
              <span />
            )}
          </div>
        );
        return (
          <SmartLink key={tile.key} to={tile.link} className={base}>
            {content}
          </SmartLink>
        );
      })}
    </div>
  );
}
