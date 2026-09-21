import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdSlot from "./AdSlot";
import { applyPageMeta, metaForPath } from "../lib/pageMeta";
import { useContent } from "../context/ContentContext";

// Ads only belong where people are browsing. Not on the cart or checkout
// (they distract from paying), not on account pages, and not inside the vendor
// and admin dashboards.
const AD_ROUTES = [/^\/$/, /^\/vendors(\/|$)/, /^\/foods\//];

export default function Layout({ children }) {
  const location = useLocation();
  const showAds = AD_ROUTES.some((re) => re.test(location.pathname));
  const { content } = useContent();
  const { brand, seo, pages } = content;

  useEffect(() => {
    applyPageMeta(
      metaForPath(location.pathname, {
        siteName: brand.siteName,
        homeTitle: seo.homeTitle,
        description: seo.description,
        pages,
      })
    );
  }, [location.pathname, brand.siteName, seo, pages]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Skip to content
      </a>
      {/* Like a big marketplace: the thin sponsor strip sits above the header */}
      {showAds && <AdSlot placement="top" />}
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      {showAds && <AdSlot placement="middle" />}
      {showAds && <AdSlot placement="bottom" />}
      <Footer />
    </div>
  );
}
