import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { dashboardApi } from "../../services/dashboardApi.js";

export default function DashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await dashboardApi.getMetrics();
      if (result.success) {
        setMetrics(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.fullName || "General Manager"}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Here is your executive overview of active construction projects and system operations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/general-manager/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <span>+</span>
              <span>{t("createProjectBtn")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm hover:border-blue-500/40 transition-all`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Users</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics?.totalUsers || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl">👥</div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm hover:border-emerald-500/40 transition-all`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Users</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{metrics?.activeUsers || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl">✅</div>
          </div>
        </div>

        <Link
          to="/general-manager/projects"
          className={`p-6 rounded-2xl border block ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/60" : "bg-white border-slate-200/80 hover:border-blue-400"} shadow-sm transition-all group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("totalProjects")}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2 group-hover:text-blue-500 transition-colors">{metrics?.totalProjects || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏗️</div>
          </div>
        </Link>

        <Link
          to="/general-manager/projects"
          className={`p-6 rounded-2xl border block ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-amber-500/60" : "bg-white border-slate-200/80 hover:border-amber-400"} shadow-sm transition-all group`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("unassigned")}</p>
              <p className="text-3xl font-black text-amber-500 mt-2 group-hover:scale-105 transition-transform">{metrics?.projectsWithoutManager || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">⚠️</div>
          </div>
        </Link>
      </div>

      {/* Projects by Status */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>📊</span> Projects by Status
          </h2>
          <Link
            to="/general-manager/projects"
            className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            View all projects →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{t("status_PLANNED")}</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{metrics?.projectsByStatus?.PLANNED || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{t("status_IN_PROGRESS")}</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{metrics?.projectsByStatus?.IN_PROGRESS || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">{t("status_ON_HOLD")}</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{metrics?.projectsByStatus?.ON_HOLD || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">{t("status_COMPLETED")}</p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{metrics?.projectsByStatus?.COMPLETED || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">{t("status_CANCELLED")}</p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{metrics?.projectsByStatus?.CANCELLED || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📋</span> Recent Administrative Activity
        </h2>
        {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {metrics.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                  isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200/60"
                }`}
              >
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shrink-0 ring-4 ring-blue-500/20" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{activity.action}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activity.entityType} {activity.entityId ? `(${activity.entityId.slice(0, 8)}...)` : ""}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    By {activity.actor?.fullName || "System"} • {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No recent activity recorded.</p>
        )}
      </div>
    </div>
  );
}
