import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { projectsApi } from "../../services/projectsApi.js";
import { usersApi } from "../../services/usersApi.js";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function ProjectsPage({ defaultOpenCreate = false }) {
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Data states
  const [projects, setProjects] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    inProgress: 0,
    completed: 0,
    unassigned: 0,
    planned: 0,
    onHold: 0,
    cancelled: 0,
  });

  // UI & loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(defaultOpenCreate);
  const [viewingProject, setViewingProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [assigningProject, setAssigningProject] = useState(null);
  const [archivingProject, setArchivingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "",
    currency: "ETB",
    status: "PLANNED",
    projectManagerId: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [assignManagerId, setAssignManagerId] = useState("");

  // Status configuration with theme badges
  const STATUS_CONFIG = {
    PLANNED: {
      labelKey: "status_PLANNED",
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      dotClass: "bg-blue-500",
      icon: "📋",
    },
    IN_PROGRESS: {
      labelKey: "status_IN_PROGRESS",
      badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dotClass: "bg-emerald-500 animate-pulse",
      icon: "⚡",
    },
    ON_HOLD: {
      labelKey: "status_ON_HOLD",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dotClass: "bg-amber-500",
      icon: "⏸️",
    },
    COMPLETED: {
      labelKey: "status_COMPLETED",
      badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      dotClass: "bg-purple-500",
      icon: "✅",
    },
    CANCELLED: {
      labelKey: "status_CANCELLED",
      badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      dotClass: "bg-rose-500",
      icon: "🛑",
    },
  };

  useEffect(() => {
    fetchProjectManagers();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [page, limit, search, statusFilter, managerFilter, startDateFrom, startDateTo, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
        search,
        status: statusFilter,
        managerId: managerFilter,
        startDateFrom,
        startDateTo,
        sortBy,
        sortOrder,
      };

      const result = await projectsApi.getProjects(params);

      if (result.success && result.data) {
        setProjects(result.data.projects || []);
        setTotal(result.data.total || 0);
        if (result.data.metrics) {
          setMetrics(result.data.metrics);
        }
      } else {
        setError(result.error || "Unable to fetch projects");
      }
    } catch (err) {
      setError("Failed to communicate with project service.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProjectManagers = async () => {
    try {
      const res = await usersApi.getProjectManagers();
      if (res.success) {
        setProjectManagers(res.data || []);
      }
    } catch (err) {
      console.warn("Could not load project managers list");
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setManagerFilter("");
    setStartDateFrom("");
    setStartDateTo("");
    setPage(1);
  };

  // Open Create Modal
  const openCreateModal = async () => {
    setFormErrors({});
    let generatedCode = "";
    try {
      const res = await projectsApi.getNextProjectCode();
      if (res.success && res.data?.nextCode) {
        generatedCode = res.data.nextCode;
      }
    } catch {
      generatedCode = `BM-PRJ-${Date.now().toString().slice(-4)}`;
    }

    setFormData({
      projectName: "",
      projectCode: generatedCode,
      location: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      budget: "",
      currency: "ETB",
      status: "PLANNED",
      projectManagerId: "",
    });
    setEditingProject(null);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const openEditModal = (project) => {
    setFormErrors({});
    setEditingProject(project);
    setFormData({
      projectName: project.projectName || "",
      projectCode: project.projectCode || "",
      location: project.location || "",
      description: project.description || "",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
      budget: project.budget !== undefined ? project.budget.toString() : "",
      currency: project.currency || "ETB",
      status: project.status || "PLANNED",
      projectManagerId: project.projectManagerId || "",
    });
    setShowCreateModal(true);
  };

  // Open Quick Assign Modal
  const openAssignModal = (project) => {
    setAssigningProject(project);
    setAssignManagerId(project.projectManagerId || "");
  };

  const handleQuickAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigningProject) return;

    setFormSubmitting(true);
    try {
      const res = await projectsApi.assignManager(assigningProject.id, assignManagerId || null);
      if (res.success) {
        setSuccessMessage("Project manager assignment updated successfully.");
        setAssigningProject(null);
        fetchProjects();
      } else {
        setError(res.error || "Failed to assign project manager.");
      }
    } catch (err) {
      setError("An unexpected error occurred during assignment.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.projectName.trim()) errs.projectName = "Project name is required.";
    if (!formData.projectCode.trim()) errs.projectCode = "Project code is required.";
    if (!formData.location.trim()) errs.location = "Site location is required.";
    if (!formData.startDate) errs.startDate = "Planned start date is required.";
    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errs.endDate = "End date must be on or after the start date.";
    }
    if (!formData.budget || isNaN(parseFloat(formData.budget)) || parseFloat(formData.budget) < 0) {
      errs.budget = "Please enter a valid non-negative budget amount.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Create or Edit Submit
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget),
        projectManagerId: formData.projectManagerId || null,
      };

      let res;
      if (editingProject) {
        res = await projectsApi.updateProject(editingProject.id, payload);
      } else {
        res = await projectsApi.createProject(payload);
      }

      if (res.success) {
        setSuccessMessage(editingProject ? "Project updated successfully!" : "Project created successfully!");
        setShowCreateModal(false);
        setEditingProject(null);
        fetchProjects();
      } else {
        setError(res.error || "Failed to save project.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving project.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Archive
  const handleArchiveConfirm = async () => {
    if (!archivingProject) return;
    try {
      const res = await projectsApi.archiveProject(archivingProject.id);
      if (res.success) {
        setSuccessMessage(`Project "${archivingProject.projectName}" archived successfully.`);
        setArchivingProject(null);
        fetchProjects();
      } else {
        setError(res.error || "Failed to archive project.");
      }
    } catch {
      setError("An unexpected error occurred while archiving project.");
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      const res = await projectsApi.deleteProject(deletingProject.id);
      if (res.success) {
        setSuccessMessage(`Project "${deletingProject.projectName}" deleted successfully.`);
        setDeletingProject(null);
        fetchProjects();
      } else {
        setError(res.error || "Failed to delete project.");
      }
    } catch {
      setError("An unexpected error occurred while deleting project.");
    }
  };

  // Sort handler
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ========================================================
          1. HEADER AREA: TITLE, SUBTITLE & ACTION BUTTONS
      ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t("projectsTitle")}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
              {total} {t("projectsWord")}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("projectsSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            className={`p-2.5 rounded-xl border transition-all duration-150 ${
              isDark
                ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs"
            }`}
            title={t("refreshBtn")}
          >
            <span className={`inline-block ${refreshing ? "animate-spin" : ""}`}>🔄</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all transform active:scale-95"
          >
            <span className="text-base leading-none">➕</span>
            <span>{t("createProjectBtn")}</span>
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-600 dark:text-emerald-400 text-base">✓</span>
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 text-lg leading-none p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-red-600 text-base">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-600 hover:text-red-800 text-lg leading-none p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================
          2. SUMMARY STATISTIC CARDS (REAL DATABASE COUNTS)
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Projects */}
        <div
          onClick={() => { setStatusFilter(""); setManagerFilter(""); setPage(1); }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/50"
              : "bg-white border-slate-200/80 hover:border-blue-300 shadow-xs"
          } ${statusFilter === "" && managerFilter === "" ? "ring-2 ring-blue-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("totalProjects")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold text-base">
              📊
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight">{metrics.totalProjects}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("countFromDb")}</span>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div
          onClick={() => { setStatusFilter("IN_PROGRESS"); setManagerFilter(""); setPage(1); }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-emerald-500/50"
              : "bg-white border-slate-200/80 hover:border-emerald-300 shadow-xs"
          } ${statusFilter === "IN_PROGRESS" ? "ring-2 ring-emerald-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("inProgress")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              ⚡
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("activeConstruction")}</span>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div
          onClick={() => { setStatusFilter("COMPLETED"); setManagerFilter(""); setPage(1); }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-purple-500/50"
              : "bg-white border-slate-200/80 hover:border-purple-300 shadow-xs"
          } ${statusFilter === "COMPLETED" ? "ring-2 ring-purple-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {t("completed")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base">
              ✅
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-purple-600 dark:text-purple-400">
              {metrics.completed}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("completedProjects")}</span>
          </div>
        </div>

        {/* Card 4: Unassigned */}
        <div
          onClick={() => { setManagerFilter("unassigned"); setStatusFilter(""); setPage(1); }}
          className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isDark
              ? "bg-[#0d1c33] border-slate-800 hover:border-amber-500/50"
              : "bg-white border-slate-200/80 hover:border-amber-300 shadow-xs"
          } ${managerFilter === "unassigned" ? "ring-2 ring-amber-500" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t("unassigned")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-base">
              👤
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              {metrics.unassigned}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("noProjectManager")}</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. SEARCH AND FILTERS SECTION
      ========================================================= */}
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("filtersLabel")}
          </h3>
          {(search || statusFilter || managerFilter || startDateFrom || startDateTo) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>✕</span> {t("clearFilters")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                  ? "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                  ? "bg-slate-900/80 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            >
              <option value="">{t("allStatus")}</option>
              <option value="PLANNED">📋 {t("status_PLANNED")}</option>
              <option value="IN_PROGRESS">⚡ {t("status_IN_PROGRESS")}</option>
              <option value="ON_HOLD">⏸️ {t("status_ON_HOLD")}</option>
              <option value="COMPLETED">✅ {t("status_COMPLETED")}</option>
              <option value="CANCELLED">🛑 {t("status_CANCELLED")}</option>
            </select>
          </div>

          {/* Project Manager Filter */}
          <div>
            <select
              value={managerFilter}
              onChange={(e) => {
                setManagerFilter(e.target.value);
                setPage(1);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                  ? "bg-slate-900/80 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            >
              <option value="">{t("allManagers")}</option>
              <option value="unassigned">⚠️ {t("unassigned")}</option>
              {projectManagers.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  👤 {pm.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start (From) */}
          <div className="flex gap-2">
            <input
              type="date"
              placeholder={t("startDateFrom")}
              value={startDateFrom}
              onChange={(e) => {
                setStartDateFrom(e.target.value);
                setPage(1);
              }}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                  ? "bg-slate-900/80 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
              title={t("startDateFrom")}
            />
            <input
              type="date"
              placeholder={t("startDateTo")}
              value={startDateTo}
              onChange={(e) => {
                setStartDateTo(e.target.value);
                setPage(1);
              }}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                  ? "bg-slate-900/80 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
              title={t("startDateTo")}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          4. PROJECTS PERSISTED DATABASE TABLE
      ========================================================= */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className={isDark ? "bg-slate-900/80 text-slate-400" : "bg-slate-50/90 text-slate-500"}>
              <tr>
                <th
                  onClick={() => handleSort("projectName")}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("tableProject")}</span>
                    {sortBy === "projectName" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("location")}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("tableLocation")}</span>
                    {sortBy === "location" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("startDate")}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("tableTimeline")}</span>
                    {sortBy === "startDate" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("budget")}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("tableBudget")}</span>
                    {sortBy === "budget" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t("tableStatus")}</span>
                    {sortBy === "status" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                  {t("tableManager")}
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                  {t("tableActions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      <p className="text-sm font-medium">{t("loadingProjects")}</p>
                    </div>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🏗️</span>
                      <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                        {t("noProjectsFound")}
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="mt-2 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                      >
                        + {t("createProjectBtn")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const statusConf = STATUS_CONFIG[project.status] || STATUS_CONFIG.PLANNED;
                  const formattedBudget = `${project.currency || "ETB"} ${parseFloat(project.budget || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  const startDateStr = project.startDate ? new Date(project.startDate).toLocaleDateString() : "—";
                  const endDateStr = project.endDate ? new Date(project.endDate).toLocaleDateString() : "Open";

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Project Name and Code */}
                      <td className="px-6 py-4">
                        <div>
                          <button
                            onClick={() => setViewingProject(project)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors text-left"
                          >
                            {project.projectName}
                          </button>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                              {project.projectCode}
                            </span>
                            {project.description && (
                              <span className="text-xs text-slate-400 truncate max-w-[180px]">
                                · {project.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="text-sm text-red-500">📍</span>
                          <span className="text-xs font-medium">{project.location}</span>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {startDateStr}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          to {endDateStr}
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {formattedBudget}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConf.badgeClass}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusConf.dotClass}`} />
                          <span>{t(statusConf.labelKey)}</span>
                        </span>
                      </td>

                      {/* Manager */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.projectManager ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {project.projectManager.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                              {project.projectManager.fullName}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(project)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                          >
                            <span>⚠️</span>
                            <span>{t("unassigned")}</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setViewingProject(project)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            title={t("viewAction")}
                          >
                            👁️
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                            title={t("editAction")}
                          >
                            ✏️
                          </button>
                          {/* Assign Manager */}
                          <button
                            onClick={() => openAssignModal(project)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                            title={t("assignAction")}
                          >
                            👤
                          </button>
                          {/* Archive */}
                          <button
                            onClick={() => setArchivingProject(project)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                            title={t("archiveAction")}
                          >
                            📦
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeletingProject(project)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title={t("deleteAction")}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div
          className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t("showingResults")}{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {total === 0 ? 0 : (page - 1) * limit + 1}
            </span>{" "}
            {t("to")}{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(page * limit, total)}
            </span>{" "}
            {t("of")}{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span>{" "}
            {t("projectsWord")}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ← {t("previous")}
            </button>
            <span className="text-xs font-bold px-2 py-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t("next")} →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. MODALS & DRAWERS
      ========================================================= */}

      {/* CREATE & EDIT PROJECT MODAL (ORGANIZED IN 4 SECTIONS) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-[#0b172d] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏗️</span>
                <div>
                  <h2 className="text-xl font-bold">
                    {editingProject ? t("editProjectTitle") : t("createProjectTitle")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingProject ? editingProject.projectCode : t("projectsSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingProject(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="mt-6 space-y-7">
              {/* Section 1: Basic Information */}
              <div>
                <h3 className="text-sm font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider mb-3">
                  {t("section1Title")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("projectNameLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Skyline Residency Block B"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                    {formErrors.projectName && <p className="text-xs text-red-500 mt-1">{formErrors.projectName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("projectCodeLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="BM-PRJ-0001"
                      value={formData.projectCode}
                      onChange={(e) => setFormData({ ...formData, projectCode: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm font-mono uppercase dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                    {formErrors.projectCode && <p className="text-xs text-red-500 mt-1">{formErrors.projectCode}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("locationLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Addis Ababa, Bole"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                    {formErrors.location && <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("descriptionLabel")}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Project scope and construction details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Schedule & Status */}
              <div className="border-t pt-5 border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider mb-3">
                  {t("section2Title")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("startDateLabel")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                    {formErrors.startDate && <p className="text-xs text-red-500 mt-1">{formErrors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("endDateLabel")}
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    />
                    {formErrors.endDate && <p className="text-xs text-red-500 mt-1">{formErrors.endDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("initialStatusLabel")}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm font-bold dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    >
                      <option value="PLANNED">{t("status_PLANNED")}</option>
                      <option value="IN_PROGRESS">{t("status_IN_PROGRESS")}</option>
                      <option value="ON_HOLD">{t("status_ON_HOLD")}</option>
                      <option value="COMPLETED">{t("status_COMPLETED")}</option>
                      <option value="CANCELLED">{t("status_CANCELLED")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Budget */}
              <div className="border-t pt-5 border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider mb-3">
                  {t("section3Title")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("budgetLabel")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {formData.currency}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="2500000.00"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full pl-12 pr-4 py-2 rounded-xl border text-sm font-mono font-bold dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                      />
                    </div>
                    {formErrors.budget && <p className="text-xs text-red-500 mt-1">{formErrors.budget}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t("currencyLabel")}
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border text-sm font-bold dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                    >
                      <option value="ETB">ETB (Birr)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Project Manager Assignment */}
              <div className="border-t pt-5 border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider mb-3">
                  {t("section4Title")}
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t("managerFilter")}
                  </label>
                  <select
                    value={formData.projectManagerId}
                    onChange={(e) => setFormData({ ...formData, projectManagerId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                  >
                    <option value="">{t("unassignedOption")}</option>
                    {projectManagers.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        👤 {pm.fullName} ({pm.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">{t("managerHelp")}</p>
                </div>
              </div>

              {/* Modal footer */}
              <div className="border-t pt-5 border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingProject(null); }}
                  className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {formSubmitting ? t("saving") : editingProject ? t("saveChangesBtn") : t("submitCreateBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROJECT DETAILS MODAL / DRAWER */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto ${
              isDark ? "bg-[#0b172d] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-cyan-300 border border-blue-500/30">
                  {viewingProject.projectCode}
                </span>
                <h2 className="text-2xl font-extrabold mt-1.5">{viewingProject.projectName}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <span>📍 {viewingProject.location}</span>
                </p>
              </div>
              <button
                onClick={() => setViewingProject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Status and Budget Banner */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {t("tableStatus")}
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {viewingProject.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    {t("tableBudget")}
                  </span>
                  <div className="mt-1 font-mono text-lg font-black text-slate-900 dark:text-white">
                    {viewingProject.currency || "ETB"} {parseFloat(viewingProject.budget || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {t("tableTimeline")}
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">{t("startDateLabel")}</span>
                    <p className="text-sm font-bold mt-0.5">
                      {viewingProject.startDate ? new Date(viewingProject.startDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">{t("endDateLabel")}</span>
                    <p className="text-sm font-bold mt-0.5">
                      {viewingProject.endDate ? new Date(viewingProject.endDate).toLocaleDateString() : "Open ended"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Manager Details */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {t("tableManager")}
                </h4>
                {viewingProject.projectManager ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                      {viewingProject.projectManager.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{viewingProject.projectManager.fullName}</p>
                      <p className="text-xs text-slate-400">{viewingProject.projectManager.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        const proj = viewingProject;
                        setViewingProject(null);
                        openAssignModal(proj);
                      }}
                      className="ml-auto text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                    >
                      {t("assignAction")}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                      <span>⚠️</span> {t("noProjectManager")}
                    </div>
                    <button
                      onClick={() => {
                        const proj = viewingProject;
                        setViewingProject(null);
                        openAssignModal(proj);
                      }}
                      className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      {t("assignAction")}
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              {viewingProject.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {t("descriptionLabel")}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {viewingProject.description}
                  </p>
                </div>
              )}

              {/* Created By & Timestamps */}
              <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                <span>Created by: {viewingProject.createdBy?.fullName || "General Manager"}</span>
                <span>Created: {new Date(viewingProject.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  const p = viewingProject;
                  setViewingProject(null);
                  openEditModal(p);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                ✏️ {t("editAction")}
              </button>
              <button
                onClick={() => setViewingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t("cancelBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN MANAGER MODAL */}
      {assigningProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${
              isDark ? "bg-[#0b172d] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>👤</span> {t("assignManagerTitle")}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Project: <span className="font-bold text-slate-700 dark:text-slate-200">{assigningProject.projectName}</span> ({assigningProject.projectCode})
            </p>

            <form onSubmit={handleQuickAssignSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  {t("selectManagerPrompt")}
                </label>
                <select
                  value={assignManagerId}
                  onChange={(e) => setAssignManagerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 outline-none"
                >
                  <option value="">{t("unassignedOption")}</option>
                  {projectManagers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      👤 {pm.fullName} ({pm.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningProject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t("cancelBtn")}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                >
                  {formSubmitting ? t("saving") : t("saveChangesBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {archivingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${
              isDark ? "bg-[#0b172d] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3 text-amber-500 text-2xl">
              <span>📦</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("confirmArchiveTitle")}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {t("confirmArchiveMsg")}
            </p>
            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-mono">
              {archivingProject.projectName} ({archivingProject.projectCode})
            </div>
            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setArchivingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t("cancelBtn")}
              </button>
              <button
                onClick={handleArchiveConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm"
              >
                {t("archiveAction")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${
              isDark ? "bg-[#0b172d] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500 text-2xl">
              <span>🗑️</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t("deleteAction")} Project
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {t("confirmDeleteMsg")}
            </p>
            <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs font-mono text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
              {deletingProject.projectName} ({deletingProject.projectCode})
            </div>
            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t("cancelBtn")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm"
              >
                {t("deleteAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
