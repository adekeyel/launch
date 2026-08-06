import { api } from "./api";

export function checkout({ deliveryAddress, phone, notes, paymentMethod, receiptFile }) {
  const fd = new FormData();
  fd.set("deliveryAddress", deliveryAddress);
  fd.set("phone", phone);
  if (notes) fd.set("notes", notes);
  if (paymentMethod) fd.set("paymentMethod", paymentMethod);
  if (receiptFile) fd.set("receipt", receiptFile);
  // Returns { orders, paymentLink }. paymentLink is only set for card
  // payments — the caller should redirect the browser there. For transfer
  // payments paymentLink is null and the orders are simply awaiting an
  // admin to verify the uploaded receipt.
  return api.upload("/orders", fd);
}

// Called from the /checkout/callback page after Flutterwave redirects back.
export function verifyCardPayment(txRef) {
  return api.get("/orders/verify-payment", { txRef });
}

export function listOrders(params = {}) {
  return api.get("/orders", params);
}

export function getOrder(id) {
  return api.get(`/orders/${id}`);
}

export function updateOrderStatus(id, status) {
  return api.put(`/orders/${id}`, { status });
}

export const NEXT_STATUS = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const STATUS_LABEL = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready for pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
