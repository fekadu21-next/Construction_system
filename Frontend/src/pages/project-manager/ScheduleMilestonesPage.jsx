import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function ScheduleMilestonesPage() {
  const { isDark } = useTheme();
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setMilestones(res.data.upcomingMilestones || []);
        setProjects(res.data.projects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = milestones.filter((m) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "OVERDUE") return m.isOverdue;
    return m.completionStatus.toUpperCase() === filterStatus.toUpperCase();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Project Schedule & Milestones
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
              {milestones.length} Critical Targets
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track milestone deliverables, identify critical path bottlenecks, and safeguard project handover dates.
          </p>
        </div>

        <Link
          to="/project-manager/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div
        className={`p-4 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "OVERDUE", "IN PROGRESS", "BEHIND SCHEDULE", "UPCOMING"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === tab
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Milestones Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Loading milestones & schedule...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
              } hover:border-blue-500/40`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {m.milestoneName}
                    </h3>
                    {m.isOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                    🏗️ {m.projectName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Lead Site Engineer: <strong className="text-slate-700 dark:text-slate-300">{m.assignedEngineer}</strong> • Target Date: <strong className="text-slate-900 dark:text-white">{m.dueDate}</strong>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      m.isOverdue
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300"
                    }`}
                  >
                    {m.completionStatus}
                  </span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {m.progressPercent}% Completed
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    m.isOverdue ? "bg-rose-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${m.progressPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Schedules Timeline Overview */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>📅</span> Master Construction Timeline
        </h2>
        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/60"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-900 dark:text-white">{p.projectName}</span>
                <span className="text-slate-500">
                  {p.startDate} → {p.expectedEndDate} ({p.scheduleStatus})
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    p.scheduleStatus === "Delayed"
                      ? "bg-rose-500"
                      : p.scheduleStatus === "Ahead"
                      ? "bg-cyan-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${p.completionPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
