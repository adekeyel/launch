import { api } from "./api";

// ---- Vendors ----
export function listAllVendors(params = {}) {
  return api.get("/admin/vendors", params);
}
export function setVendorStatus(id, status) {
  return api.put(`/admin/vendors/${id}/status`, { status });
}
export function setVendorTier(id, tier) {
  return api.put(`/admin/vendors/${id}/tier`, { tier });
}

// ---- Platform settings (editable config, e.g. offpay_registration_url) ----
export function listSettings() {
  return api.get("/admin/settings");
}
export function updateSetting(key, value, isPublic) {
  return api.put(`/admin/settings/${key}`, { value, isPublic });
}

// ---- Subscriptions (Pro / Enterprise payment confirmation) ----
export function listAllSubscriptions(params = {}) {
  return api.get("/admin/subscriptions", params);
}
export function activateSubscription(id) {
  return api.put(`/admin/subscriptions/${id}/activate`);
}
export function rejectSubscription(id) {
  return api.put(`/admin/subscriptions/${id}/reject`);
}

// ---- Ad campaigns (vendor self-service advertising) ----
export function listAllCampaigns(params = {}) {
  return api.get("/admin/campaigns", params);
}
export function activateCampaign(id) {
  return api.upload(`/admin/campaigns/${id}/activate`, new FormData(), "PUT");
}
export function rejectCampaign(id) {
  return api.put(`/admin/campaigns/${id}/reject`);
}

// ---- Settlements (vendor payout review) ----
export function listAllSettlements(params = {}) {
  return api.get("/admin/settlements", params);
}
export function decideSettlement(id, status) {
  return api.put(`/admin/settlements/${id}`, { status });
}

// ---- Orders (oversight — view receipts/payment refs, force any status) ----
export function listAllOrders(params = {}) {
  return api.get("/admin/orders", params);
}
export function forceUpdateOrderStatus(id, status) {
  return api.put(`/admin/orders/${id}`, { status });
}
export function verifyOrderPayment(id) {
  return api.put(`/admin/orders/${id}/verify-payment`);
}

// ---- Analytics ----
export function getAnalytics() {
  return api.get("/admin/analytics");
}
