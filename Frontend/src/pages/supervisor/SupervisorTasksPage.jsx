import { useState, useEffect } from "react";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorTasksPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "reports"
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Update Progress Modal
  const [progressModal, setProgressModal] = useState({ open: false, task: null });
  const [progressPercent, setProgressPercent] = useState(0);
  const [taskStatus, setTaskStatus] = useState("IN_PROGRESS");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskIssues, setTaskIssues] = useState("");

  // Daily Site Report Modal
  const [reportModal, setReportModal] = useState(false);
  const [activityDesc, setActivityDesc] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");
  const [laborCount, setLaborCount] = useState(10);
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [weatherConditions, setWeatherConditions] = useState("Sunny / Clear");
  const [safetyObservations, setSafetyObservations] = useState("Full PPE observed, zero incidents");
  const [issuesNotes, setIssuesNotes] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadData();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const res = await supervisorApi.getProjects();
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setSelectedProjectId(res.data[0].id);
      }
    } catch {
      setStatusMsg({ text: "Failed to load projects", type: "error" });
    }
  };

  const loadData = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const [tasksRes, reportsRes] = await Promise.all([
        supervisorApi.getTasks(selectedProjectId),
        supervisorApi.getDailyActivities(selectedProjectId),
      ]);
      if (tasksRes.success) setTasks(tasksRes.data || []);
      if (reportsRes.success) setDailyReports(reportsRes.data || []);
    } catch {
      setStatusMsg({ text: "Failed to load tasks and site activities", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (task) => {
    setProgressModal({ open: true, task });
    setProgressPercent(task.progressPercent || 0);
    setTaskStatus(task.status || "IN_PROGRESS");
    setTaskNotes(task.completionNotes || "");
    setTaskIssues(task.issues || "");
  };

  const handleSaveProgress = async () => {
    if (!progressModal.task) return;
    try {
      const res = await supervisorApi.updateTaskProgress(progressModal.task.id, {
        progressPercent,
        status: taskStatus,
        notes: taskNotes,
        issues: taskIssues,
      });
      if (res.success) {
        setStatusMsg({ text: `✓ Progress updated to ${progressPercent}% for "${progressModal.task.taskName}"`, type: "success" });
        setProgressModal({ open: false, task: null });
        loadData();
      }
    } catch (e) {
      setStatusMsg({ text: e.message || "Failed to update task progress", type: "error" });
    }
  };

  const handleCreateDailyReport = async (e) => {
    e.preventDefault();
    try {
      const res = await supervisorApi.recordDailyActivity({
        projectId: selectedProjectId,
        activityDescription: activityDesc,
        workCompleted,
        laborCount: Number(laborCount),
        materialsUsed,
        weatherConditions,
        safetyObservations,
        issues: issuesNotes,
      });
      if (res.success) {
        setStatusMsg({ text: "✓ Daily site activity report successfully filed!", type: "success" });
        setReportModal(false);
        setActivityDesc("");
        setWorkCompleted("");
        setMaterialsUsed("");
        loadData();
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to record site report", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Progress & Daily Site Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track scheduled construction tasks, update actual progress %, and submit site diaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setReportModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-xs flex items-center gap-2 transition-colors"
          >
            <span>📝</span> Submit Daily Site Diary
          </button>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          statusMsg.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ text: "", type: "" })} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Project Selector & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Project:</label>
          {projects.length === 1 ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm font-bold text-amber-600 dark:text-amber-400">
              <span>🔒</span>
              <span>{projects[0].projectName}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
                {projects[0].projectCode}
              </span>
            </div>
          ) : projects.length > 1 ? (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-sm font-semibold outline-hidden ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
              }`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.projectCode})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-rose-500">No project assigned</span>
          )}
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-800/80">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "tasks"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Tasks & Milestones ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "reports"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Daily Site Diaries ({dailyReports.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Tasks Grid */}
      {activeTab === "tasks" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-slate-400">Loading site tasks...</div>
          ) : tasks.length === 0 ? (
            <div className={`col-span-3 p-12 rounded-2xl border text-center text-slate-400 ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
            }`}>
              No tasks currently registered for this construction project.
            </div>
          ) : (
            tasks.map((task) => {
              const isOverdue = task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < new Date();
              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark ? "bg-slate-900/80 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        task.priority === "HIGH" || task.priority === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                          : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {task.priority || "NORMAL"} Priority
                      </span>

                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        task.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : task.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">{task.taskName}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {task.description || "No specific scope notes provided."}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Actual Completion</span>
                        <span className="text-amber-500 font-bold">{task.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 rounded-full"
                          style={{ width: `${task.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    {isOverdue && (
                      <p className="text-[11px] font-bold text-rose-500 mb-2">
                        ⚠️ Overdue: Target was {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}

                    {task.issues && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-3">
                        <span className="font-bold">Blocker:</span> {task.issues}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Flexible"}
                    </span>
                    <button
                      onClick={() => openUpdateModal(task)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
                    >
                      Update Progress
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Daily Site Diaries */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {dailyReports.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <span className="text-xs font-bold uppercase text-amber-500 block">
                    {new Date(r.activityDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <h3 className="font-bold text-base mt-0.5">{r.activityDescription}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                    👷‍♂️ {r.laborCount || 0} Workers On Site
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400">
                    🌤️ {r.weatherConditions || "Clear"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Work Accomplished</p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{r.workCompleted}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Materials & Safety Observations</p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-400">Materials:</span> {r.materialsUsed || "Standard consumables"}<br />
                    <span className="font-semibold text-slate-400">Safety:</span> {r.safetyObservations || "Normal operations"}
                  </p>
                  {r.issues && (
                    <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <span className="font-bold">Delays/Issues:</span> {r.issues}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Update Modal */}
      {progressModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h3 className="text-base font-bold mb-1">Record Task Work Progress</h3>
            <p className="text-xs text-slate-400 mb-4">{progressModal.task?.taskName}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Progress Percentage ({progressPercent}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Task Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Completion Notes</label>
                <textarea
                  rows={2}
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Details of physical work completed today..."
                  className={`w-full p-2.5 rounded-xl border text-xs outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Delays / Issues (Optional)</label>
                <input
                  type="text"
                  value={taskIssues}
                  onChange={(e) => setTaskIssues(e.target.value)}
                  placeholder="e.g. Scaffolding shortage or rain stoppage"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setProgressModal({ open: false, task: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgress}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Diary Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateDailyReport}
            className={`max-w-lg w-full rounded-2xl p-6 border shadow-2xl max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <h3 className="text-base font-bold mb-1">Submit Daily Site Diary</h3>
            <p className="text-xs text-slate-400 mb-4">Official daily report submitted by Site Supervisor.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Activity Title / Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3rd Floor Slab Concrete Pour & Column Rebar Fixing"
                  value={activityDesc}
                  onChange={(e) => setActivityDesc(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Work Accomplished</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed breakdown of construction work executed during the shift..."
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Laborers Present</label>
                  <input
                    type="number"
                    min="1"
                    value={laborCount}
                    onChange={(e) => setLaborCount(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Weather Conditions</label>
                  <input
                    type="text"
                    value={weatherConditions}
                    onChange={(e) => setWeatherConditions(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Materials Consumed</label>
                <input
                  type="text"
                  placeholder="e.g. 120 bags Dangote cement, 15 m3 river sand"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Safety Observations</label>
                <input
                  type="text"
                  value={safetyObservations}
                  onChange={(e) => setSafetyObservations(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Issues or Delays (Optional)</label>
                <input
                  type="text"
                  placeholder="Any delays, equipment breakdowns or material shortages"
                  value={issuesNotes}
                  onChange={(e) => setIssuesNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
