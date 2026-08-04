import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdvertiseBanner() {
  const { user } = useAuth();

  let to = "/register";
  let cta = "Register your kitchen";
  if (user?.role === "vendor") {
    to = "/vendor/grow";
    cta = "Start a campaign";
  } else if (user?.role === "customer" || user?.role === "admin") {
    return null; // not a relevant pitch for these accounts
  }

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl2 border border-marigold/25 bg-marigold-soft/50 px-5 py-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-display text-sm font-bold text-ink">Own a kitchen on this list?</p>
        <p className="mt-0.5 text-xs text-ink/60">
          Get a homepage banner, sponsored search placement, or category promotion — advertising is open to any
          Verified vendor.
        </p>
      </div>
      <Link to={to} className="btn-accent h-9 shrink-0 px-4 text-xs">
        {cta}
      </Link>
    </div>
  );
}
