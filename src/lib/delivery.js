import { formatMoney } from "./format";

// "Free delivery", "₦500 delivery", or "₦500 delivery, free over ₦5,000".
export function deliveryLabel(vendor, { short = false } = {}) {
  const fee = Number(vendor?.delivery_fee || 0);
  const above = vendor?.free_delivery_above == null ? null : Number(vendor.free_delivery_above);
  if (!(fee > 0)) return "Free delivery";
  if (!short && above) return `${formatMoney(fee)} delivery, free over ${formatMoney(above)}`;
  return `${formatMoney(fee)} delivery`;
}

// Orders placed before delivery fees existed have no subtotal; read it as
// total minus fee.
export function orderBreakdown(order) {
  const total = Number(order?.total || 0);
  const fee = Number(order?.delivery_fee || 0);
  const subtotal = order?.subtotal == null ? total - fee : Number(order.subtotal);
  return { subtotal, fee, total };
}
