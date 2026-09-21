import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IconCheck, IconX } from "../components/icons";

const ToastContext = createContext(null);

const DURATION_MS = { success: 4000, info: 4000, error: 6500 };
const MAX_VISIBLE = 3;

// Lightweight toast system — no dependency, no animation (so nothing to
// switch off for reduced-motion users).
//   const toast = useToast();
//   toast.success("Saved.");
//   toast.error("Couldn't save.");
//   toast.success("Added.", { action: { label: "View cart", to: "/cart" } });
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind, message, options = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, kind, message, action: options.action }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), options.duration ?? DURATION_MS[kind])
      );
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((t) => clearTimeout(t));
  }, []);

  const toast = useMemo(
    () => ({
      success: (message, options) => push("success", message, options),
      error: (message, options) => push("error", message, options),
      info: (message, options) => push("info", message, options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-ticket ${
              t.kind === "error" ? "bg-chili text-white" : "bg-ink text-paper"
            }`}
          >
            {t.kind === "success" && <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-marigold" />}
            <div className="min-w-0 flex-1">
              <p>{t.message}</p>
              {t.action && (
                <Link
                  to={t.action.to}
                  onClick={() => dismiss(t.id)}
                  className="mt-1 inline-block font-semibold underline underline-offset-2"
                >
                  {t.action.label}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 transition hover:opacity-100"
              aria-label="Dismiss"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
