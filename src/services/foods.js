import { api } from "./api";

export function listFoods(params = {}) {
  return api.get("/foods", params);
}

export function getFood(id) {
  return api.get(`/foods/${id}`);
}

export function listMyFoods() {
  return api.get("/vendors/me/foods");
}

function toFormData({ name, description, price, category, mediaFile }) {
  const fd = new FormData();
  fd.set("name", name);
  if (description) fd.set("description", description);
  fd.set("price", String(price));
  if (category) fd.set("category", category);
  if (mediaFile) fd.set("media", mediaFile);
  return fd;
}

export function createFood(input) {
  return api.upload("/foods", toFormData(input));
}

export function updateFood(id, input) {
  const fd = new FormData();
  if (input.name !== undefined) fd.set("name", input.name);
  if (input.description !== undefined) fd.set("description", input.description);
  if (input.price !== undefined) fd.set("price", String(input.price));
  if (input.category !== undefined) fd.set("category", input.category);
  if (input.is_available !== undefined) fd.set("is_available", String(input.is_available));
  if (input.mediaFile) fd.set("media", input.mediaFile);
  return api.upload(`/foods/${id}`, fd, "PUT");
}

export function deleteFood(id) {
  return api.del(`/foods/${id}`);
}
