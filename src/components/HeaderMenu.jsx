import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { IconChevronDown } from "./icons";

// A button that opens a small panel (Help, Account, All Categories).
// A "disclosure": click to open; closes on Escape, on clicking elsewhere, and
// whenever the page changes. `children` can be a function receiving { close }.
export default function HeaderMenu({
  label,
  icon,
  children,
  align = "right",
  panelClassName = "w-60",
  buttonClassName = "text-ink hover:bg-ink/10",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const panelId = useId();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-ink ${buttonClassName}`}
      >
        {icon}
        <span>{label}</span>
        <IconChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={panelId}
          className={`absolute top-full z-50 mt-2 rounded-xl border border-line bg-white p-2 text-ink shadow-ticket ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

// A consistent row inside those panels.
export const menuItemClass =
  "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink/80 transition hover:bg-paper hover:text-ink";
