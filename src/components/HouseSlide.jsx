import SmartLink from "./SmartLink";
import logoIcon from "../assets/logo-icon.png";

// LAUNCH TIME's own hero slides, shown when there aren't enough paid ads to
// fill the carousel (or none at all), so the top of the page is never empty.
const TONES = {
  forest: { bg: "bg-gradient-to-br from-ink via-ink to-basil text-paper", cta: "btn-accent", muted: "text-paper/70" },
  marigold: { bg: "bg-marigold text-ink", cta: "btn-primary", muted: "text-ink/70" },
  basil: { bg: "bg-basil text-paper", cta: "btn-accent", muted: "text-paper/75" },
};

export default function HouseSlide({ tone = "forest", eyebrow, title, body, cta, badge = false, badgeSrc, tabIndex }) {
  const t = TONES[tone] || TONES.forest;
  return (
    <div className={`relative flex h-full w-full items-center overflow-hidden ${t.bg}`}>
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-white/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-4 -top-24 h-56 w-56 rounded-full bg-white/5" aria-hidden="true" />
      {badge && (
        <div
          className="pointer-events-none absolute bottom-6 right-6 hidden h-28 w-28 items-center justify-center rounded-full bg-paper shadow-lg sm:flex lg:h-36 lg:w-36"
          aria-hidden="true"
        >
          <img src={badgeSrc || logoIcon} alt="" className="h-16 w-16 object-contain lg:h-20 lg:w-20" />
        </div>
      )}
      {/* Bottom padding leaves room for the slide dots; on phones the eyebrow and
          body are dropped so the headline and button fit a short banner. */}
      <div className="relative w-full max-w-xl px-5 pb-12 pt-5 sm:px-10 sm:pb-14 sm:pt-8">
        {eyebrow && (
          <p className={`hidden text-xs font-semibold uppercase tracking-wider sm:block ${t.muted}`}>{eyebrow}</p>
        )}
        <h2 className="font-display text-xl font-extrabold leading-tight sm:mt-2 sm:text-4xl">{title}</h2>
        {body && <p className={`mt-3 hidden max-w-md text-sm sm:block ${t.muted}`}>{body}</p>}
        {cta && (
          <SmartLink to={cta.to} tabIndex={tabIndex} className={`${t.cta} mt-3 sm:mt-5`}>
            {cta.label}
          </SmartLink>
        )}
      </div>
    </div>
  );
}
