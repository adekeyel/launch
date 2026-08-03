import { api } from "./api";

export function getCart() {
  return api.get("/cart");
}

export function addToCart(foodId, quantity = 1) {
  return api.post("/cart", { foodId, quantity });
}

export function updateCartItem(id, quantity) {
  return api.put(`/cart/${id}`, { quantity });
}

export function removeCartItem(id) {
  return api.del(`/cart/${id}`);
}
