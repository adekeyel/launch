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
  {
    value: "homepage",
    label: "Homepage featured banner",
    icon: "megaphone",
    description: "Your banner rotates in the homepage spotlight — the first thing every visitor sees.",
  },
  {
    value: "sponsored_search",
    label: "Sponsored search results",
    icon: "search",
    description: "Appear at the top when customers search for meals, kitchens or cuisines.",
  },
  {
    value: "category",
    label: "Category promotion",
    icon: "menu",
    description: "Get featured at the top of a food category, like Rice dishes or Drinks.",
  },
  {
    value: "spotlight",
    label: "Recommended for you spotlight",
    icon: "star",
    description: "Show up in the personalised picks customers see based on what they usually order.",
  },
  {
    value: "limited_offer",
    label: "Limited-time promotion",
    icon: "clock",
    description: "Flag a short-term deal or new menu item with an urgency badge.",
  },
  {
    value: "festival",
    label: "Seasonal / festival campaign",
    icon: "sparkle",
    description: "Ride seasonal demand — Christmas, Eid, back-to-school and other high-traffic moments.",
  },
];
export const CAMPAIGN_DURATIONS = [1, 3, 7, 30];

// A short human-readable label used in receipts, lists and confirmations.
export const campaignTypeLabel = (value) => CAMPAIGN_TYPES.find((t) => t.value === value)?.label || value;

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
