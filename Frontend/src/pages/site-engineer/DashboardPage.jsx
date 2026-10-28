import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Package,
  FileText,
  ClipboardList,
  Clock,
  Bell,
  Users,
  ArrowRight,
  SlidersHorizontal,
  X,
  Plus,
  HardHat,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

export const TASK_PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  URGENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

export const TASK_STATUS_COLORS = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  BLOCKED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected task for quick update modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressVal, setProgressVal] = useState(0);
  const [statusVal, setStatusVal] = useState("IN_PROGRESS");
  const [notesVal, setNotesVal] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await siteEngineerService.getDashboardOverview();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTaskModal = (task) => {
    setSelectedTask(task);
    setProgressVal(task.progressPercent || 0);
    setStatusVal(task.status || "IN_PROGRESS");
    setNotesVal(task.completionNotes || "");
  };

  const handleSaveTaskProgress = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setUpdating(true);
    try {
      const res = await siteEngineerService.updateTaskProgress(selectedTask.id, {
        progressPercent: progressVal,
        status: statusVal,
        completionNotes: notesVal,
      });
      if (res.success) {
        setSelectedTask(null);
        await loadDashboard();
      } else {
        alert(res.error || "Failed to update task");
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading site operations dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center max-w-xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 my-8">
        <p className="text-rose-600 dark:text-rose-400 font-bold mb-2">Unable to load dashboard</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const { summaryMetrics } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Welcome Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 mb-2">
              <HardHat className="w-3.5 h-3.5" />
              <span>Site Execution & Quality Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.fullName || "Site Engineer"}!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Track day-to-day construction execution, worker attendance, task progress, and material requisitions.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/site-engineer/activities"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Activity</span>
            </Link>
            <Link
              to="/site-engineer/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Attendance</span>
            </Link>
            <Link
              to="/site-engineer/material-requests"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 text-blue-600 dark:text-cyan-400 text-xs font-bold transition-colors shadow-xs"
            >
              <Package className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Materials</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Assigned Projects */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/40" : "bg-white border-slate-200/80 hover:border-blue-400 shadow-sm"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Projects</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 dark:text-white">
            {summaryMetrics.assignedProjects}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold mt-1">Assigned Sites</p>
        </div>

        {/* Active Tasks */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/40" : "bg-white border-slate-200/80 hover:border-blue-400 shadow-sm"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Active Tasks</span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-blue-600 dark:text-cyan-400">
            {summaryMetrics.activeTasks}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">In Progress</p>
        </div>

        {/* Completed Tasks */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-emerald-500/40" : "bg-white border-slate-200/80 hover:border-emerald-400 shadow-sm"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            {summaryMetrics.completedTasks}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Tasks Done</p>
        </div>

        {/* Overdue Tasks */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-rose-500/40" : "bg-white border-slate-200/80 hover:border-rose-400 shadow-sm"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${summaryMetrics.overdueTasks > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}`}>
            {summaryMetrics.overdueTasks}
          </p>
          <p className="text-[11px] text-rose-500 dark:text-rose-400 font-semibold mt-1">Past Deadline</p>
        </div>

        {/* Pending Requisitions */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-amber-500/40" : "bg-white border-slate-200/80 hover:border-amber-400 shadow-sm"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Requisitions</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-amber-600 dark:text-amber-400">
            {summaryMetrics.pendingMaterialRequests}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Pending PM</p>
        </div>

        {/* Submitted Reports */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0d1c33] border-slate-800 hover:border-indigo-500/40" : "bg-white border-slate-200/80 hover:border-indigo-400 shadow-sm"}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Reports</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-indigo-600 dark:text-indigo-400">
            {summaryMetrics.submittedReports}
          </p>
          <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold mt-1">Filed to PM</p>
        </div>
      </div>

      {/* Main Grid: Active Tasks + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Tasks with Quick Update */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>My Active Construction Tasks</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tasks assigned specifically to you across active sites.</p>
              </div>
              <Link
                to="/site-engineer/tasks"
                className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View all tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.activeTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-xs font-semibold">All tasks completed! Check with your Project Manager.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark ? "bg-[#081528] border-slate-800/80 hover:border-blue-500/40" : "bg-slate-50/80 border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_PRIORITY_COLORS[task.priority] || "bg-slate-200"}`}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[task.status] || "bg-slate-200"}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 truncate">
                            {task.project?.projectName}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {task.taskName}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenTaskModal(task)}
                        className="px-3 py-1.5 rounded-xl border border-blue-500/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Update %</span>
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-900 dark:text-white">{task.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${task.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Site Activities */}
          <div className={`p-5 sm:p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Recent Daily Field Logs</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Execution and inspection records recorded on site.</p>
              </div>
              <Link
                to="/site-engineer/activities"
                className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View all logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.recentActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                No site activities logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      isDark ? "bg-[#081528] border-slate-800/80" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-blue-600 dark:text-cyan-400">
                        {act.project?.projectName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {act.activityDate ? new Date(act.activityDate).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {act.activityDescription}
                    </p>
                    <p className="text-slate-500 mt-1 line-clamp-1">{act.workCompleted}</p>
                    {act.laborCount && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        <Users className="w-3 h-3" />
                        <span>{act.laborCount} Workers active</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines, Requisitions, Notifications */}
        <div className="space-y-6">
          {/* Upcoming Deadlines (14 days) */}
          <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Upcoming Handover Targets</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Milestones & tasks due within next 14 days.</p>

            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No urgent deadlines in next 14 days.</p>
            ) : (
              <div className="space-y-2.5">
                {data.upcomingDeadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-700 dark:text-cyan-300 border border-blue-500/20">
                          {dl.type}
                        </span>
                        <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{dl.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-500">{dl.projectName}</p>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                      {dl.dueDate ? new Date(dl.dueDate).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Material Requests Status Snapshot */}
          <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Material Requisitions</span>
              </h2>
              <Link to="/site-engineer/material-requests" className="text-xs text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">{summaryMetrics.pendingMaterialRequests}</span>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Pending</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{summaryMetrics.approvedMaterialRequests}</span>
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Approved</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">{summaryMetrics.rejectedMaterialRequests}</span>
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">Rejected</p>
              </div>
            </div>

            {data.recentMaterialRequests.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                {data.recentMaterialRequests.slice(0, 3).map((mr) => (
                  <div key={mr.id} className="text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {mr.requestNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        mr.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : mr.status === "REJECTED"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {mr.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Notifications */}
          <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Site Alerts</span>
              </h2>
              <Link to="/site-engineer/notifications" className="text-xs text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1">
                <span>All alerts</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {data.recentNotifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No unread alerts.</p>
            ) : (
              <div className="space-y-2">
                {data.recentNotifications.map((notif) => (
                  <div key={notif.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{notif.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Progress Update Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Update Task Progress</span>
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">{selectedTask.taskName}</p>
              <p className="text-slate-500 mt-0.5">{selectedTask.project?.projectName}</p>
            </div>

            <form onSubmit={handleSaveTaskProgress} className="space-y-4 text-xs font-semibold">
              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-700 dark:text-slate-300">Completion Percentage</label>
                  <span className="font-black text-blue-600 dark:text-cyan-400 text-sm">{progressVal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Execution Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed (100%)</option>
                  <option value="BLOCKED">Blocked / Issue</option>
                </select>
              </div>

              {/* Field Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Field Notes / Sign-off Details</label>
                <textarea
                  rows="3"
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="e.g., Rebar tied, spacers placed, ready for pour."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
