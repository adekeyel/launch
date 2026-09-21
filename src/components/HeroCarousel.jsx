import { useEffect, useRef, useState } from "react";
import { trackAdHit } from "../services/ads";
import { optimizedImage } from "../lib/media";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { IconChevronLeft, IconChevronRight, IconPause, IconPlay } from "./icons";

const SWIPE_PX = 40;

// The big rotating banner. Each slide is either
//   { key, label, ad }        an advertiser's image, animated GIF or video, or
//   { key, label, render }    one of our own slides: render({ tabIndex }) => node
//
// It auto-advances, but stops while the visitor hovers or focuses it, when the
// tab is hidden, when they press pause, and always if their device asks for
// reduced motion. Videos only play while their slide is showing.
export default function HeroCarousel({ slides, intervalMs = 6000, autoplay = true }) {
  const count = slides.length;
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(typeof document !== "undefined" && document.hidden);
  const videoRefs = useRef({});
  const tracked = useRef(new Set());
  const touchStartX = useRef(null);

  const playing = count > 1 && autoplay && !reduced && !userPaused && !hovering && !focused && !pageHidden;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Advance after each slide has had its full time (timer restarts on any change).
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearTimeout(timer);
  }, [playing, index, count, intervalMs]);

  // Only the visible slide's video plays.
  useEffect(() => {
    slides.forEach((slide, i) => {
      const video = videoRefs.current[slide.key];
      if (!video) return;
      if (i === index) {
        const attempt = video.play();
        if (attempt?.catch) attempt.catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [index, slides]);

  // One impression per ad per page view, when its slide first shows.
  useEffect(() => {
    const ad = slides[index]?.ad;
    if (!ad || tracked.current.has(ad.id)) return;
    tracked.current.add(ad.id);
    trackAdHit(ad.id, "impression").catch((err) => console.error("Failed to record ad impression:", err));
  }, [index, slides]);

  const go = (i) => setIndex(((i % count) + count) % count);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? index + 1 : index - 1);
  };

  if (count === 0) return null;

  const arrow =
    "absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow transition hover:bg-white sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="group relative h-full w-full overflow-hidden rounded-xl2 bg-ink/5"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={(e) => {
        // Only keyboard focus pauses it — a mouse click on a dot leaves focus
        // on that button, which must not freeze the slideshow.
        if (e.target.matches?.(":focus-visible")) setFocused(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      <div
        className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live={playing ? "off" : "polite"}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          const tabIndex = active ? 0 : -1;
          return (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className="relative h-full min-w-full shrink-0 overflow-hidden"
            >
              {slide.ad ? (
                <AdSlide ad={slide.ad} tabIndex={tabIndex} eager={i === 0} videoRefs={videoRefs} slideKey={slide.key} />
              ) : (
                slide.render({ tabIndex })
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className={`${arrow} left-3`}>
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className={`${arrow} right-3`}>
            <IconChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div className="flex items-center rounded-full bg-ink/45 px-1.5 backdrop-blur">
              {slides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={`Show slide ${i + 1}${slide.label ? `: ${slide.label}` : ""}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                  className="flex h-6 items-center px-1"
                >
                  <span className={`block h-2 rounded-full bg-white transition-all ${i === index ? "w-6" : "w-2 opacity-60"}`} />
                </button>
              ))}
              {!reduced && autoplay && (
                <button
                  type="button"
                  aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                  onClick={() => setUserPaused((p) => !p)}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-white"
                >
                  {userPaused ? <IconPlay className="h-3 w-3" /> : <IconPause className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// An advertiser's slide: a still image, an animated GIF, or a looping video.
function AdSlide({ ad, tabIndex, eager, videoRefs, slideKey }) {
  // Nothing is ever cropped: the whole picture/video is fitted inside the banner
  // (object-contain), whatever its shape or size. Any leftover space is filled with
  // a soft blurred copy of the same picture so it never looks like empty bars.
  const media =
    ad.media_type === "video" ? (
      <div className="h-full w-full bg-ink">
        <video
          ref={(el) => {
            videoRefs.current[slideKey] = el;
          }}
          src={ad.media_url}
          className="h-full w-full object-contain"
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    ) : (
      <div className="relative h-full w-full overflow-hidden bg-ink/10">
        <img
          src={optimizedImage(ad.media_url, 200)}
          alt=""
          aria-hidden="true"
          loading={eager ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
        />
        <img
          src={optimizedImage(ad.media_url, 1400)}
          alt={ad.title || ""}
          loading={eager ? "eager" : "lazy"}
          className="relative h-full w-full object-contain"
        />
      </div>
    );

  const sponsored = (
    <span className="pointer-events-none absolute right-3 top-3 rounded bg-ink/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Sponsored
    </span>
  );

  if (!ad.link_url) {
    return (
      <div className="relative h-full w-full">
        {media}
        {sponsored}
      </div>
    );
  }

  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      aria-label={ad.title || "Sponsored"}
      onClick={() => trackAdHit(ad.id, "click").catch((err) => console.error("Failed to record ad click:", err))}
      className="relative block h-full w-full"
    >
      {media}
      {sponsored}
    </a>
  );
}
