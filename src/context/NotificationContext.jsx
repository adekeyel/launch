import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { listOrders, STATUS_LABEL } from "../services/orders";
import { formatMoney, orderCode } from "../lib/format";

// In-app notifications, built on top of the same /orders endpoint everything
// else already uses — no new backend route required.
//   - Vendors: told about new orders as soon as they land, without having to
//     sit on Manage orders hitting refresh.
//   - Customers: told when an order's status changes (accepted, preparing,
//     ready, delivered), on top of the live status already shown on My orders.
// A snapshot of the last-seen order statuses is kept in localStorage per
// user, so a returning visitor also sees what changed while they were away —
// but the very first poll for a brand-new snapshot never fires notifications
// (nothing to compare against yet, so nothing "changed").

const NotificationContext = createContext(null);
const POLL_MS = 20000;
const MAX_NOTIFICATIONS = 20;

const snapshotKey = (userId) => `lt:notif:snapshot:${userId}`;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const nextId = useRef(1);
  const hadSnapshot = useRef(false);

  const push = useCallback((message, to) => {
    setNotifications((list) =>
      [{ id: nextId.current++, message, to, read: false, at: Date.now() }, ...list].slice(0, MAX_NOTIFICATIONS)
    );
  }, []);

  const poll = useCallback(async () => {
    if (!user || (user.role !== "customer" && user.role !== "vendor")) return;
    let data;
    try {
      data = await listOrders();
    } catch (err) {
      console.error("Notification poll failed:", err);
      return;
    }
    const orders = data.orders || [];

    let prev = {};
    try {
      prev = JSON.parse(localStorage.getItem(snapshotKey(user.id)) || "{}");
    } catch {
      prev = {};
    }
    const hasPriorSnapshot = hadSnapshot.current || Object.keys(prev).length > 0;

    if (hasPriorSnapshot) {
      if (user.role === "vendor") {
        orders.forEach((o) => {
          if (prev[o.id] === undefined && o.status === "pending") {
            const msg = `New order ${orderCode(o.id)} — ${formatMoney(o.total)}`;
            push(msg, "/vendor/orders");
            toast.info(msg, { action: { label: "View", to: "/vendor/orders" } });
          }
        });
      } else {
        orders.forEach((o) => {
          if (prev[o.id] !== undefined && prev[o.id] !== o.status) {
            const msg = `Your order ${orderCode(o.id)} from ${o.business_name} is now ${STATUS_LABEL[o.status] || o.status}.`;
            push(msg, "/orders");
            toast.info(msg, { action: { label: "Track", to: "/orders" } });
          }
        });
      }
    }

    const next = {};
    orders.forEach((o) => {
      next[o.id] = o.status;
    });
    try {
      localStorage.setItem(snapshotKey(user.id), JSON.stringify(next));
    } catch {
      // localStorage can be unavailable (private mode, quota) — notifications
      // just won't survive a reload in that case, nothing else breaks.
    }
    hadSnapshot.current = true;
  }, [user, toast, push]);

  useEffect(() => {
    hadSnapshot.current = false;
    setNotifications([]);
    if (!user || (user.role !== "customer" && user.role !== "vendor")) return undefined;

    poll();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((list) => (list.some((n) => !n.read) ? list.map((n) => ({ ...n, read: true })) : list));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
