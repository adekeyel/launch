import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { listOrders, STATUS_LABEL } from "../services/orders";
import { getMyRiderProfile, listAvailableOrders } from "../services/riders";
import { formatMoney, orderCode } from "../lib/format";

// In-app notifications, built on top of the same /orders endpoint everything
// else already uses — no new backend route required.
//   - Vendors: told about new orders as soon as they land, without having to
//     sit on Manage orders hitting refresh.
//   - Customers: told when an order's status changes (accepted, preparing,
//     ready, delivered), on top of the live status already shown on My orders.
//   - Riders: told when a new order becomes available to claim, as long as
//     they're online — even while sitting on a different tab of the rider
//     dashboard (Deliveries, Earnings), not just the Available orders page,
//     which only polls while it's the page you're actually looking at.
// A snapshot of the last-seen order statuses/ids is kept in localStorage per
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

  const pollRider = useCallback(async () => {
    // Only alert while actually online — an offline rider can't claim
    // anything yet, so a flood of "order available" pings would just be
    // noise (and cost an extra call) until they turn availability on.
    let rider;
    try {
      rider = await getMyRiderProfile();
    } catch (err) {
      console.error("Rider notification poll failed:", err);
      return;
    }
    if (rider.status !== "approved" || !rider.is_online) return;

    let data;
    try {
      data = await listAvailableOrders();
    } catch (err) {
      console.error("Rider notification poll failed:", err);
      return;
    }
    const orders = data.orders || [];

    let prevIds = [];
    try {
      prevIds = JSON.parse(localStorage.getItem(snapshotKey(user.id)) || "[]");
    } catch {
      prevIds = [];
    }
    const hasPriorSnapshot = hadSnapshot.current || prevIds.length > 0;
    const prevSet = new Set(prevIds);

    if (hasPriorSnapshot) {
      orders.forEach((o) => {
        if (!prevSet.has(o.id)) {
          const msg = `New order at ${o.business_name} — earn ${formatMoney(o.delivery_fee)}`;
          push(msg, "/rider/available");
          toast.info(msg, { action: { label: "View", to: "/rider/available" } });
        }
      });
    }

    try {
      localStorage.setItem(snapshotKey(user.id), JSON.stringify(orders.map((o) => o.id)));
    } catch {
      // ignore — see the comment on the customer/vendor path below
    }
    hadSnapshot.current = true;
  }, [user, toast, push]);

  const poll = useCallback(async () => {
    if (!user) return;
    if (user.role === "rider") {
      await pollRider();
      return;
    }
    if (user.role !== "customer" && user.role !== "vendor") return;
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
  }, [user, toast, push, pollRider]);

  useEffect(() => {
    hadSnapshot.current = false;
    setNotifications([]);
    if (!user || !["customer", "vendor", "rider"].includes(user.role)) return undefined;

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

