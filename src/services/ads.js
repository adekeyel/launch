import { api } from "./api";

// ---- Public ----
export function getActiveAds(placement, page) {
  return api.get("/ads", { placement, page });
}

// ---- Admin ----
export function listAllAds(params = {}) {
  return api.get("/admin/ads", params);
}

// NOTE: the backend uses different field-name casing for create vs update
// (linkUrl/displayOrder on POST, link_url/display_order on PUT) — these two
// builders intentionally differ to match that exactly, otherwise an edit
// silently no-ops instead of erroring.

export function createAd({ title, linkUrl, placement, page, displayOrder, startsAt, endsAt, mediaFile }) {
  const fd = new FormData();
  fd.set("title", title);
  fd.set("placement", placement);
  if (page) fd.set("page", page);
  if (linkUrl) fd.set("linkUrl", linkUrl);
  if (displayOrder !== undefined) fd.set("displayOrder", String(displayOrder));
  if (startsAt) fd.set("startsAt", startsAt);
  if (endsAt) fd.set("endsAt", endsAt);
  if (mediaFile) fd.set("media", mediaFile);
  return api.upload("/admin/ads", fd);
}

export function updateAd(id, { title, linkUrl, placement, page, displayOrder, isActive, mediaFile }) {
  const fd = new FormData();
  if (title !== undefined) fd.set("title", title);
  if (placement !== undefined) fd.set("placement", placement);
  if (page !== undefined) fd.set("page", page);
  if (linkUrl !== undefined) fd.set("link_url", linkUrl);
  if (displayOrder !== undefined) fd.set("display_order", String(displayOrder));
  if (isActive !== undefined) fd.set("is_active", String(isActive));
  if (mediaFile) fd.set("media", mediaFile);
  return api.upload(`/admin/ads/${id}`, fd, "PUT");
}

export function deleteAd(id) {
  return api.del(`/admin/ads/${id}`);
}

export const PLACEMENTS = ["top", "middle", "bottom"];
