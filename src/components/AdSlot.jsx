import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getActiveAds, trackAdHit } from "../services/ads";

const SIZE = {
  top: "h-[50px]",
  middle: "h-[100px]",
  bottom: "h-[50px]",
};

const ROTATE_MS = 10_000;

export default function AdSlot({ placement }) {
  const location = useLocation();
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const trackedRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    setIndex(0);
    trackedRef.current = new Set();
    (async () => {
      try {
        const data = await getActiveAds(placement, location.pathname);
        if (!cancelled) setAds(data || []);
      } catch (err) {
        console.error(`Failed to load ${placement} ad:`, err);
        if (!cancelled) setAds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placement, location.pathname]);

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  // One impression per ad per time it's shown in this slot (not re-fired on
  // every rotation loop back to an ad already counted this page view).
  useEffect(() => {
    const ad = ads[index];
    if (!ad || trackedRef.current.has(ad.id)) return;
    trackedRef.current.add(ad.id);
    trackAdHit(ad.id, "impression").catch((err) => console.error("Failed to record ad impression:", err));
  }, [ads, index]);

  if (ads.length === 0) return null;

  const ad = ads[index];

  const handleClick = () => {
    trackAdHit(ad.id, "click").catch((err) => console.error("Failed to record ad click:", err));
  };

  return (
    <div className={`relative w-full ${SIZE[placement]} overflow-hidden bg-ink/5`}>
      <a
        href={ad.link_url || undefined}
        target={ad.link_url ? "_blank" : undefined}
        rel={ad.link_url ? "noopener noreferrer" : undefined}
        onClick={handleClick}
        className="block h-full w-full"
        aria-label={ad.title || "Sponsored"}
      >
        {ad.media_type === "video" ? (
          <video src={ad.media_url} className="h-full w-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <img src={ad.media_url} alt={ad.title || ""} className="h-full w-full object-cover" />
        )}
      </a>
      <span className="pointer-events-none absolute bottom-0.5 right-1.5 rounded bg-ink/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
        Sponsored
      </span>
    </div>
  );
}
