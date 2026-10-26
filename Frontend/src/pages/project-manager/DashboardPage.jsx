import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function DashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Action States
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionRequest, setActionRequest] = useState(null); // { request, type: 'APPROVE' | 'REJECT' }
  const [actionNotes, setActionNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || "Unable to fetch project manager dashboard data");
      }
    } catch {
      setError("Failed to communicate with project manager service.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Handle Approve / Reject submission
  const handleConfirmRequestAction = async () => {
    if (!actionRequest) return;
    setSubmittingAction(true);
    try {
      let res;
      if (actionRequest.type === "APPROVE") {
        res = await projectManagerService.approveMaterialRequest(actionRequest.request.id, actionNotes);
      } else {
        res = await projectManagerService.rejectMaterialRequest(actionRequest.request.id, actionNotes);
      }

      if (res.success) {
        showToast(res.message);
        setActionRequest(null);
        setActionNotes("");
        // Refresh overview
        await fetchDashboardData();
      } else {
        showToast(res.error || "Action failed.");
      }
    } catch {
      showToast("An error occurred while executing action.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Review Progress Report
  const handleReviewReport = async (reportId) => {
    try {
      const res = await projectManagerService.reviewProgressReport(reportId, "Acknowledged by Project Manager");
      if (res.success) {
        showToast(res.message);
        setSelectedReport(null);
        await fetchDashboardData();
      }
    } catch {
      showToast("Failed to review progress report.");
    }
  };

  // Helper formatters
  const formatCurrency = (val) => {
    return `ETB ${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Filter projects by status and search
  const filteredProjects = (data?.projects || []).filter((p) => {
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "DELAYED"
        ? p.status === "DELAYED" || p.scheduleStatus === "Delayed"
        : p.status === statusFilter;

    const matchesSearch =
      !searchQuery ||
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.siteEngineer?.fullName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className={`p-8 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"}`}>
          <div className="h-8 w-72 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded-md" />
        </div>
        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80"} h-28`} />
          ))}
        </div>
        <div className="flex items-center justify-center py-12 text-slate-500">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-sm font-semibold">Loading Project Manager Dashboard...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-sm">Dashboard Error</h3>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-sm font-medium">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          1. TOP WELCOME CARD (Exact prompt requirement)
      ========================================================= */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 mb-1">
              <span>🏗️</span>
              <span>Project Management Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, Project Manager!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
              Monitor your assigned construction projects, track progress, manage approvals, and control project budgets.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#my-projects-section"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 transition-all transform active:scale-95"
            >
              <span>📊</span>
              <span>VIEW MY PROJECTS</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. FOUR SUMMARY METRIC CARDS (Matching GM Dashboard layout)
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Assigned Projects */}
        <div
          onClick={() => {
            setStatusFilter("ALL");
            const el = document.getElementById("my-projects-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/50"
              : "bg-white border-slate-200/80 hover:border-blue-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assigned Projects
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {data?.summaryMetrics?.assignedProjects || 0}
              </p>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 mt-1 inline-block">
                Under active management
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-2xl shadow-xs">
              🏗️
            </div>
          </div>
        </div>

        {/* 2. Projects In Progress */}
        <div
          onClick={() => {
            setStatusFilter("IN_PROGRESS");
            const el = document.getElementById("my-projects-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-emerald-500/50"
              : "bg-white border-slate-200/80 hover:border-emerald-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Projects In Progress
              </p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {data?.summaryMetrics?.projectsInProgress || 0}
              </p>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 inline-block">
                Active site construction
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-xs">
              ⚡
            </div>
          </div>
        </div>

        {/* 3. Delayed Projects */}
        <div
          onClick={() => {
            setStatusFilter("DELAYED");
            const el = document.getElementById("my-projects-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-rose-500/50"
              : "bg-white border-slate-200/80 hover:border-rose-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Delayed Projects
              </p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {data?.summaryMetrics?.delayedProjects || 0}
              </p>
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 inline-block">
                Requires schedule review
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl shadow-xs">
              ⚠️
            </div>
          </div>
        </div>

        {/* 4. Pending Material Approvals */}
        <div
          onClick={() => {
            const el = document.getElementById("material-requests-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-amber-500/50"
              : "bg-white border-slate-200/80 hover:border-amber-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending Approvals
              </p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {data?.summaryMetrics?.pendingApprovals || 0}
              </p>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 inline-block">
                Material requests awaiting PM
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-xs">
              📦
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. PROJECT STATUS SECTION: "My Projects by Status"
      ========================================================= */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              My Projects by Status
            </h2>
            {statusFilter !== "ALL" && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300">
                Filtered: {statusFilter}
              </span>
            )}
          </div>
          <Link
            to="/project-manager/projects"
            className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>View All Projects</span>
            <span>→</span>
          </Link>
        </div>

        {/* 5 Pastel Status Cards (Planned, In Progress, On Hold, Completed, Delayed) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Planned */}
          <div
            onClick={() => setStatusFilter(statusFilter === "PLANNED" ? "ALL" : "PLANNED")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              statusFilter === "PLANNED"
                ? "ring-2 ring-blue-500 bg-blue-500/20"
                : "bg-blue-500/10 hover:bg-blue-500/15"
            } border-blue-500/25`}
          >
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Planned</span>
              <span>📋</span>
            </p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">
              {data?.statusCounts?.PLANNED || 0}
            </p>
            <p className="text-[11px] text-blue-600/70 dark:text-blue-300/70 mt-0.5">Pre-construction</p>
          </div>

          {/* In Progress */}
          <div
            onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              statusFilter === "IN_PROGRESS"
                ? "ring-2 ring-emerald-500 bg-emerald-500/20"
                : "bg-emerald-500/10 hover:bg-emerald-500/15"
            } border-emerald-500/25`}
          >
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>In Progress</span>
              <span>⚡</span>
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
              {data?.statusCounts?.IN_PROGRESS || 0}
            </p>
            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-300/70 mt-0.5">Under execution</p>
          </div>

          {/* On Hold */}
          <div
            onClick={() => setStatusFilter(statusFilter === "ON_HOLD" ? "ALL" : "ON_HOLD")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              statusFilter === "ON_HOLD"
                ? "ring-2 ring-amber-500 bg-amber-500/20"
                : "bg-amber-500/10 hover:bg-amber-500/15"
            } border-amber-500/25`}
          >
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>On Hold</span>
              <span>⏸️</span>
            </p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">
              {data?.statusCounts?.ON_HOLD || 0}
            </p>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-300/70 mt-0.5">Paused temporarily</p>
          </div>

          {/* Completed */}
          <div
            onClick={() => setStatusFilter(statusFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              statusFilter === "COMPLETED"
                ? "ring-2 ring-purple-500 bg-purple-500/20"
                : "bg-purple-500/10 hover:bg-purple-500/15"
            } border-purple-500/25`}
          >
            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Completed</span>
              <span>✅</span>
            </p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-2">
              {data?.statusCounts?.COMPLETED || 0}
            </p>
            <p className="text-[11px] text-purple-600/70 dark:text-purple-300/70 mt-0.5">Handed over</p>
          </div>

          {/* Delayed */}
          <div
            onClick={() => setStatusFilter(statusFilter === "DELAYED" ? "ALL" : "DELAYED")}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              statusFilter === "DELAYED"
                ? "ring-2 ring-rose-500 bg-rose-500/20"
                : "bg-rose-500/10 hover:bg-rose-500/15"
            } border-rose-500/25`}
          >
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Delayed</span>
              <span>⚠️</span>
            </p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">
              {data?.statusCounts?.DELAYED || 0}
            </p>
            <p className="text-[11px] text-rose-600/70 dark:text-rose-300/70 mt-0.5">Behind baseline</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. MY PROJECTS TABLE & DETAILS (Assigned to PM)
      ========================================================= */}
      <div
        id="my-projects-section"
        className={`p-6 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏗️</span> My Assigned Projects
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed tracking of construction progress, assigned site engineers, and expenditure.
            </p>
          </div>

          {/* Search bar inside projects section */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search projects, site engineer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  isDark
                    ? "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
            {statusFilter !== "ALL" && (
              <button
                onClick={() => setStatusFilter("ALL")}
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline shrink-0"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Projects List / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? "bg-slate-900/60 text-slate-400" : "bg-slate-50 text-slate-500"
              } border-y border-slate-200 dark:border-slate-800`}
            >
              <tr>
                <th className="px-4 py-3.5">Project Details</th>
                <th className="px-4 py-3.5">Site Engineer</th>
                <th className="px-4 py-3.5">Completion</th>
                <th className="px-4 py-3.5">Timeline</th>
                <th className="px-4 py-3.5">Schedule Status</th>
                <th className="px-4 py-3.5">Budget vs Actual</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <span className="text-3xl">🏗️</span>
                    <p className="text-sm font-bold mt-2">No projects match the selected criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query</p>
                    <button
                      onClick={() => {
                        setStatusFilter("ALL");
                        setSearchQuery("");
                      }}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                    >
                      Show All Projects
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const scheduleColor =
                    project.scheduleStatus === "Ahead"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300"
                      : project.scheduleStatus === "Delayed"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";

                  const budgetUtilization =
                    project.plannedBudget > 0
                      ? Math.round((project.actualExpenditure / project.plannedBudget) * 100)
                      : 0;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Project Name and Location */}
                      <td className="px-4 py-4">
                        <div>
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-left"
                          >
                            {project.projectName}
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                              {project.projectCode}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[200px]">
                              <span>📍</span> {project.location}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Site Engineer */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {project.siteEngineer?.avatar || "SE"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {project.siteEngineer?.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {project.siteEngineer?.role || "Site Engineer"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Completion % with Progress Bar */}
                      <td className="px-4 py-4 whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-900 dark:text-white">{project.completionPercent}%</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Done</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              project.completionPercent === 100
                                ? "bg-purple-600"
                                : project.completionPercent > 60
                                ? "bg-gradient-to-r from-blue-600 to-emerald-500"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600"
                            }`}
                            style={{ width: `${project.completionPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Start & Expected Completion Dates */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {formatDate(project.startDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>🏁</span> to {formatDate(project.expectedEndDate)}
                        </div>
                      </td>

                      {/* Schedule Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${scheduleColor}`}>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              project.scheduleStatus === "Ahead"
                                ? "bg-cyan-500"
                                : project.scheduleStatus === "Delayed"
                                ? "bg-rose-500 animate-ping"
                                : "bg-emerald-500"
                            }`}
                          />
                          {project.scheduleStatus}
                        </span>
                      </td>

                      {/* Planned Budget vs Actual Expenditure */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatCurrency(project.actualExpenditure)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          of {formatCurrency(project.plannedBudget)} ({budgetUtilization}%)
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedProject(project)}
                          className="px-3 py-1.5 rounded-xl border border-blue-500/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition-all shadow-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          5. GRID: UPCOMING MILESTONES & RECENT PROGRESS REPORTS
      ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Milestones */}
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🎯</span> Upcoming Milestones
            </h2>
            <Link
              to="/project-manager/milestones-tasks"
              className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              All milestones →
            </Link>
          </div>

          <div className="space-y-3.5">
            {(data?.upcomingMilestones || []).map((milestone) => (
              <div
                key={milestone.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/80 border-slate-200/70"
                } hover:border-blue-500/40`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {milestone.milestoneName}
                      </p>
                      {milestone.isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-cyan-400 font-semibold mt-1">
                      {milestone.projectName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Due: <span className="font-semibold">{formatDate(milestone.dueDate)}</span> • In charge: {milestone.assignedEngineer}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      milestone.completionStatus === "Completed"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : milestone.completionStatus === "Behind Schedule"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {milestone.completionStatus}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        milestone.isOverdue ? "bg-rose-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${milestone.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                    {milestone.progressPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Progress Reports */}
        <div
          className={`p-6 rounded-2xl border ${
            isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📑</span> Recent Progress Reports
            </h2>
            <Link
              to="/project-manager/progress-reports"
              className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              View all reports →
            </Link>
          </div>

          <div className="space-y-3.5">
            {(data?.recentProgressReports || []).map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/80 border-slate-200/70"
                } hover:border-blue-500/40`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors">
                      {report.reportTitle}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      {report.projectName} • By <span className="text-blue-600 dark:text-cyan-400">{report.siteEngineer}</span>
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                      report.reviewStatus === "Reviewed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : report.reviewStatus === "Flagged"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {report.reviewStatus}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    📈 {report.reportedProgress}
                  </p>
                  {report.issuesOrDelays && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 line-clamp-2">
                      ⚠️ <span className="font-medium">Issues:</span> {report.issuesOrDelays}
                    </p>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Submitted: {formatDate(report.submissionDate)}</span>
                  <span className="font-semibold text-blue-600 dark:text-cyan-400">
                    View full details & notes →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          6. PENDING MATERIAL REQUESTS (Approve / Reject actions)
      ========================================================= */}
      <div
        id="material-requests-section"
        className={`p-6 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📦</span> Pending Material Requests
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and authorize Site Engineer procurement requisitions according to project budget and urgency.
            </p>
          </div>

          <Link
            to="/project-manager/material-requests"
            className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            All Material Requests →
          </Link>
        </div>

        <div className="space-y-4">
          {(data?.pendingMaterialRequests || []).length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <span className="text-3xl">✓</span>
              <p className="text-sm font-bold mt-2 text-slate-700 dark:text-slate-300">
                All material requisitions have been processed!
              </p>
              <p className="text-xs text-slate-400 mt-0.5">No pending items requiring Project Manager sign-off.</p>
            </div>
          ) : (
            data.pendingMaterialRequests.map((req) => {
              const isPending = req.status === "PENDING";
              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50/70 border-slate-200/80"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                          {req.requestNumber}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {req.projectName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            req.urgency === "Critical"
                              ? "bg-rose-500 text-white animate-pulse"
                              : req.urgency === "High"
                              ? "bg-amber-500 text-white"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {req.urgency} Urgency
                        </span>
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            req.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : req.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {/* Materials List */}
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        🛠️ {req.requestedMaterials}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span>
                          Requester: <strong className="text-slate-700 dark:text-slate-200">{req.requestingEngineer}</strong>
                        </span>
                        <span>•</span>
                        <span>Date: {formatDate(req.requestDate)}</span>
                        <span>•</span>
                        <span>
                          Estimated Value: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(req.totalEstimatedCost)}</strong>
                        </span>
                      </div>

                      {req.justification && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white/50 dark:bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-200/40 dark:border-slate-800/60 mt-1">
                          " {req.justification} "
                        </p>
                      )}
                    </div>

                    {/* Action Buttons for Authorized PM */}
                    {isPending ? (
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => setActionRequest({ request: req, type: "REJECT" })}
                          className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 text-xs font-bold transition-all"
                        >
                          ✕ Reject
                        </button>
                        <button
                          onClick={() => setActionRequest({ request: req, type: "APPROVE" })}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all transform active:scale-95"
                        >
                          ✓ Approve Request
                        </button>
                      </div>
                    ) : (
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-semibold text-slate-400">
                          {req.status === "APPROVED" ? "Approved by PM" : "Rejected by PM"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          7. BUDGET OVERVIEW & COMPARISON CHART
      ========================================================= */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>💰</span> Budget Overview & Expenditure Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparative visualization of allocated project budgets vs actual construction expenditures.
            </p>
          </div>

          <Link
            to="/project-manager/budget-expenses"
            className="text-xs sm:text-sm font-bold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Detailed Ledger & Audit →
          </Link>
        </div>

        {/* 4 Financial Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Total Planned Budget
            </span>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
              {formatCurrency(data?.budgetOverview?.totalPlannedBudget)}
            </p>
            <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1">Approved by Executive Board</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Actual Expenditure
            </span>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
              {formatCurrency(data?.budgetOverview?.actualExpenditure)}
            </p>
            <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70 mt-1">Total verified disbursements</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Remaining Budget
            </span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {formatCurrency(data?.budgetOverview?.remainingBudget)}
            </p>
            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Available for ongoing phases</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Budget Utilization
            </span>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {data?.budgetOverview?.utilizationPercentage}%
            </p>
            <div className="w-full h-1.5 rounded-full bg-amber-200 dark:bg-amber-950 mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full"
                style={{ width: `${Math.min(100, data?.budgetOverview?.utilizationPercentage || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clear Chart Comparing Planned vs Actual Spending */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Project-by-Project Planned vs Actual Spending
            </h3>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-300">Planned Budget</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-500" />
                <span className="text-slate-600 dark:text-slate-300">Actual Expenditure</span>
              </div>
            </div>
          </div>

          {/* SVG / CSS Bar Chart */}
          <div className="space-y-4 pt-2">
            {(data?.budgetOverview?.projectComparisons || []).map((item) => {
              const maxBudget = Math.max(
                ...((data?.budgetOverview?.projectComparisons || []).map((x) => x.plannedBudget) || [1])
              );
              const plannedWidth = Math.max(5, (item.plannedBudget / maxBudget) * 100);
              const actualWidth = Math.max(2, (item.actualExpenditure / maxBudget) * 100);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/60"
                  } hover:border-blue-500/30`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-normal">({item.code})</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Spent: <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(item.actualExpenditure)}</strong> of {formatCurrency(item.plannedBudget)} ({item.utilization}%)
                    </span>
                  </div>

                  {/* Dual Comparison Bars */}
                  <div className="space-y-1.5">
                    {/* Planned Bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase w-14 text-slate-400">Plan</span>
                      <div className="flex-1 h-3 rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700"
                          style={{ width: `${plannedWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Actual Bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase w-14 text-slate-400">Spent</span>
                      <div className="flex-1 h-3 rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-md bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-700"
                          style={{ width: `${actualWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL 1: PROJECT DETAILS
      ========================================================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl border p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#0b172d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏗️</span>
                  <h3 className="text-lg font-bold">{selectedProject.projectName}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 font-bold">
                    {selectedProject.projectCode}
                  </span>
                  <span className="text-xs text-slate-500">📍 {selectedProject.location}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">Status</span>
                <p className="font-bold text-sm text-blue-600 mt-1">{selectedProject.status}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">Schedule</span>
                <p className="font-bold text-sm text-emerald-600 mt-1">{selectedProject.scheduleStatus}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase">Completion</span>
                <p className="font-bold text-sm text-purple-600 mt-1">{selectedProject.completionPercent}%</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase text-slate-400">Assigned Site Engineer</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedProject.siteEngineer?.avatar || "SE"}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedProject.siteEngineer?.fullName}</p>
                  <p className="text-slate-500">{selectedProject.siteEngineer?.email} • {selectedProject.siteEngineer?.phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase text-slate-400">Project Scope & Health</p>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedProject.scope}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-600 font-bold uppercase">Planned Budget</span>
                <p className="font-black text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {formatCurrency(selectedProject.plannedBudget)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-purple-600 font-bold uppercase">Actual Spent</span>
                <p className="font-black text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {formatCurrency(selectedProject.actualExpenditure)}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: PROGRESS REPORT DETAILS
      ========================================================= */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-2xl shadow-2xl border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#0b172d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold">{selectedReport.reportTitle}</h3>
                <p className="text-xs text-blue-600 dark:text-cyan-400 mt-0.5">
                  {selectedReport.projectName} • Submitted by {selectedReport.siteEngineer}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-600 uppercase">Reported Progress</span>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                  {selectedReport.reportedProgress}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold uppercase text-slate-400">Noted Issues or Delays</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {selectedReport.issuesOrDelays || "No delays or technical obstacles recorded."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Weather</span>
                  <p className="font-semibold text-xs mt-0.5">{selectedReport.weatherConditions || "Clear"}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Labor On Site</span>
                  <p className="font-semibold text-xs mt-0.5">{selectedReport.laborCount || "—"} Workers</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Photos</span>
                  <p className="font-semibold text-xs mt-0.5">📸 {selectedReport.photosAttached || 0} Attached</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400">Date: {formatDate(selectedReport.submissionDate)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
                >
                  Close
                </button>
                {selectedReport.reviewStatus !== "Reviewed" && (
                  <button
                    onClick={() => handleReviewReport(selectedReport.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    ✓ Mark as Reviewed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: APPROVE / REJECT MATERIAL REQUEST CONFIRMATION
      ========================================================= */}
      {actionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#0b172d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>{actionRequest.type === "APPROVE" ? "✅" : "🛑"}</span>
                  <span>
                    {actionRequest.type === "APPROVE" ? "Approve Material Request" : "Reject Material Request"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request #{actionRequest.request.requestNumber} • {actionRequest.request.projectName}
                </p>
              </div>
              <button
                onClick={() => setActionRequest(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Materials: {actionRequest.request.requestedMaterials}
                </p>
                <p className="text-slate-500">
                  Estimated Cost: <strong className="text-emerald-600 font-bold">{formatCurrency(actionRequest.request.totalEstimatedCost)}</strong>
                </p>
                <p className="text-slate-500">
                  Requested by: <strong>{actionRequest.request.requestingEngineer}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  {actionRequest.type === "APPROVE" ? "Approval Notes (Optional)" : "Reason for Rejection"}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionRequest.type === "APPROVE"
                      ? "Add delivery conditions, priority instructions, or site storage instructions..."
                      : "State specific grounds: budget cap exceeded, inventory already available, or invalid specs..."
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmRequestAction}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                  actionRequest.type === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                } ${submittingAction ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {submittingAction
                  ? "Processing..."
                  : actionRequest.type === "APPROVE"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
