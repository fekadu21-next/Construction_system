import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { notificationsApi } from "../services/notificationsApi.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Soft chime using Web Audio API
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const eventSourceRef = useRef(null);
  const toastTimerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await notificationsApi.getNotifications({ limit: 40 });
      if (res?.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle SSE Real-time connection
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setConnected(false);
      return;
    }

    fetchNotifications();

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const streamUrl = `${API_BASE_URL}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("notification", (e) => {
      try {
        const notif = JSON.parse(e.data);
        setNotifications((prev) => [notif, ...prev.filter((item) => item.id !== notif.id)]);
        setUnreadCount((prev) => prev + 1);

        // Trigger sound and toast
        playNotificationChime();
        setToast(notif);

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
          setToast(null);
        }, 6000);
      } catch (err) {
        console.error("Error parsing incoming SSE notification:", err);
      }
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      es.close();
      eventSourceRef.current = null;
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        connected,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}

      {/* Real-time Toast Floating Alert */}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 transition-all duration-300 animate-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg shrink-0">
              {toast.category === "LEAVE"
                ? "🏖️"
                : toast.category === "ATTENDANCE"
                ? "⏱️"
                : toast.category === "WORKFORCE"
                ? "👷"
                : "🔔"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Real-time Alert
                </span>
                <button
                  onClick={dismissToast}
                  className="text-slate-400 hover:text-white p-0.5 rounded text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{toast.title}</p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                {toast.message}
              </p>
              {toast.link && (
                <a
                  href={toast.link}
                  onClick={dismissToast}
                  className="inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline mt-2"
                >
                  View Details →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
