import { useEffect, useState } from "react";
import { getActiveAds } from "../services/ads";

// The home page's two ad slots: `hero` (rotating banners: images, animated
// GIFs, videos) and `tile` (small static squares). If either request fails
// the page simply falls back to its built-in content.
export function useHomeAds() {
  const [state, setState] = useState({ hero: [], tile: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [hero, tile] = await Promise.allSettled([getActiveAds("hero", "/"), getActiveAds("tile", "/")]);
      if (cancelled) return;
      if (hero.status === "rejected") console.error("Failed to load hero ads:", hero.reason);
      if (tile.status === "rejected") console.error("Failed to load tile ads:", tile.reason);
      setState({
        hero: hero.status === "fulfilled" ? hero.value || [] : [],
        tile: tile.status === "fulfilled" ? tile.value || [] : [],
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
