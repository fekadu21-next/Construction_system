import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckSquare, Clock, AlertTriangle, Building2, Target, SlidersHorizontal, X, Search, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";
import { TASK_PRIORITY_COLORS, TASK_STATUS_COLORS } from "./DashboardPage.jsx";

export default function MyTasksPage() {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [activeTask, setActiveTask] = useState(null);
  const [progressVal, setProgressVal] = useState(0);
  const [statusVal, setStatusVal] = useState("IN_PROGRESS");
  const [notesVal, setNotesVal] = useState("");
  const [issuesVal, setIssuesVal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPriority]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await siteEngineerService.getTasks({
        status: filterStatus === "ALL" ? "" : filterStatus,
        priority: filterPriority === "ALL" ? "" : filterPriority,
        search: searchQuery,
      });
      if (res.success) {
        setTasks(res.data.tasks || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTasks();
  };

  const handleOpenModal = (task) => {
    setActiveTask(task);
    setProgressVal(task.progressPercent || 0);
    setStatusVal(task.status || "IN_PROGRESS");
    setNotesVal(task.completionNotes || "");
    setIssuesVal(task.issues || "");
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (!activeTask) return;
    setSubmitting(true);
    try {
      const res = await siteEngineerService.updateTaskProgress(activeTask.id, {
        progressPercent: progressVal,
        status: statusVal,
        completionNotes: notesVal,
        issues: issuesVal,
      });
      if (res.success) {
        setActiveTask(null);
        await loadTasks();
      } else {
        alert(res.error || "Failed to update task progress");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Assigned Tasks
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              {tasks.length} Assigned Tasks
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Execute and report construction activities assigned to you by Project Managers.
          </p>
        </div>

        <Link
          to="/site-engineer/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === status
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 flex-1 md:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading assigned tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-[#0d1c33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No tasks found</p>
          <p className="text-xs text-slate-500 mt-0.5">No tasks match your selected filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== "COMPLETED";

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${
                  isDark ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/40" : "bg-white border-slate-200/80 shadow-xs hover:border-blue-500/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_PRIORITY_COLORS[task.priority] || "bg-slate-200"}`}>
                        {task.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[task.status] || "bg-slate-200"}`}>
                        {task.status.replace("_", " ")}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> OVERDUE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Target: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Flexible"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {task.taskName}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" /> {task.project?.projectName}
                    </span>
                    {task.milestone && (
                      <span className="flex items-center gap-1">
                        • <Target className="w-3.5 h-3.5 text-indigo-500" /> {task.milestone.milestoneName}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {task.description}
                    </p>
                  )}

                  {task.completionNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Field Inspection Notes</p>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{task.completionNotes}</p>
                    </div>
                  )}

                  {task.issues && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-xs mb-3 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Site Issue: {task.issues}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar + action button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500">Execution Progress</span>
                    <span className="text-blue-600 dark:text-cyan-400">{task.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${task.progressPercent || 0}%` }}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleOpenModal(task)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Update Status / %</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                  <span>Record Task Progress</span>
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{activeTask.taskName}</p>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs font-semibold">
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed (100%)</option>
                  <option value="BLOCKED">Blocked / Issue</option>
                </select>
              </div>

              {/* Field Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Field Inspection & Completed Work</label>
                <textarea
                  rows="3"
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="Describe progress verified on site..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Issues/Delays */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Any Delays or Obstacles (Optional)</label>
                <input
                  type="text"
                  value={issuesVal}
                  onChange={(e) => setIssuesVal(e.target.value)}
                  placeholder="e.g., Awaiting cement batching delivery"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
