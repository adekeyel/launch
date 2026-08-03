import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/admin", label: "Vendors", end: true },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/campaigns", label: "Campaigns" },
  { to: "/admin/settlements", label: "Settlements" },
  { to: "/admin/analytics", label: "Analytics" },
];

export default function AdminTabs() {
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
