// Browser-tab titles and the meta description, per route.
// (Link previews in WhatsApp/Facebook/etc. are read from index.html BEFORE any
// JavaScript runs — see index-head-snippet.html in the project notes.)
const DEFAULT_SITE = "LAUNCH TIME";
const DEFAULT_HOME_TITLE = "Order from local kitchens";
const DEFAULT_DESCRIPTION =
  "Order food from local kitchens near you. Browse verified vendors, add dishes to your cart and track your order.";

// pageKey routes take their title from the editable "Page names" content.
const ROUTES = [
  { match: /^\/$/, home: true },
  { match: /^\/vendors$/, title: "Browse vendors", description: "Find local kitchens and see what they're cooking." },
  { match: /^\/vendors\//, title: "Menu" },
  { match: /^\/foods\//, title: "Dish" },
  { match: /^\/login$/, title: "Log in" },
  { match: /^\/register$/, title: "Create your account" },
  { match: /^\/cart$/, title: "Your cart" },
  { match: /^\/checkout/, title: "Checkout" },
  { match: /^\/orders$/, title: "My orders" },
  { match: /^\/about$/, title: "About us", pageKey: "aboutTitle" },
  { match: /^\/founder$/, title: "About the founder", pageKey: "founderTitle" },
  { match: /^\/terms$/, title: "Terms of service", pageKey: "termsTitle" },
  { match: /^\/privacy$/, title: "Privacy policy", pageKey: "privacyTitle" },
  { match: /^\/vendor\/dashboard$/, title: "Vendor dashboard" },
  { match: /^\/vendor\/profile$/, title: "Shop profile" },
  { match: /^\/vendor\/foods/, title: "Manage foods" },
  { match: /^\/vendor\/orders$/, title: "Manage orders" },
  { match: /^\/vendor\/grow$/, title: "Grow your kitchen" },
  { match: /^\/vendor\/payouts$/, title: "Payouts" },
  { match: /^\/vendor\/reviews$/, title: "Reviews" },
  { match: /^\/admin/, title: "Admin" },
];

// ctx comes from the editable site content: { siteName, homeTitle, description, pages }.
export function metaForPath(pathname, ctx = {}) {
  const siteName = ctx.siteName || DEFAULT_SITE;
  const description = ctx.description || DEFAULT_DESCRIPTION;
  const route = ROUTES.find((r) => r.match.test(pathname));
  if (!route) return { title: `Page not found | ${siteName}`, description };
  if (route.home) return { title: `${siteName} | ${ctx.homeTitle || DEFAULT_HOME_TITLE}`, description };
  const title = (route.pageKey && ctx.pages?.[route.pageKey]) || route.title;
  return { title: `${title} | ${siteName}`, description: route.description || description };
}

export function applyPageMeta({ title, description }) {
  if (typeof document === "undefined") return;
  if (title) document.title = title;
  if (description) {
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "description");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", description);
  }
}
