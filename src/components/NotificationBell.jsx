import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { IconBell } from "./icons";

export default function NotificationBell({ buttonClassName = "" }) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) markAllRead();
      return !wasOpen;
    });
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        className={buttonClassName}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
      >
        <IconBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-chili px-1 text-[10px] font-bold leading-none text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-line bg-white p-2 text-ink shadow-ticket">
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink/40">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink/45">Nothing yet — we'll let you know when something changes.</p>
          ) : (
            <ul className="max-h-96 space-y-0.5 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-ink/75 hover:bg-ink/5">
                    {n.message}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
