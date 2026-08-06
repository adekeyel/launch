import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/vendor/dashboard", label: "Overview", end: true },
  { to: "/vendor/profile", label: "Shop profile" },
  { to: "/vendor/foods", label: "Manage foods" },
  { to: "/vendor/orders", label: "Manage orders" },
  { to: "/vendor/grow", label: "Grow" },
  { to: "/vendor/payouts", label: "Payouts" },
];

export default function VendorTabs() {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full border border-ink/15 bg-white p-1">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive ? "bg-ink text-paper" : "text-ink/55 hover:text-ink"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
