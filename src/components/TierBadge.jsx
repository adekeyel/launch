// Customer-facing trust badges, derived only from data the backend actually
// returns (vendor.tier). The ranking algorithm does compute a "sponsored"
// flag server-side, but strips it before returning vendor rows — so there's
// no honest way to show a Sponsored badge on listings without fabricating
// it. Same for "Popular"/"Fast Delivery": no such signal is exposed for
// vendors, so those aren't shown here rather than making them up.

const TIER_BADGE = {
  1: { label: "Verified", className: "bg-basil-soft text-basil" },
  2: { label: "Pro", className: "bg-marigold-soft text-marigold-dark" },
  3: { label: "Enterprise", className: "bg-ink text-paper" },
};

export default function TierBadge({ tier, className = "" }) {
  const badge = TIER_BADGE[tier];
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className} ${className}`}>
      {badge.label}
    </span>
  );
}
