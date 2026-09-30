import { useEffect, useRef, useState } from "react";
import { getOrderRiderLocation } from "../services/orders";

const POLL_MS = 10000;

// Deliberately no mapping library (Leaflet, Google Maps, etc.) — I don't
// have package.json so I can't confirm one's installed, and adding an npm
// dependency isn't something I should do blind. OpenStreetMap's own embed
// endpoint needs nothing but an iframe: no API key, no bundle size, works
// today. If you already have Google Maps/Mapbox wired in elsewhere, tell me
// and I'll swap this for that instead — it'll look more native.
function osmEmbedUrl(lat, lng, spanDeg = 0.01) {
  const bbox = [lng - spanDeg, lat - spanDeg, lng + spanDeg, lat + spanDeg].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

function timeAgo(iso) {
  if (!iso) return "";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
}

// Shown on My Orders while an order is out with a rider. Renders nothing
// (returns null) until a location actually comes back — no placeholder
// map, no error banner for the very normal case of a rider who hasn't
// sent a location ping yet.
export default function RiderLocationMap({ orderId }) {
  const [location, setLocation] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const poll = async () => {
      try {
        const data = await getOrderRiderLocation(orderId);
        if (!cancelledRef.current) setLocation(data);
      } catch {
        // Most likely just "no location yet" — quietly keep whatever we
        // last had (or nothing) rather than showing an error for this.
      }
    };
    poll();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [orderId]);

  if (!location) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line">
      <iframe
        title="Your rider's location"
        src={osmEmbedUrl(location.lat, location.lng)}
        className="h-48 w-full border-0"
        loading="lazy"
      />
      <div className="flex items-center justify-between bg-white px-3 py-2 text-xs text-ink/50">
        <span>Rider location · updated {timeAgo(location.updatedAt)}</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=15/${location.lat}/${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-marigold-dark hover:underline"
        >
          Open full map →
        </a>
      </div>
    </div>
  );
}
