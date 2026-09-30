import { api } from "./api";

export const VEHICLE_TYPES = [
  { value: "bike", label: "Bike (motorbike)" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "car", label: "Car" },
  { value: "on_foot", label: "On foot" },
];

// Public — no auth yet, this creates the account.
export function registerRider({ fullname, email, password, phone, vehicleType, offpayAccountRef }) {
  return api.post("/riders/register", { fullname, email, password, phone, vehicleType, offpayAccountRef });
}

export function getMyRiderProfile() {
  return api.get("/riders/me");
}
export function updateMyRiderProfile({ vehicleType, offpayAccountRef }) {
  return api.put("/riders/me", { vehicleType, offpayAccountRef });
}

export function setAvailability(isOnline, coords) {
  return api.put("/riders/me/availability", { isOnline, lat: coords?.lat, lng: coords?.lng });
}
export function pingLocation(lat, lng) {
  return api.put("/riders/me/location", { lat, lng });
}

export function listAvailableOrders(coords) {
  return api.get("/riders/me/available-orders", coords ? { lat: coords.lat, lng: coords.lng } : undefined);
}
export function claimOrder(orderId) {
  return api.post(`/riders/me/orders/${orderId}/claim`);
}
export function markPickedUp(orderId) {
  return api.put(`/riders/me/orders/${orderId}/picked-up`);
}
export function markDelivered(orderId, pin) {
  return api.put(`/riders/me/orders/${orderId}/delivered`, { pin });
}
export function listMyDeliveries({ active } = {}) {
  return api.get("/riders/me/deliveries", active ? { active: "true" } : undefined);
}

export function listEligibleForRiderSettlement() {
  return api.get("/riders/me/settlements/eligible");
}
export function createRiderSettlement({ paymentRef, note, receiptFile }) {
  const fd = new FormData();
  fd.set("paymentRef", paymentRef);
  if (note) fd.set("note", note);
  fd.set("receipt", receiptFile);
  return api.upload("/riders/me/settlements", fd);
}
export function listMyRiderSettlements() {
  return api.get("/riders/me/settlements");
}
