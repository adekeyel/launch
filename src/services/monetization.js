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
export const CAMPAIGN_TYPES = [
  { value: "homepage", label: "Homepage featured banner" },
  { value: "sponsored_search", label: "Sponsored search results" },
  { value: "category", label: "Category promotion" },
  { value: "spotlight", label: "Recommended for you spotlight" },
  { value: "limited_offer", label: "Limited-time promotion" },
  { value: "festival", label: "Seasonal / festival campaign" },
];
export const CAMPAIGN_DURATIONS = [1, 3, 7, 30];

export function createCampaign(campaignType, durationDays, paymentRef) {
  return api.post("/vendors/me/campaigns", { campaignType, durationDays, paymentRef });
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
