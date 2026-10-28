import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, ArrowLeft, AlertCircle, Package, Target, Info, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function NotificationsPage() {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setNotifications(res.data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const toggleRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Notifications & Alerts
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {notifications.filter((n) => !n.read).length} Unread
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time operational alerts from Site Engineers, materials department, and system monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 text-xs font-bold hover:bg-blue-100 transition-colors shadow-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <Link
            to="/project-manager/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Loading notifications...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => toggleRead(n.id)}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                !n.read
                  ? isDark
                    ? "bg-[#0d1c33] border-blue-500/40 shadow-sm"
                    : "bg-blue-50/40 border-blue-200 shadow-xs"
                  : isDark
                  ? "bg-slate-900/40 border-slate-800"
                  : "bg-white border-slate-200/80"
              } hover:border-blue-400`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {n.priority === "critical" ? (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    ) : n.type === "material_request" ? (
                      <Package className="w-5 h-5 text-blue-500" />
                    ) : n.type === "milestone" ? (
                      <Target className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <Info className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-bold ${!n.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.2 rounded-full ${
                          n.priority === "critical"
                            ? "bg-rose-500 text-white"
                            : n.priority === "high"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-2 inline-block">
                      {n.date}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRead(n.id);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                >
                  {n.read ? "Mark unread" : "Mark read"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
