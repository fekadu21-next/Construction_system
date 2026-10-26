import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, CheckCircle2, AlertTriangle, Info, CheckCheck } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

export default function NotificationsPage() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await siteEngineerService.getNotifications({ unreadOnly });
      if (res.success) {
        setNotifications(res.data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    await siteEngineerService.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await siteEngineerService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Notifications & Site Alerts
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time field alerts for task assignments, PM material approvals, and report reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <Link
            to="/site-engineer/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !unreadOnly
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              unreadOnly
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Unread Only
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-[#0d1c33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No notifications found</p>
          <p className="text-xs text-slate-500 mt-0.5">You are completely up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                notif.isRead
                  ? isDark
                    ? "bg-[#081528] border-slate-800/80 text-slate-400"
                    : "bg-slate-50/60 border-slate-200/60 text-slate-600"
                  : isDark
                  ? "bg-[#0d1c33] border-blue-500/40 text-slate-200 shadow-md"
                  : "bg-white border-blue-300 shadow-sm text-slate-900"
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="shrink-0 mt-0.5">
                  {notif.type === "SUCCESS" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : notif.type === "WARNING" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`text-sm font-bold truncate ${!notif.isRead ? "text-slate-900 dark:text-white" : ""}`}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs leading-relaxed mb-2">{notif.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        className="font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                      >
                        View Details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-bold text-blue-600 dark:text-cyan-400 shrink-0 transition-colors"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
