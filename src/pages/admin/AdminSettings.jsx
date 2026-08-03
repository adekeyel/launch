import { useEffect, useState } from "react";
import { listSettings, updateSetting } from "../../services/admin";
import AdminTabs from "../../components/AdminTabs";
import Loader from "../../components/Loader";
import ErrorBanner from "../../components/ErrorBanner";

const GROUPS = [
  {
    label: "OffPay",
    keys: ["offpay_registration_url"],
  },
  {
    label: "Pro subscription pricing (₦)",
    keys: ["pro_price_monthly", "pro_price_quarterly", "pro_price_yearly"],
  },
  {
    label: "Advertising campaign pricing (₦)",
    keys: ["campaign_price_1day", "campaign_price_3day", "campaign_price_7day", "campaign_price_30day"],
  },
  {
    label: "Commission & ranking",
    keys: [
      "commission_rate",
      "ranking_weight_rating",
      "ranking_weight_orders",
      "ranking_weight_acceptance",
      "ranking_weight_delivery",
      "ranking_weight_distance",
      "ranking_weight_activity",
      "ranking_min_orders_for_rating",
    ],
  },
  {
    label: "Enterprise (future tier)",
    keys: [
      "enterprise_enabled",
      "enterprise_price_monthly",
      "enterprise_price_yearly",
      "enterprise_max_branches",
      "enterprise_max_staff",
      "enterprise_max_menu_items",
    ],
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState("");
  const [savedKey, setSavedKey] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listSettings();
      const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
      setSettings(byKey);
      setDrafts(Object.fromEntries(rows.map((r) => [r.key, r.value])));
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Couldn't load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (key) => {
    setSavingKey(key);
    setError("");
    setSavedKey(null);
    try {
      const current = settings[key];
      const updated = await updateSetting(key, drafts[key], current?.is_public);
      setSettings((s) => ({ ...s, [key]: updated }));
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      setError(err?.message || `Couldn't save ${key}.`);
    } finally {
      setSavingKey(null);
    }
  };

  const knownKeys = new Set(GROUPS.flatMap((g) => g.keys));
  const otherKeys = Object.keys(settings)
    .filter((k) => !knownKeys.has(k))
    .sort();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-marigold-dark">Admin</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Settings</h1>
      <div className="mt-6">
        <AdminTabs />
      </div>
      <div className="mt-6">
        <ErrorBanner message={error} />
      </div>

      {loading ? (
        <Loader label="Loading settings…" />
      ) : (
        <div className="mt-6 space-y-8">
          {GROUPS.map((group) => {
            const rows = group.keys.filter((k) => settings[k]);
            if (rows.length === 0) return null;
            return (
              <section key={group.label}>
                <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
                  {group.label}
                </h2>
                <div className="card divide-y divide-line">
                  {rows.map((key) => (
                    <SettingRow
                      key={key}
                      settingKey={key}
                      value={drafts[key] ?? ""}
                      onChange={(v) => setDrafts((d) => ({ ...d, [key]: v }))}
                      onSave={() => handleSave(key)}
                      saving={savingKey === key}
                      saved={savedKey === key}
                      isPublic={settings[key]?.is_public}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {otherKeys.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/50">Other</h2>
              <div className="card divide-y divide-line">
                {otherKeys.map((key) => (
                  <SettingRow
                    key={key}
                    settingKey={key}
                    value={drafts[key] ?? ""}
                    onChange={(v) => setDrafts((d) => ({ ...d, [key]: v }))}
                    onSave={() => handleSave(key)}
                    saving={savingKey === key}
                    saved={savedKey === key}
                    isPublic={settings[key]?.is_public}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SettingRow({ settingKey, value, onChange, onSave, saving, saved, isPublic }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-[220px] flex-1">
        <p className="font-mono text-xs text-ink/70">{settingKey}</p>
        {isPublic && <span className="text-[10px] font-medium uppercase tracking-wide text-basil">Public</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input min-w-[240px] flex-1"
      />
      <button onClick={onSave} disabled={saving} className="btn-outline h-9 shrink-0 px-4 text-xs">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
