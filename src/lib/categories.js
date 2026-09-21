// Vendors and dishes use free-text categories ("Rice", "rice ", "Swallow"),
// so compare them case- and whitespace-insensitively.
export function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

// The most common vendor categories in a list of vendors, with how many
// vendors are in each: [{ label, count }], most frequent first.
export function categoryCounts(vendors, limit = 10) {
  const counts = new Map();
  for (const vendor of vendors) {
    const seenForVendor = new Set();
    for (const raw of vendor.categories || []) {
      const key = normalizeCategory(raw);
      if (!key || seenForVendor.has(key)) continue;
      seenForVendor.add(key);
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { label: String(raw).trim(), count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

// Same, but just the display labels — for filter chips.
export function topCategories(vendors, limit = 10) {
  return categoryCounts(vendors, limit).map((entry) => entry.label);
}

export function vendorHasCategory(vendor, category) {
  const wanted = normalizeCategory(category);
  if (!wanted) return true;
  return (vendor.categories || []).some((c) => normalizeCategory(c) === wanted);
}

// "20-30 min" -> 20. Vendors with no ETA sort last.
export function etaMinutes(eta) {
  const match = String(eta ?? "").match(/\d+/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

// Groups dishes by their category, keeping the order categories first appear
// in. Dishes without a category land in a final "More dishes" group.
export function groupFoodsByCategory(foods) {
  const groups = new Map();
  const uncategorised = [];
  for (const food of foods) {
    const key = normalizeCategory(food.category);
    if (!key) {
      uncategorised.push(food);
      continue;
    }
    if (!groups.has(key)) groups.set(key, { label: String(food.category).trim(), foods: [] });
    groups.get(key).foods.push(food);
  }
  const sections = [...groups.values()];
  if (uncategorised.length) {
    sections.push({ label: sections.length ? "More dishes" : "Menu", foods: uncategorised });
  }
  return sections.map((section, index) => ({ ...section, id: `menu-section-${index}` }));
}
