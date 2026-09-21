import { useId, useState } from "react";
import Toggle from "../Toggle";
import { uploadContentImage } from "../../services/content";
import { useToast } from "../../context/ToastContext";
import { errorMessage } from "../../lib/errors";

// Draws an editing form from a field description sent by the server
// (utils/contentSchema.js), so the admin screen and the server's validation
// can never disagree about what a section contains.

// ---- ids: stable React keys for list items (stripped by the server on save) ----
let nextId = 1;
const newId = () => `i${nextId++}`;

// A new, empty list item with each field's default.
export function blankItem(fields) {
  const item = { _id: newId() };
  for (const [key, def] of Object.entries(fields)) {
    if (def.type === "group") item[key] = blankGroup(def.fields);
    else if (def.type === "list") item[key] = [];
    else if (def.type === "image") item[key] = null;
    else item[key] = def.default === undefined ? "" : def.default;
  }
  return item;
}

function blankGroup(fields) {
  const out = {};
  for (const [key, def] of Object.entries(fields)) {
    if (def.type === "group") out[key] = blankGroup(def.fields);
    else if (def.type === "list") out[key] = [];
    else out[key] = def.default === undefined ? "" : def.default;
  }
  return out;
}

// Give every list item an id, all the way down.
export function withIds(fields, value) {
  const out = { ...value };
  for (const [key, def] of Object.entries(fields)) {
    if (def.type === "group") out[key] = withIds(def.fields, value?.[key] || {});
    else if (def.type === "list") {
      out[key] = (value?.[key] || []).map((item) => ({ ...withIds(def.fields, item), _id: newId() }));
    }
  }
  return out;
}

// Back to what the server stores (no ids).
export function withoutIds(value) {
  if (Array.isArray(value)) return value.map(withoutIds);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "_id")
        .map(([key, v]) => [key, withoutIds(v)])
    );
  }
  return value;
}

const LINK_SUGGESTIONS = [
  "/",
  "/vendors",
  "/vendors?open=1",
  "/vendors?sort=rating",
  "/register",
  "/login",
  "/orders",
  "/cart",
  "/about",
  "/founder",
  "/terms",
  "/privacy",
  "#popular",
];

const LINK_HELP = "A page on this site (like /vendors), a web address (https://…), #section, mailto: or tel:.";

function Shell({ id, label, help, children }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {help && <p className="mt-1 text-xs text-ink/45">{help}</p>}
    </div>
  );
}

function ImageField({ def, value, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const id = useId();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadContentImage(file);
      onChange(url);
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast.error(errorMessage(err, "Couldn't upload that image. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="field-label">{def.label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-line bg-white">
          {value ? (
            <img src={value} alt={`${def.label} preview`} className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-[11px] text-ink/40">Built-in logo</span>
          )}
        </div>
        <label
          htmlFor={id}
          className="btn-outline h-9 cursor-pointer px-4 text-xs focus-within:outline focus-within:outline-2 focus-within:outline-marigold"
        >
          {busy ? "Uploading…" : value ? "Replace image" : "Choose image"}
          <input id={id} type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={busy} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="btn-outline h-9 px-4 text-xs">
            Use built-in
          </button>
        )}
      </div>
      {def.help && <p className="mt-1 text-xs text-ink/45">{def.help}</p>}
    </div>
  );
}

function Field({ def, value, onChange }) {
  const id = useId();

  switch (def.type) {
    case "text":
      return (
        <Shell id={id} label={def.label} help={def.help}>
          <input
            id={id}
            value={value ?? ""}
            maxLength={def.max}
            onChange={(e) => onChange(e.target.value)}
            className="field-input"
            required={def.required}
          />
        </Shell>
      );
    case "textarea":
      return (
        <Shell id={id} label={def.label} help={def.help}>
          <textarea
            id={id}
            value={value ?? ""}
            rows={def.rows || 3}
            maxLength={def.max}
            onChange={(e) => onChange(e.target.value)}
            className="field-input h-auto py-2.5"
          />
        </Shell>
      );
    case "link":
      return (
        <Shell id={id} label={def.label} help={def.help || LINK_HELP}>
          <input
            id={id}
            value={value ?? ""}
            list="site-link-suggestions"
            onChange={(e) => onChange(e.target.value)}
            className="field-input"
            placeholder="/vendors"
            autoComplete="off"
            required={def.required}
          />
        </Shell>
      );
    case "boolean":
      return <Toggle label={def.label} description={def.help} checked={Boolean(value)} onChange={onChange} />;
    case "number":
      return (
        <Shell id={id} label={def.label} help={def.help}>
          <input
            id={id}
            type="number"
            min={def.min}
            max={def.max}
            step={def.integer ? 1 : "any"}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="field-input w-32"
          />
        </Shell>
      );
    case "select":
      return (
        <Shell id={id} label={def.label} help={def.help}>
          <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="field-input">
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Shell>
      );
    case "image":
      return <ImageField def={def} value={value} onChange={onChange} />;
    case "group":
      return (
        <fieldset className="rounded-xl border border-line bg-white p-4">
          <legend className="px-1 font-display text-sm font-bold text-ink">{def.label}</legend>
          <Fields fields={def.fields} value={value || {}} onChange={onChange} />
        </fieldset>
      );
    case "list":
      return <ListField def={def} items={value || []} onChange={onChange} />;
    default:
      return null;
  }
}

function ListField({ def, items, onChange }) {
  const max = def.max || 10;
  const setItem = (i, next) => onChange(items.map((it, idx) => (idx === i ? next : it)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="field-label mb-0">{def.label}</p>
        <p className="text-xs text-ink/40">
          {items.length} of {max}
        </p>
      </div>
      {def.help && <p className="mt-1 text-xs text-ink/45">{def.help}</p>}

      {items.length === 0 && <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink/50">Nothing here yet.</p>}

      <ul className="mt-2 space-y-3">
        {items.map((item, i) => {
          const title = def.itemTitle ? item[def.itemTitle] : "";
          const hidden = item.enabled === false;
          return (
            <li key={item._id}>
              <details className="rounded-xl border border-line bg-white" open={items.length <= 4}>
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink">
                  <span className="min-w-0 truncate">
                    {def.itemLabel} {i + 1}
                    {title ? `: ${title}` : ""}
                  </span>
                  {hidden && <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium text-ink/60">Hidden</span>}
                </summary>
                <div className="space-y-4 border-t border-line px-4 py-4">
                  <Fields fields={def.fields} value={item} onChange={(next) => setItem(i, next)} />
                  <div className="flex flex-wrap gap-2 border-t border-dashed border-line pt-3">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn-outline h-8 px-3 text-xs">
                      Move up
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      className="btn-outline h-8 px-3 text-xs"
                    >
                      Move down
                    </button>
                    <button type="button" onClick={() => remove(i)} className="btn-outline h-8 px-3 text-xs text-chili">
                      Remove {def.itemLabel.toLowerCase()} {i + 1}
                    </button>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...items, blankItem(def.fields)])}
        disabled={items.length >= max}
        className="btn-outline mt-3 h-9 px-4 text-xs"
      >
        Add {def.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

// Renders every field of an object, in the order the server lists them.
function Fields({ fields, value, onChange }) {
  return (
    <div className="space-y-4">
      {Object.entries(fields).map(([key, def]) => (
        <Field key={key} def={def} value={value[key]} onChange={(next) => onChange({ ...value, [key]: next })} />
      ))}
    </div>
  );
}

export default function SchemaForm({ fields, value, onChange }) {
  return (
    <>
      <datalist id="site-link-suggestions">
        {LINK_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <Fields fields={fields} value={value} onChange={onChange} />
    </>
  );
}
