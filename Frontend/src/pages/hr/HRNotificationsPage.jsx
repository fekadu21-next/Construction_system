import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useNotifications } from "../../contexts/NotificationContext.jsx";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationIcon(category, type) {
  if (category === "LEAVE") return "🏖️";
  if (category === "ATTENDANCE") return "⏱️";
  if (category === "WORKFORCE") return "👷";
  if (type === "WARNING") return "⚠️";
  if (type === "SUCCESS") return "✅";
  return "🔔";
}

export default function HRNotificationsPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    connected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("all");

  const filtered = notifications.filter((n) => {
    if (activeTab === "unread") return !n.isRead;
    if (activeTab === "leave") return n.category === "LEAVE";
    if (activeTab === "attendance") return n.category === "ATTENDANCE";
    if (activeTab === "workforce") return n.category === "WORKFORCE";
    return true;
  });

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">HR Notifications</h1>
            {connected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-time Live
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time workforce alerts, attendance entries, and leave approval events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshNotifications()}
            title="Refresh notifications"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm transition-colors"
          >
            🔄
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Mark all as read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[
          { label: "All", value: "all", count: notifications.length },
          { label: "Unread", value: "unread", count: unreadCount },
          {
            label: "Leave",
            value: "leave",
            count: notifications.filter((n) => n.category === "LEAVE").length,
          },
          {
            label: "Attendance",
            value: "attendance",
            count: notifications.filter((n) => n.category === "ATTENDANCE").length,
          },
          {
            label: "Workforce",
            value: "workforce",
            count: notifications.filter((n) => n.category === "WORKFORCE").length,
          },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.value
                ? "bg-emerald-600 text-white shadow-sm"
                : isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.value
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div
            className={`p-12 text-center rounded-2xl border ${
              isDark
                ? "bg-slate-900/60 border-slate-800 text-slate-400"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <span className="text-4xl block mb-2">🎉</span>
            <p className="text-sm font-semibold">No notifications in this view</p>
            <p className="text-xs text-slate-400 mt-1">
              You're all caught up with your workforce and HR activities!
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const icon = getNotificationIcon(item.category, item.type);
            const isUnread = !item.isRead;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isUnread
                    ? isDark
                      ? "bg-slate-800/80 border-emerald-900/50 shadow-xs ring-1 ring-emerald-500/20"
                      : "bg-emerald-50/40 border-emerald-200 shadow-xs ring-1 ring-emerald-500/20"
                    : isDark
                    ? "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 opacity-80"
                    : "bg-white border-slate-200 hover:bg-slate-50 opacity-90"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    item.type === "WARNING"
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600"
                      : item.type === "SUCCESS"
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                  }`}
                >
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          isUnread
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.title}
                      </h3>
                      {item.category && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {item.link && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 hover:underline">
                      View details →
                    </span>
                  )}
                </div>

                {isUnread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
