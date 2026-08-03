# LAUNCH TIME — Local Food Ordering (client)

A React + Vite frontend for the LAUNCH TIME local food ordering platform. Built against the existing
Node.js/Express/PostgreSQL backend — no backend changes required.

## Tech stack

- React 18 + Vite
- React Router (no data-fetching framework — plain `fetch` via a small service layer)
- Tailwind CSS
- Context API for auth + cart state

## Features

**Customer**
- Register / login
- Browse & search vendors and meals
- View a vendor's menu and a meal's details
- Add to cart, update quantity, remove items (cart persists server-side)
- Checkout (delivery address, phone, notes, payment method, optional receipt upload)
- Order history with live status tracking

**Vendor**
- Add / edit / delete food items, with optional photo upload
- Toggle an item live/draft
- Dashboard overview (menu size, live orders, revenue)
- View incoming orders and move them through pending → preparing → ready → delivered (or cancel)

**Admin** *(bonus — see note below)*
- Approve/suspend vendors and verify their Tier 1 payment account
- Edit platform settings, including the OffPay registration link (`/admin/settings`)
- Confirm vendor Pro subscription payments (`/admin/subscriptions`)
- Activate/reject vendor advertising campaigns (`/admin/campaigns`)
- Approve/reject vendor payout (settlement) requests (`/admin/settlements`)
- View platform-wide analytics (`/admin/analytics`)

## Vendor tiers & monetization

This matches the backend'''s tier system exactly:

- **Tier 0 (free)** — a vendor can build their profile and save menu items as drafts, but is invisible to
  customers and can'''t take orders.
- **Tier 1 (Verified)** — unlocked once the vendor sets up a payment account via OffPay and an admin confirms
  it (`/vendor/grow`, or the same CTA on the dashboard overview). The OffPay registration link is **not
  hardcoded** — it'''s read from `GET /settings` (`offpay_registration_url`) and editable any time at
  `/admin/settings`. It currently points at `https://offpay-gamma.vercel.app/auth/register`, seeded in the
  backend'''s `schema.sql`, but you can change it from the admin UI without touching code or redeploying.
- **Tier 2 (Pro)** — a paid monthly/quarterly/yearly subscription vendors buy from `/vendor/grow`. Since
  there'''s no OffPay webhook, this follows the same manual pattern as Tier 1: vendor submits a payment
  reference, admin confirms it at `/admin/subscriptions`, and the vendor is upgraded automatically.
- **Advertising** — a separate self-serve purchase (also from `/vendor/grow`, Tier 1+ only) for homepage
  banners, sponsored search, category promotion, spotlight, limited-time, and seasonal campaigns, in 1/3/7/30
  day durations. Same admin-confirms-payment pattern, managed at `/admin/campaigns`.
- **Payouts** — vendors request settlements with a payment reference + receipt at `/vendor/payouts`; admins
  approve/reject at `/admin/settlements`.
- **Trust badges** — Verified/Pro/Enterprise badges on vendor cards and menu pages are driven only by the
  real `tier` field. "Sponsored" and "Popular" badges were deliberately left out: the backend'''s ranking
  algorithm computes a sponsored flag server-side but strips it before returning vendor rows, and there'''s no
  popularity/fast-delivery signal exposed for vendors — faking those badges would show data that isn'''t
  actually there.
- **Ranking** — sponsored > Pro/Enterprise > Verified, then rating/orders/acceptance/delivery/distance/
  activity, is entirely server-side (`vendorModel.findRanked`). The frontend just displays whatever order
  `/vendors` returns.

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your running backend
npm run dev
```

Build for production:

```bash
npm run build   # outputs to dist/
npm run preview # sanity-check the production build locally
```

## Environment variables

| Variable       | Description                                    |
| -------------- | ----------------------------------------------- |
| `VITE_API_URL` | Base URL of the backend API, no trailing slash. |

## API endpoints used

| Method | Path                        | Used for                          |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/auth/register`            | Sign up (customer or vendor)       |
| POST   | `/auth/login`                | Log in                             |
| POST   | `/auth/refresh`              | Silent session restore              |
| POST   | `/auth/logout`               | Log out                            |
| GET    | `/auth/me`                   | Current user                       |
| GET    | `/vendors`                   | Browse/search vendors              |
| GET    | `/vendors/:id`               | Vendor detail                      |
| GET    | `/vendors/me`                | Own vendor profile                 |
| GET    | `/vendors/me/foods`          | Own menu (incl. drafts)            |
| GET    | `/foods`                     | Browse/search meals                |
| GET    | `/foods/:id`                 | Meal detail                        |
| POST   | `/foods`                     | Add a meal (multipart, optional `media`) |
| PUT    | `/foods/:id`                 | Edit a meal                        |
| DELETE | `/foods/:id`                 | Delete a meal                      |
| GET/POST/PUT/DELETE | `/cart`, `/cart/:id`   | Cart management                    |
| POST   | `/orders`                    | Checkout (multipart, optional `receipt`) |
| GET    | `/orders`                    | Order history (role-aware)         |
| GET    | `/orders/:id`                | Order detail + line items          |
| PUT    | `/orders/:id`                | Update order status (vendor/admin) |
| GET    | `/admin/vendors`             | List vendors (admin)               |
| PUT    | `/admin/vendors/:id/status`  | Approve/suspend a vendor           |
| PUT    | `/admin/vendors/:id/tier`    | Verify a vendor (Tier 1)           |
| GET    | `/settings`                  | Public settings (e.g. OffPay URL)  |
| GET/PUT | `/admin/settings`, `/admin/settings/:key` | List/edit platform settings |
| POST/GET | `/vendors/me/subscriptions`  | Buy Pro, view own subscriptions    |
| PUT    | `/vendors/me/subscriptions/:id/payment-ref` | Submit OffPay payment ref |
| GET/PUT | `/admin/subscriptions`, `/admin/subscriptions/:id/activate/reject` | Confirm/reject Pro payment |
| POST/GET | `/vendors/me/campaigns`      | Buy an ad campaign, view own       |
| GET/PUT | `/admin/campaigns`, `/admin/campaigns/:id/activate/reject` | Confirm/reject campaign payment |
| POST/GET | `/vendors/me/settlements`    | Request a payout, view own history |
| GET/PUT | `/admin/settlements`, `/admin/settlements/:id` | Approve/reject payout requests |
| GET    | `/admin/analytics`           | Platform-wide stats                |

## Two things worth knowing before you deploy

**1. New vendors start invisible on purpose.** The backend only lists vendors that are `status:
"approved"` **and** `tier >= 1`. A freshly registered vendor is `pending`/Tier 0, so their menu won't
show up for customers — and their food items save as drafts — until an admin approves and verifies
them. That's why the admin dashboard is fully built out even though it's a bonus feature: without vendor
approval, the vendor → customer flow can't be demoed end-to-end. Log in as the seeded super admin
(`SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from the backend's `.env`) and visit `/admin` to approve
a test vendor.

**2. The refresh cookie is `SameSite=Strict`.** That's correct and secure when frontend and backend
share a top-level domain, but if you deploy the frontend on Vercel and the backend on Railway (two
different domains), the browser will never send that cookie cross-site — silent session restore
(`/auth/refresh`) will always fail, and users will need to log in again each visit rather than staying
signed in. This is a backend cookie-config concern, not something fixable from the frontend alone —
worth flagging to whoever owns that repo if persistent cross-domain sessions matter for your deploy.
