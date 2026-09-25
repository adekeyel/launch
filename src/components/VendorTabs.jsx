import { NavLink, useLocation } from "react-router-dom";

const TABS = [
  { to: "/vendor/dashboard", label: "Overview", end: true },
  { to: "/vendor/profile", label: "Shop profile" },
  { to: "/vendor/foods", label: "Manage foods" },
  { to: "/vendor/orders", label: "Manage orders" },
  { to: "/vendor/reviews", label: "Reviews" },
  // Payouts and Grow live under the Earnings hub now (they're still their
  // own pages/routes — just reached via cards on /vendor/earnings instead of
  // their own top-level tabs), so this tab should read as active there too.
  { to: "/vendor/earnings", label: "Earnings", alsoActiveOn: ["/vendor/payouts", "/vendor/grow"] },
];

export default function VendorTabs() {
  const location = useLocation();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full border border-ink/15 bg-white p-1">
      {TABS.map((tab) => {
        const alsoActive = tab.alsoActiveOn?.some((p) => location.pathname.startsWith(p));
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive || alsoActive ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
              }`
            }
          >
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
