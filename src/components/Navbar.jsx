import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { IconCart, IconUser } from "./icons";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? "text-ink" : "text-ink/55 hover:text-ink"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardPath = user?.role === "vendor" ? "/vendor/dashboard" : user?.role === "admin" ? "/admin" : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-ink">
          LAUNCH<span className="text-marigold-dark">TIME</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/vendors" className={navLinkClass}>
            Vendors
          </NavLink>
          {user?.role === "customer" && (
            <NavLink to="/orders" className={navLinkClass}>
              My Orders
            </NavLink>
          )}
          {dashboardPath && (
            <NavLink to={dashboardPath} className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user?.role === "customer" && (
            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink/70 transition hover:bg-ink/5 hover:text-ink"
              aria-label="View cart"
            >
              <IconCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold leading-none text-white">
                  {count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-sm text-ink/70 sm:flex">
                <IconUser className="h-4 w-4" />
                {user.fullname.split(" ")[0]}
              </span>
              <button onClick={handleLogout} className="btn-outline h-9 px-4 text-xs">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-outline h-9 px-4 text-xs">
                Log in
              </Link>
              <Link to="/register" className="btn-accent h-9 px-4 text-xs">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
