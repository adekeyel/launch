import { api } from "./api";

export function listVendors(params = {}) {
  return api.get("/vendors", params);
}

export function getVendor(id) {
  return api.get(`/vendors/${id}`);
}

export function getMyVendorProfile() {
  return api.get("/vendors/me");
}

export function updateMyVendorProfile(patch) {
  return api.put("/vendors/me", patch);
}
