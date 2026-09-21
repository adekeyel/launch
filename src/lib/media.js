// Cloudinary serves the original upload unless you ask otherwise, so a phone
// on mobile data was downloading multi-megabyte photos for a 300px card.
// This inserts an on-the-fly transformation: automatic format (WebP/AVIF),
// automatic quality, and a max width. URLs that aren't Cloudinary images
// (videos, other hosts, already-transformed URLs) are returned untouched.
const CLOUDINARY_IMAGE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

export function optimizedImage(url, width = 800) {
  if (!url || typeof url !== "string") return url;
  const match = url.match(CLOUDINARY_IMAGE);
  if (!match) return url;

  const [, base, rest] = match;

  // Animated GIFs stay untouched: asking Cloudinary for a "smaller" version
  // can flatten them to a single still frame.
  if (/\.gif(\?|$)/i.test(rest)) return url;

  const firstSegment = rest.split("/")[0];
  // e.g. "w_300", "f_auto,q_auto" — already transformed, leave it alone.
  if (/^[a-z]{1,3}_/i.test(firstSegment)) return url;

  return `${base}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}
