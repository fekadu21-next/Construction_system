import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Columns,
  List,
  Edit2,
  Trash2,
  Building2,
  Sparkles,
  ArrowUpDown,
  X,
  Loader2,
} from "lucide-react";
import { projectManagerService } from "../../services/projectManagerService.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function TasksAssignmentsPage() {
  const { isDark } = useTheme();

  // State
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState({ users: [], employees: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Views
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "table"
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProgressModalOpen, setEditProgressModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    projectId: "",
    taskName: "",
    description: "",
    priority: "MEDIUM",
    assignedToId: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
  });
  const [progressForm, setProgressForm] = useState({
    status: "IN_PROGRESS",
    progressPercent: 0,
    completionNotes: "",
    issues: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Load data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksRes, assigneesRes] = await Promise.all([
        projectManagerService.getTasks(),
        projectManagerService.getAssignees(),
      ]);

      if (tasksRes?.success && tasksRes.data) {
        setTasks(tasksRes.data.tasks || []);
        setProjects(tasksRes.data.projects || []);
        if (tasksRes.data.projects?.length > 0 && !createForm.projectId) {
          setCreateForm((prev) => ({ ...prev, projectId: tasksRes.data.projects[0].id }));
        }
      }

      if (assigneesRes?.success && assigneesRes.data) {
        setAssigneeOptions(assigneesRes.data);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError("Unable to load project tasks and assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchProject = selectedProject === "ALL" || t.projectId === selectedProject;
      const matchStatus = selectedStatus === "ALL" || t.status === selectedStatus;
      const matchPriority = selectedPriority === "ALL" || t.priority === selectedPriority;
      const matchSearch =
        !searchQuery ||
        t.taskName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.project?.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchProject && matchStatus && matchPriority && matchSearch;
    });
  }, [tasks, selectedProject, selectedStatus, selectedPriority, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED"
    ).length;

    return { total, inProgress, completed, blocked, overdue };
  }, [tasks]);

  // Handle Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.projectId || !createForm.taskName) return;

    try {
      setSubmitting(true);
      const res = await projectManagerService.createTask(createForm);
      if (res?.success) {
        setActionMessage({ type: "success", text: "Task created successfully!" });
        setCreateModalOpen(false);
        setCreateForm({
          projectId: projects[0]?.id || "",
          taskName: "",
          description: "",
          priority: "MEDIUM",
          assignedToId: "",
          startDate: new Date().toISOString().split("T")[0],
          dueDate: "",
        });
        await fetchData();
      } else {
        setActionMessage({ type: "error", text: res?.message || "Failed to create task" });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to create task" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Handle Edit Progress
  const openEditProgress = (task) => {
    setActiveTask(task);
    setProgressForm({
      status: task.status || "IN_PROGRESS",
      progressPercent: task.progressPercent || 0,
      completionNotes: task.completionNotes || "",
      issues: task.issues || "",
    });
    setEditProgressModalOpen(true);
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!activeTask) return;

    try {
      setSubmitting(true);
      const res = await projectManagerService.updateTask(activeTask.id, progressForm);
      if (res?.success) {
        setActionMessage({ type: "success", text: `Task "${activeTask.taskName}" updated!` });
        setEditProgressModalOpen(false);
        setActiveTask(null);
        await fetchData();
      } else {
        setActionMessage({ type: "error", text: res?.message || "Failed to update task" });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to update task" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Handle Delete
  const handleDeleteTask = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to delete task: "${taskName}"?`)) return;

    try {
      const res = await projectManagerService.deleteTask(taskId);
      if (res?.success) {
        setActionMessage({ type: "success", text: "Task deleted successfully" });
        await fetchData();
      }
    } catch (err) {
      setActionMessage({ type: "error", text: err.message || "Failed to delete task" });
    } finally {
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Priority Badge Color
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "MEDIUM":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
      case "LOW":
      default:
        return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
    }
  };

  // Status Badge Color
  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "IN_PROGRESS":
        return "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30";
      case "BLOCKED":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "PENDING":
      default:
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    }
  };

  const kanbanColumns = [
    { key: "PENDING", title: "Pending / To Do", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
    { key: "IN_PROGRESS", title: "In Progress", color: "from-blue-500/20 to-cyan-600/10 border-blue-500/30" },
    { key: "BLOCKED", title: "Blocked / Impediments", color: "from-rose-500/20 to-red-600/10 border-rose-500/30" },
    { key: "COMPLETED", title: "Completed", color: "from-emerald-500/20 to-green-600/10 border-emerald-500/30" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            actionMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tasks & Assignments</h1>
              <p className="text-sm text-slate-400">
                Plan, assign, schedule, and track construction tasks across your assigned projects.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-blue-600 text-white shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Total Tasks</span>
            <ListTodo className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{metrics.total}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>In Progress</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{metrics.inProgress}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{metrics.completed}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Blocked / Issues</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{metrics.blocked}</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Overdue</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{metrics.overdue}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? "bg-[#0d1c33]/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, assignees, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all ${
                isDark
                  ? "bg-[#08182e] border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500"
                  : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDark ? "bg-[#08182e] border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
            }`}
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDark ? "bg-[#08182e] border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDark ? "bg-[#08182e] border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
            }`}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-blue-400">{filteredTasks.length}</span> of {tasks.length} tasks
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading project tasks and assignments...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div
          className={`p-16 rounded-2xl border text-center ${
            isDark ? "bg-[#0d1c33]/40 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No tasks found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery || selectedProject !== "ALL" || selectedStatus !== "ALL"
              ? "Try adjusting your search criteria or project filter."
              : "No tasks created yet. Click 'Create Task' to assign construction work."}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer"
          >
            Create First Task
          </button>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);

            return (
              <div
                key={col.key}
                className={`rounded-2xl border p-3.5 flex flex-col gap-3 min-h-[450px] ${
                  isDark ? "bg-[#091527]/70 border-slate-800/80" : "bg-slate-100/70 border-slate-200"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{col.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-700 shadow-xs"
                      }`}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => {
                    const isOverdue =
                      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED";

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                          isDark
                            ? "bg-[#0d1c33] border-slate-800 hover:border-slate-700"
                            : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"
                        }`}
                      >
                        {/* Project Badge & Priority */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-semibold text-blue-400 truncate max-w-[140px]">
                            {task.project?.projectName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-sm mb-1.5 line-clamp-2 leading-snug">{task.taskName}</h4>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Progress</span>
                            <span className="font-bold text-slate-200">{task.progressPercent || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                task.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : task.status === "BLOCKED"
                                  ? "bg-rose-500"
                                  : "bg-gradient-to-r from-blue-500 to-cyan-400"
                              }`}
                              style={{ width: `${task.progressPercent || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta info: Assignee & Due Date */}
                        <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                            <div className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                              {task.assignedTo?.fullName
                                ? task.assignedTo.fullName.charAt(0).toUpperCase()
                                : "W"}
                            </div>
                            <span className="truncate">{task.assignedTo?.fullName || "Unassigned Worker"}</span>
                          </div>

                          <div className={`flex items-center gap-1 ${isOverdue ? "text-rose-400 font-semibold" : ""}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProgress(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Update Progress & Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id, task.taskName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / LIST VIEW */
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? "bg-[#0d1c33]/80 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className={`text-xs uppercase tracking-wider border-b ${
                  isDark ? "bg-[#091527] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <tr>
                  <th className="py-3 px-4 font-semibold">Task Name</th>
                  <th className="py-3 px-4 font-semibold">Project</th>
                  <th className="py-3 px-4 font-semibold">Assignee</th>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Progress</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`transition-colors ${
                      isDark ? "hover:bg-[#08182e]/60" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium max-w-xs">
                      <div className="font-semibold text-slate-100 truncate">{task.taskName}</div>
                      {task.description && (
                        <div className="text-xs text-slate-400 truncate">{task.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-blue-400">
                      {task.project?.projectName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {task.assignedTo?.fullName || "Unassigned"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadge(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${task.progressPercent || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{task.progressPercent || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditProgress(task)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.taskName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-lg">Create New Task</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Select Project *
                </label>
                <select
                  required
                  value={createForm.projectId}
                  onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                    isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="">Select an assigned project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Task Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor Column Reinforcement"
                  value={createForm.taskName}
                  onChange={(e) => setCreateForm({ ...createForm, taskName: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                    isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Description / Execution Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify construction specifications, trade instructions, or safety checkpoints..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                    isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                      isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Assign Lead / Worker
                  </label>
                  <select
                    value={createForm.assignedToId}
                    onChange={(e) => setCreateForm({ ...createForm, assignedToId: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                      isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  >
                    <option value="">Unassigned (Open Pool)</option>
                    <optgroup label="Site Engineers & Managers">
                      {assigneeOptions.users?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role.replace("_", " ")})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                      isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                      isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE TASK PROGRESS MODAL */}
      {editProgressModalOpen && activeTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Update Task Progress</h3>
                <p className="text-xs text-blue-400 font-semibold">{activeTask.taskName}</p>
              </div>
              <button
                onClick={() => setEditProgressModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProgress} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Execution Status
                </label>
                <select
                  value={progressForm.status}
                  onChange={(e) => {
                    const st = e.target.value;
                    setProgressForm((prev) => ({
                      ...prev,
                      status: st,
                      progressPercent: st === "COMPLETED" ? 100 : prev.progressPercent,
                    }));
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                    isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                >
                  <option value="PENDING">Pending (Not Started)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked (Site Impediments)</option>
                  <option value="COMPLETED">Completed (100%)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  <span>Progress Completion</span>
                  <span className="text-blue-400 font-bold text-sm">{progressForm.progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressForm.progressPercent}
                  onChange={(e) =>
                    setProgressForm({
                      ...progressForm,
                      progressPercent: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {progressForm.status === "BLOCKED" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-rose-400 mb-1.5">
                    Impediment Details / Blocker Reason *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Specify why task is blocked (e.g. concrete test failure, rebar shortage, heavy rain)..."
                    value={progressForm.issues}
                    onChange={(e) => setProgressForm({ ...progressForm, issues: e.target.value })}
                    className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                      isDark
                        ? "bg-[#08182e] border-rose-500/50 text-white placeholder-slate-500"
                        : "bg-slate-50 border-rose-300 text-slate-900"
                    }`}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Manager Review / Completion Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Add notes, inspection verification, or instructions for Site Engineers..."
                  value={progressForm.completionNotes}
                  onChange={(e) => setProgressForm({ ...progressForm, completionNotes: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${
                    isDark ? "bg-[#08182e] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                  }`}
                />
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditProgressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
