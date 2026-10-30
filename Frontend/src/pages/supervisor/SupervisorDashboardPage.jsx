import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorDashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await supervisorApi.getDashboard();
      if (res.success) {
        setMetrics(res.data);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to load supervisor dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading site operations...</span>
        </div>
      </div>
    );
  }

  const primaryProject = metrics?.assignedProjects?.[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`p-6 rounded-2xl border ${isDark
          ? "bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-slate-800"
          : "bg-gradient-to-r from-amber-50 via-orange-50/40 to-white border-amber-100 shadow-xs"
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Site Operations Desk
              </h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Today: {metrics?.todayDate || "Current Shift"}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Field workforce attendance, shift operations, and task milestones.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/supervisor/attendance"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm shadow-xs flex items-center gap-2 transition-colors"
            >
              <span>⏱️</span> Log Daily Attendance
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="underline font-medium ml-4">Retry</button>
        </div>
      )}

      {metrics?.assignedProjectsCount === 0 && (
        <div className="p-5 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-base">No Assigned Construction Site</h3>
            <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
              Your supervisor account has not been assigned to any project yet. Site operations, attendance tracking, and laborer registration will activate once you are assigned to a site by your General Manager.
            </p>
          </div>
        </div>
      )}

      {primaryProject && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏗️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400">Assigned Site:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{primaryProject.projectName}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
                  {primaryProject.projectCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Location: {primaryProject.location || "On Site"} • Project Manager: {primaryProject.projectManager?.fullName || "Unassigned"}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Today's Attendance */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">On-Site Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              👷‍♂️
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-500">{metrics?.workforce?.presentCount ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{metrics?.workforce?.totalWorkers ?? 0} registered workers</span>
            <span>•</span>
            <span className="font-semibold text-amber-500">{metrics?.workforce?.attendanceRate ?? 0}% presence</span>
          </div>
        </div>

        {/* Card 2: Attendance Submissions */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sheet Review Status</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              📋
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-500">{metrics?.pendingSheetsCount ?? 0}</div>
          <div className="text-xs text-slate-400 mt-1">
            <Link to="/supervisor/attendance" className="text-blue-400 hover:underline">
              Pending HR approval sheets →
            </Link>
          </div>
        </div>

        {/* Card 3: Tasks Due & Overdue */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tasks Due Today</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              ⚡
            </div>
          </div>
          <div className="text-3xl font-extrabold text-indigo-500">{metrics?.tasks?.dueToday ?? 0}</div>
          <div className="text-xs mt-1 flex items-center gap-1.5">
            {metrics?.tasks?.overdue > 0 ? (
              <span className="text-rose-500 font-bold">⚠️ {metrics.tasks.overdue} overdue activities</span>
            ) : (
              <span className="text-emerald-500 font-medium">✓ All tasks on schedule</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Projects, Operations, and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Assigned Projects & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Projects Table */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">Assigned Construction Sites</h2>
                <p className="text-xs text-slate-400 mt-0.5">Projects authorized under your supervision</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500">
                {metrics?.assignedProjects?.length || 0} Sites
              </span>
            </div>

            <div className="space-y-3">
              {metrics?.assignedProjects && metrics.assignedProjects.length > 0 ? (
                metrics.assignedProjects.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? "bg-slate-800/40 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200/80 hover:bg-white"
                      } transition-colors`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{p.projectName}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {p.projectCode}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">📍 {p.location || "Addis Ababa"}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-semibold">{p.assignedWorkersCount || 0} Assigned Workers</p>
                        <p className="text-[11px] text-slate-400">{p.openTasksCount || 0} active tasks</p>
                      </div>
                      <Link
                        to={`/supervisor/attendance?projectId=${p.id}`}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold transition-colors"
                      >
                        Take Attendance
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  No construction projects currently assigned.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Field Quick Operations & Site Safety Overview */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <h2 className="text-base font-bold mb-1">Field Quick Operations</h2>
            <p className="text-xs text-slate-400 mb-4">Direct shortcuts for daily site management</p>

            <div className="space-y-3">
              <Link
                to="/supervisor/attendance"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                  }`}
              >
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-sm font-semibold">Log Daily Attendance</p>
                  <p className="text-xs text-slate-400">Mark workers present, absent, and overtime</p>
                </div>
              </Link>

              <Link
                to="/supervisor/tasks"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                  }`}
              >
                <span className="text-2xl">🏗️</span>
                <div>
                  <p className="text-sm font-semibold">Tasks & Progress</p>
                  <p className="text-xs text-slate-400">Update work milestones and progress percentage</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
