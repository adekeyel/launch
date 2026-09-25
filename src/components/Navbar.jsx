import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import HeaderMenu, { menuItemClass } from "./HeaderMenu";
import HeaderSearch from "./HeaderSearch";
import CategoryBar from "./CategoryBar";
import SmartLink from "./SmartLink";
import { useContent } from "../context/ContentContext";
import { IconCart, IconHelp, IconMenu, IconUser, IconX } from "./icons";
import NotificationBell from "./NotificationBell";
import logoIcon from "../assets/logo-icon.png";

// The top bar's look for each colour an admin can choose (Admin > Site content >
// Brand and logo). Whole class names are listed so Tailwind keeps them.
const TONES = {
  marigold: {
    bar: "bg-marigold text-ink shadow-sm",
    row: "bg-marigold",
    text: "text-ink",
    hover: "hover:bg-ink/10",
    ring: "focus-visible:outline-ink",
    search: "bg-ink text-paper hover:bg-charcoal focus-visible:outline-ink",
  },
  white: {
    bar: "bg-white text-ink border-b border-line",
    row: "bg-white",
    text: "text-ink",
    hover: "hover:bg-ink/5",
    ring: "focus-visible:outline-ink",
    search: "bg-marigold text-ink hover:bg-marigold-dark hover:text-paper focus-visible:outline-ink",
  },
  ink: {
    bar: "bg-ink text-paper shadow-sm",
    row: "bg-ink",
    text: "text-paper",
    hover: "hover:bg-white/10",
    ring: "focus-visible:outline-marigold",
    search: "bg-marigold text-ink hover:bg-marigold-dark hover:text-paper focus-visible:outline-paper",
  },
  basil: {
    bar: "bg-basil text-paper shadow-sm",
    row: "bg-basil",
    text: "text-paper",
    hover: "hover:bg-white/10",
    ring: "focus-visible:outline-paper",
    search: "bg-ink text-paper hover:bg-charcoal focus-visible:outline-paper",
  },
};

const mobileLinkClass = ({ isActive }) =>
  `flex h-12 items-center rounded-xl px-3 text-base font-medium transition ${
    isActive ? "bg-ink/5 text-ink" : "text-ink/70 hover:bg-ink/5 hover:text-ink"
  }`;

// The links a signed-in (or signed-out) visitor gets, in one place so the
// account menu and the phone menu can't drift apart.
function navItemsFor(user) {
  const items = [
    { to: "/", label: "Home", end: true },
    { to: "/vendors", label: "Vendors" },
  ];
  if (user?.role === "customer") items.push({ to: "/orders", label: "My orders" });
  if (user?.role === "vendor") {
    items.push(
      { to: "/vendor/dashboard", label: "Dashboard" },
      { to: "/vendor/foods", label: "Manage foods" },
      { to: "/vendor/orders", label: "Manage orders" },
      { to: "/vendor/reviews", label: "Reviews" }
    );
  }
  if (user?.role === "admin") items.push({ to: "/admin", label: "Dashboard" });
  return items;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { content, t } = useContent();
  const { brand, header } = content;
  const tone = TONES[brand.headerTone] || TONES.marigold;
  const nameWords = brand.siteName.split(" ");
  const nameLast = nameWords.pop();
  const nameFirst = nameWords.join(" ");
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = navItemsFor(user);
  const accountItems = items.slice(2); // everything after Home / Vendors
  const showCart = !user || user.role === "customer";

  // Close the phone menu whenever the route changes, and on Escape.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  const iconButton = `relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition ${tone.text} ${tone.hover} ${tone.ring}`;
  const menuButton = `${tone.text} ${tone.hover}`;

  return (
    <>
      <header className={`sticky top-0 z-40 ${tone.bar}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className={`flex shrink-0 items-center gap-2 ${tone.ring}`} aria-label={`${brand.siteName} home`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <img src={brand.logoIcon || logoIcon} alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className={`font-display text-lg font-extrabold tracking-tight ${tone.text}`}>
              {nameFirst && `${nameFirst} `}
              <span className={nameFirst ? "font-semibold" : ""}>{nameLast}</span>
            </span>
          </Link>

          {!user && header.showSellLink && (
            <SmartLink
              to={header.sellLinkTarget}
              className={`hidden h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold transition lg:inline-flex ${tone.text} ${tone.hover} ${tone.ring}`}
            >
              {t(header.sellLinkLabel)}
            </SmartLink>
          )}

          {/* Search: inside the bar from tablet up; on phones it gets its own row below */}
          <div className="hidden min-w-0 flex-1 md:block">
            <HeaderSearch placeholder={t(header.searchPlaceholder)} buttonClassName={tone.search} />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {header.showHelpMenu && header.helpLinks.length > 0 && (
              <div className="hidden lg:block">
                <HeaderMenu
                  label={t(header.helpLabel)}
                  icon={<IconHelp className="h-4 w-4" />}
                  panelClassName="w-56"
                  buttonClassName={menuButton}
                >
                  {({ close }) =>
                    header.helpLinks.map((link, i) => (
                      <SmartLink key={`${link.link}-${i}`} to={link.link} onClick={close} className={menuItemClass}>
                        {t(link.label)}
                      </SmartLink>
                    ))
                  }
                </HeaderMenu>
              </div>
            )}

            <div className="hidden md:block">
              <HeaderMenu
                label={user ? `Hi, ${user.fullname.split(" ")[0]}` : "Login / Sign Up"}
                icon={<IconUser className="h-4 w-4" />}
                panelClassName="w-64"
                buttonClassName={menuButton}
              >
                {({ close }) =>
                  user ? (
                    <div>
                      {accountItems.map((item) => (
                        <Link key={item.to} to={item.to} onClick={close} className={menuItemClass}>
                          {item.label}
                        </Link>
                      ))}
                      <button type="button" onClick={handleLogout} className={`${menuItemClass} border-t border-line`}>
                        Log out
                      </button>
                    </div>
                  ) : (
                    <div className="p-2">
                      <p className="mb-3 text-sm text-ink/60">Log in to order, track your orders and rate kitchens.</p>
                      <Link to="/login" onClick={close} className="btn-primary w-full">
                        Log in
                      </Link>
                      <Link to="/register" onClick={close} className="btn-outline mt-2 w-full">
                        Create an account
                      </Link>
                    </div>
                  )
                }
              </HeaderMenu>
            </div>

            {(user?.role === "customer" || user?.role === "vendor") && (
              <NotificationBell buttonClassName={iconButton} />
            )}

            {showCart && (
              <Link
                to="/cart"
                className={iconButton}
                aria-label={count > 0 ? `View cart, ${count} item${count === 1 ? "" : "s"}` : "View cart"}
              >
                <IconCart className="h-6 w-6" />
                {count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold leading-none text-white"
                  >
                    {count}
                  </span>
                )}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`${iconButton} md:hidden`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-white shadow-ticket md:hidden">
            <nav className="mx-auto max-w-6xl space-y-1 px-4 py-3 sm:px-6" aria-label="Menu">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={mobileLinkClass}>
                  {item.label}
                </NavLink>
              ))}
              {!user && header.showSellLink && (
                <SmartLink to={header.sellLinkTarget} className={mobileLinkClass({ isActive: false })}>
                  {t(header.sellLinkLabel)}
                </SmartLink>
              )}
            </nav>
            <div className="mx-auto max-w-6xl border-t border-line px-4 py-4 sm:px-6">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-ink/70">
                    <IconUser className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.fullname}</span>
                  </span>
                  <button onClick={handleLogout} className="btn-outline h-10 px-5 text-sm">
                    Log out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="btn-outline">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-accent">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Phones: search on its own row under the bar (scrolls away; the bar above stays) */}
      <div className={`${tone.row} px-4 pb-3 md:hidden`}>
        <HeaderSearch placeholder={t(header.searchPlaceholder)} buttonClassName={tone.search} />
      </div>

      <CategoryBar />
    </>
  );
}
