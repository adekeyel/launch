import { api } from "./api";

// ---- Pro subscription (Tier 2) ----
export function subscribe(plan, billingCycle) {
  return api.post("/vendors/me/subscriptions", { plan, billingCycle });
}
export function listMySubscriptions() {
  return api.get("/vendors/me/subscriptions");
}
export function attachSubscriptionPaymentRef(id, paymentRef) {
  return api.put(`/vendors/me/subscriptions/${id}/payment-ref`, { paymentRef });
}
export function cancelMySubscription(id) {
  return api.put(`/vendors/me/subscriptions/${id}/cancel`);
}
export function listMyBilling() {
  return api.get("/vendors/me/billing");
}

// ---- Advertising campaigns ----
// The 5 real ad spaces the site renders — hero/tile drive the home page,
// top/middle/bottom are the thin strips on browse pages. Sizes and accepted
// file types come from the backend (utils/adSpaces.js) via getAdSpaces(),
// this is just the icon mapping for the UI.
export const PLACEMENT_ICONS = { hero: "megaphone", tile: "menu", top: "search", middle: "star", bottom: "clock" };
export const CAMPAIGN_DURATIONS = [1, 3, 7, 30];

export function getAdSpaces() {
  return api.get("/vendors/me/ad-spaces");
}

export function createCampaign({ placement, durationDays, paymentRef, bannerFile }) {
  const fd = new FormData();
  fd.set("placement", placement);
  fd.set("durationDays", String(durationDays));
  fd.set("paymentRef", paymentRef);
  fd.set("banner", bannerFile);
  return api.upload("/vendors/me/campaigns", fd);
}
export function listMyCampaigns() {
  return api.get("/vendors/me/campaigns");
}

// ---- Settlements (payout requests) ----
// Orders that are delivered + payment-verified + at least a day past
// verification + not already claimed by a previous request.
export function listEligibleSettlementOrders() {
  return api.get("/vendors/me/settlements/eligible");
}
export function createSettlement({ paymentRef, note, receiptFile }) {
  const fd = new FormData();
  fd.set("paymentRef", paymentRef);
  if (note) fd.set("note", note);
  fd.set("receipt", receiptFile);
  return api.upload("/vendors/me/settlements", fd);
}
export function listMySettlements() {
  return api.get("/vendors/me/settlements");
}
