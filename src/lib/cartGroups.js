// One entry per vendor, in the order their first item appears, combining the
// vendor's cart summary (delivery fee, open/closed) with its items.
export function groupCartItems(items, vendors = []) {
  const info = new Map(vendors.map((v) => [v.vendor_id, v]));
  const groups = new Map();
  for (const item of items) {
    // vendor_id is always present from the API; the fallback just keeps React keys stable.
    const key = item.vendor_id ?? item.business_name ?? "vendor";
    if (!groups.has(key)) {
      groups.set(key, { key, vendor_id: item.vendor_id, business_name: item.business_name, items: [] });
    }
    groups.get(key).items.push(item);
  }
  return [...groups.values()].map((group) => ({ ...group, ...(info.get(group.vendor_id) || {}), items: group.items }));
}
