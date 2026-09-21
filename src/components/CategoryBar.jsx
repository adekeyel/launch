import { Link, useLocation } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext";
import { useContent } from "../context/ContentContext";
import HeaderMenu, { menuItemClass } from "./HeaderMenu";
import { IconMenu } from "./icons";
import { normalizeCategory } from "../lib/categories";

const linkClass = (active) =>
  `inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition ${
    active ? "bg-ink text-paper" : "text-ink/75 hover:bg-paper hover:text-ink"
  }`;

// The white strip under the header: "All Categories" plus a sideways-scrolling
// row of category links, built from the kitchens' own categories.
export default function CategoryBar() {
  const { categories, loading } = useCatalog();
  const { content, t } = useContent();
  const { showOpenNowLink, openNowLabel } = content.header;
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const onVendors = location.pathname === "/vendors";
  const activeCategory = onVendors ? normalizeCategory(params.get("category")) : "";
  const openNowActive = onVendors && params.get("open") === "1";

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6">
        <HeaderMenu
          label="All Categories"
          icon={<IconMenu className="h-4 w-4" />}
          align="left"
          panelClassName="w-[min(92vw,42rem)]"
          buttonClassName="shrink-0 bg-paper text-ink hover:bg-ink/10"
        >
          {({ close }) => (
            <div>
              <Link to="/vendors" onClick={close} className={`${menuItemClass} font-semibold`}>
                All kitchens
              </Link>
              {categories.length > 0 ? (
                <ul className="mt-1 grid grid-cols-2 gap-x-2 border-t border-line pt-1 sm:grid-cols-3">
                  {categories.map(({ label, count }) => (
                    <li key={label}>
                      <Link
                        to={`/vendors?category=${encodeURIComponent(label)}`}
                        onClick={close}
                        className={`${menuItemClass} justify-between`}
                      >
                        <span className="truncate">{label}</span>
                        <span className="ml-2 text-xs text-ink/40">{count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2 text-sm text-ink/50">
                  {loading ? "Loading categories…" : "Categories appear as kitchens join."}
                </p>
              )}
            </div>
          )}
        </HeaderMenu>

        <nav aria-label="Categories" className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2">
          {showOpenNowLink && (
            <Link to="/vendors?open=1" className={linkClass(openNowActive)}>
              {t(openNowLabel)}
            </Link>
          )}
          {loading && categories.length === 0
            ? [0, 1, 2, 3].map((i) => (
                <span key={i} aria-hidden="true" className="mx-1 h-4 w-20 shrink-0 animate-pulse rounded bg-ink/10" />
              ))
            : categories.map(({ label }) => (
                <Link
                  key={label}
                  to={`/vendors?category=${encodeURIComponent(label)}`}
                  className={linkClass(activeCategory === normalizeCategory(label))}
                >
                  {label}
                </Link>
              ))}
        </nav>
      </div>
    </div>
  );
}
