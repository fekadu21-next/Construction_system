import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hrApi } from "../../services/hrApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function HRDashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
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
      const res = await hrApi.getMetrics();
      if (res.success) {
        setMetrics(res.data);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to load HR metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading workforce dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? "bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-slate-800" : "bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-100 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.fullName || "HR Manager"} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Workforce distribution, daily site presence, and attendance overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/hr/attendance"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors"
            >
              <span>⏱️</span> Record Site Attendance
            </Link>
            <Link
              to="/hr/employees"
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                isDark ? "border-slate-700 bg-slate-800 hover:bg-slate-700" : "border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
              }`}
            >
              <span>➕</span> Add Worker
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchMetrics} className="underline font-medium ml-4">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Workforce */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-bold">
              👥
            </div>
          </div>
          <div className="text-3xl font-extrabold">{metrics?.totalEmployees ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-500 font-semibold">{metrics?.activeEmployees ?? 0} active</span>
            <span>•</span>
            <span>{metrics?.dailyLaborers ?? 0} daily laborers</span>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">On-Site Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">
              🏗️
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-500">{metrics?.presentToday ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">
            Logged across active construction projects
          </div>
        </div>

        {/* Card 3: Workers on Leave */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">On Leave</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold">
              🏖️
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-500">{metrics?.onLeaveEmployees ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Link to="/hr/leaves" className="text-emerald-500 hover:underline font-medium">
              {metrics?.pendingLeaves ?? 0} pending approvals
            </Link>
          </div>
        </div>

        {/* Card 4: Quick Payroll */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Labor Ledger</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-sm font-bold">
              💵
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-500">ETB Currency</div>
          <div className="text-xs text-slate-400 mt-1">
            <Link to="/hr/payroll" className="text-indigo-400 hover:underline font-medium">
              Calculate month timesheet →
            </Link>
          </div>
        </div>
      </div>

      {/* Trade Distribution & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trades breakdown */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Workforce Trade Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Categorization by construction skills & roles</p>
            </div>
            <Link to="/hr/employees" className="text-xs font-semibold text-emerald-500 hover:underline">
              View All Roster →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics?.tradeDistribution && Object.keys(metrics.tradeDistribution).length > 0 ? (
              Object.entries(metrics.tradeDistribution).map(([trade, count]) => (
                <div
                  key={trade}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-slate-400 truncate capitalize">
                      {trade.replace(/_/g, " ").toLowerCase()}
                    </p>
                    <p className="text-lg font-bold mt-0.5">{count}</p>
                  </div>
                  <span className="text-xl">🛠️</span>
                </div>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-sm text-slate-400">
                No employees registered yet. Click "Add Worker" to populate your workforce.
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Module */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <h2 className="text-base font-bold mb-1">HR Operations</h2>
          <p className="text-xs text-slate-400 mb-4">Direct workflow shortcuts</p>

          <div className="space-y-3">
            <Link
              to="/hr/attendance"
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-semibold">Take Site Attendance</p>
                <p className="text-xs text-slate-400">Check-in daily labor and track overtime</p>
              </div>
            </Link>

            <Link
              to="/hr/leaves"
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-2xl">🏖️</span>
              <div>
                <p className="text-sm font-semibold">Review Leave Queue</p>
                <p className="text-xs text-slate-400">Approve or reject pending worker leaves</p>
              </div>
            </Link>

            <Link
              to="/hr/payroll"
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
              }`}
            >
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-sm font-semibold">Generate Payroll Sheet</p>
                <p className="text-xs text-slate-400">Compute monthly salary and overtime totals</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
