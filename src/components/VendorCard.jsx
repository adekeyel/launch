import { Link } from "react-router-dom";
import { IconClock, IconPin } from "./icons";
import TierBadge from "./TierBadge";

export default function VendorCard({ vendor }) {
  return (
    <Link
      to={`/vendors/${vendor.id}`}
      className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-ticket"
    >
      <div className="relative h-36 w-full overflow-hidden bg-ink/5">
        {vendor.banner_url ? (
          <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-marigold-soft to-basil-soft font-display text-3xl font-extrabold text-ink/20">
            {vendor.business_name?.[0] ?? "?"}
          </div>
        )}
        {vendor.logo_url && (
          <img
            src={vendor.logo_url}
            alt=""
            className="absolute -bottom-4 left-4 h-12 w-12 rounded-full border-2 border-white object-cover shadow"
          />
        )}
        <TierBadge tier={vendor.tier} className="absolute right-3 top-3" />
      </div>
      <div className="px-4 pb-4 pt-6">
        <h3 className="font-display text-base font-bold text-ink group-hover:text-marigold-dark">
          {vendor.business_name}
        </h3>
        {vendor.tagline && <p className="mt-0.5 line-clamp-1 text-sm text-ink/55">{vendor.tagline}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink/50">
          {vendor.eta && (
            <span className="inline-flex items-center gap-1">
              <IconClock className="h-3.5 w-3.5" /> {vendor.eta}
            </span>
          )}
          {vendor.address && (
            <span className="inline-flex items-center gap-1 truncate">
              <IconPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{vendor.address}</span>
            </span>
          )}
        </div>
        {vendor.categories?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vendor.categories.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full bg-basil-soft px-2 py-0.5 text-[11px] font-medium text-basil">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
