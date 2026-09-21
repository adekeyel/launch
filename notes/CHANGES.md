# LAUNCH TIME frontend update (cumulative)

Contains EVERY frontend file changed so far, so it applies over your original src/
or over any earlier zip. Extract at the project root (the folder containing src/)
and overwrite when asked. No new npm packages. Deploy the backend update first.

## NEW: edit the whole website from the admin dashboard
Admin > Site content (new tab). Pick a part of the site, change it, Save: it goes live
immediately. Each part has "Discard changes" and "Reset to original".
- Brand and logo: site name, tagline, header logo, footer logo, top-bar colour.
- Header and menus: search hint, "Sell" link, Help menu and its links, "Open now" link.
- Home page: banner: our own slides (text, colour, button, who sees it), how many show,
  autoplay on/off, seconds per slide. Add, remove, re-order.
- Home page: promo tiles: our own tiles (text, colour, link, who sees it).
- Home page: sections: headings, how many items, and show/hide for Shop by category,
  Kitchens, Popular dishes and the "sell" banner.
- Footer: blurb, link columns and links, contact email/phone/address, social links.
- Login and sign-up pages, Vendors page, page names (About/Founder/Terms/Privacy),
  and the browser-tab title / search description.
The hub also links to the parts with their own screens: Ads and banners, Page text,
Payments and prices.
- "Show to" lets a slide, tile or banner appear only for visitors, customers, vendors
  or admins.
- In any text, {siteName} and {year} are filled in automatically.
- Links may be a page on the site (/vendors), a #section, an https:// address, mailto:
  or tel:. Web addresses open in a new tab.
- Safe by design: text is always shown as text (never as HTML), and even if a bad link
  ever got into the data it would render as plain text, not a clickable link.
- If the server can't be reached, the site shows its built-in content; returning
  visitors see the last content their browser saw, with no flash of old text.

## Earlier in this zip
Marketplace-style home page (sponsor strip, header with search, category bar, rotating
banner + promo tiles), opening hours, delivery fees, reviews, mobile menu, toasts and
error states, skeletons, category tabs and filters.

## Still to do by you
- Paste notes/index-head-snippet.html into your index.html <head> (link previews).
