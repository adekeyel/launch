import { api } from "./api";

// ---- Public: the whole site's editable content (defaults + saved) ----
export function getSiteContent() {
  return api.get("/settings/content");
}

// ---- Admin ----
export function getAdminContent() {
  return api.get("/admin/content");
}

export function saveContentSection(section, content) {
  return api.put(`/admin/content/${section}`, { content });
}

export function resetContentSection(section) {
  return api.del(`/admin/content/${section}`);
}

export function uploadContentImage(file) {
  const fd = new FormData();
  fd.set("image", file);
  return api.upload("/admin/content/image", fd);
}
