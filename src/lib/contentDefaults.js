// GENERATED from the backend content schema (utils/contentSchema.js).
// This is only the fallback the site shows if the content service can't be
// reached; the live content always comes from the server (Admin > Site content).
export const DEFAULT_CONTENT = {
  "brand": {
    "siteName": "LAUNCH TIME",
    "tagline": "Good food. Right time.",
    "logoIcon": null,
    "logoFull": null,
    "headerTone": "marigold"
  },
  "header": {
    "searchPlaceholder": "Search for meals, kitchens, cuisines",
    "showSellLink": true,
    "sellLinkLabel": "Sell on {siteName}",
    "sellLinkTarget": "/register",
    "showOpenNowLink": true,
    "openNowLabel": "Open now",
    "showHelpMenu": true,
    "helpLabel": "Help",
    "helpLinks": [
      {
        "label": "About {siteName}",
        "link": "/about"
      },
      {
        "label": "Meet the founder",
        "link": "/founder"
      },
      {
        "label": "Terms of service",
        "link": "/terms"
      },
      {
        "label": "Privacy policy",
        "link": "/privacy"
      }
    ]
  },
  "home_hero": {
    "minSlides": 3,
    "autoplay": true,
    "intervalSeconds": 6,
    "slides": [
      {
        "enabled": true,
        "audience": "everyone",
        "tone": "forest",
        "eyebrow": "Local kitchens, delivered",
        "title": "Your local kitchens, plated and delivered.",
        "body": "Browse verified vendors, see the delivery fee before you order, and follow your order to your door.",
        "ctaLabel": "Browse kitchens",
        "ctaLink": "/vendors",
        "showBadge": true
      },
      {
        "enabled": true,
        "audience": "everyone",
        "tone": "marigold",
        "eyebrow": "Open right now",
        "title": "See who's cooking tonight.",
        "body": "Kitchens show when they're open, so you never order from a kitchen that has closed for the day.",
        "ctaLabel": "See open kitchens",
        "ctaLink": "/vendors?open=1",
        "showBadge": false
      },
      {
        "enabled": true,
        "audience": "guests_customers",
        "tone": "basil",
        "eyebrow": "For vendors",
        "title": "Own a kitchen? Sell on {siteName}.",
        "body": "Set your menu, opening hours and delivery fee, and start taking orders from customers around you.",
        "ctaLabel": "Open your kitchen",
        "ctaLink": "/register",
        "showBadge": false
      },
      {
        "enabled": true,
        "audience": "vendors",
        "tone": "basil",
        "eyebrow": "For vendors",
        "title": "Your kitchen, your rules.",
        "body": "Manage your menu, opening hours, delivery fee and orders from your dashboard.",
        "ctaLabel": "Go to your dashboard",
        "ctaLink": "/vendor/dashboard",
        "showBadge": false
      }
    ]
  },
  "home_tiles": {
    "tiles": [
      {
        "enabled": true,
        "audience": "everyone",
        "tone": "basil",
        "title": "Open now",
        "body": "Kitchens taking orders right now.",
        "ctaLabel": "See who's open",
        "link": "/vendors?open=1"
      },
      {
        "enabled": true,
        "audience": "everyone",
        "tone": "marigold",
        "title": "Top rated",
        "body": "Loved by customers.",
        "ctaLabel": "Browse",
        "link": "/vendors?sort=rating"
      },
      {
        "enabled": true,
        "audience": "everyone",
        "tone": "forest",
        "title": "Popular dishes",
        "body": "What everyone's ordering.",
        "ctaLabel": "Jump to dishes",
        "link": "#popular"
      },
      {
        "enabled": true,
        "audience": "guests",
        "tone": "paper",
        "title": "New here?",
        "body": "Create a free account to order and track.",
        "ctaLabel": "Sign up",
        "link": "/register"
      },
      {
        "enabled": true,
        "audience": "customers",
        "tone": "paper",
        "title": "Your orders",
        "body": "Track what's on its way.",
        "ctaLabel": "View orders",
        "link": "/orders"
      },
      {
        "enabled": true,
        "audience": "vendors",
        "tone": "paper",
        "title": "Your kitchen",
        "body": "Menu, orders and reviews.",
        "ctaLabel": "Dashboard",
        "link": "/vendor/dashboard"
      },
      {
        "enabled": true,
        "audience": "admins",
        "tone": "paper",
        "title": "Admin",
        "body": "Manage the marketplace.",
        "ctaLabel": "Open",
        "link": "/admin"
      }
    ]
  },
  "home_sections": {
    "categories": {
      "show": true,
      "title": "Shop by category",
      "count": 12
    },
    "kitchens": {
      "show": true,
      "eyebrow": "On the menu today",
      "title": "Top kitchens right now",
      "seeAllLabel": "See all",
      "count": 8
    },
    "dishes": {
      "show": true,
      "eyebrow": "Fresh off the pass",
      "title": "Popular right now",
      "count": 8
    },
    "sellBanner": {
      "show": true,
      "audience": "guests_customers",
      "title": "Own a kitchen? Sell on {siteName}.",
      "body": "Put your menu online, set your own opening hours and delivery fee, and get paid for every order.",
      "ctaLabel": "Register your kitchen",
      "ctaLink": "/register"
    }
  },
  "footer": {
    "about": "Local kitchens, cooked to order. Every meal on this menu comes from a real vendor around the corner.",
    "columns": [
      {
        "title": "Explore",
        "links": [
          {
            "label": "Browse vendors",
            "link": "/vendors"
          },
          {
            "label": "Sell on {siteName}",
            "link": "/register"
          }
        ]
      },
      {
        "title": "Account",
        "links": [
          {
            "label": "Log in",
            "link": "/login"
          },
          {
            "label": "My orders",
            "link": "/orders"
          }
        ]
      },
      {
        "title": "Company",
        "links": [
          {
            "label": "About us",
            "link": "/about"
          },
          {
            "label": "About the founder",
            "link": "/founder"
          }
        ]
      },
      {
        "title": "Legal",
        "links": [
          {
            "label": "Terms of service",
            "link": "/terms"
          },
          {
            "label": "Privacy policy",
            "link": "/privacy"
          }
        ]
      }
    ],
    "contactEmail": "",
    "contactPhone": "",
    "address": "",
    "social": [],
    "copyright": "Built for local kitchens."
  },
  "auth": {
    "login": {
      "eyebrow": "Welcome back",
      "title": "Log in to {siteName}",
      "subtitle": "Pick up where you left off — your cart and orders are waiting."
    },
    "register": {
      "eyebrow": "Get started",
      "title": "Create your account"
    }
  },
  "vendors_page": {
    "eyebrow": "Full menu board",
    "title": "Vendors",
    "searchPlaceholder": "Search vendors, dishes or cuisines…"
  },
  "pages": {
    "aboutTitle": "About us",
    "founderTitle": "About the founder",
    "termsTitle": "Terms of service",
    "privacyTitle": "Privacy policy",
    "emptyMessage": "This page hasn't been written yet — check back soon."
  },
  "seo": {
    "homeTitle": "Order from local kitchens",
    "description": "Order food from local kitchens near you. Browse verified vendors, add dishes to your cart and track your order."
  }
};
