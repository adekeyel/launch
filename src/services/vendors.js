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

export function uploadMyLogo(file) {
  const fd = new FormData();
  fd.set("media", file);
  return api.upload("/vendors/me/logo", fd, "PUT");
}

export function uploadMyBanner(file) {
  const fd = new FormData();
  fd.set("media", file);
  return api.upload("/vendors/me/banner", fd, "PUT");
}
