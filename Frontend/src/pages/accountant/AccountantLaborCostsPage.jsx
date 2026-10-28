import { useState, useEffect, useMemo } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantLaborCostsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Active view tab: "live_costs" | "ledger_sheets"
  const [activeTab, setActiveTab] = useState("live_costs");

  // Shared Filters
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Tab 1: Live Site Attendance & Independent Project Costs (from supervisorApi)
  const [liveRoster, setLiveRoster] = useState([]);
  const [projectSummaries, setProjectSummaries] = useState([]);
  const [liveSummary, setLiveSummary] = useState(null);
  const [sheetStatus, setSheetStatus] = useState("DRAFT");
  const [loadingLive, setLoadingLive] = useState(true);

  // Table filtering within Tab 1
  const [searchWorker, setSearchWorker] = useState("");
  const [projectCardFilter, setProjectCardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Tab 2: Batch Ledger Posting Queue (from accountantApi)
  const [sheets, setSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  // Alerts
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Post modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null); // { projectId, projectName, projectCode, date, amount, workerCount, hours }
  const [postNotes, setPostNotes] = useState("");
  const [customRef, setCustomRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeTab === "live_costs") {
      loadLiveAttendanceCosts();
    } else {
      loadLedgerSheets();
    }
  }, [activeTab, selectedProjectId, date]);

  const loadProjects = async () => {
    try {
      const res = await supervisorApi.getProjects();
      if (res.success) {
        setProjects(Array.isArray(res.data) ? res.data : res.data?.projects || []);
      }
    } catch {
      console.warn("Could not load projects via supervisor endpoint");
    }
  };

  const loadLiveAttendanceCosts = async () => {
    setLoadingLive(true);
    setError("");
    try {
      const res = await supervisorApi.getAttendance(selectedProjectId, date);
      if (res.success && res.data) {
        setLiveRoster(res.data.roster || []);
        setProjectSummaries(res.data.projectSummaries || []);
        setLiveSummary(res.data.summary || null);
        setSheetStatus(res.data.sheetStatus || "DRAFT");
      } else {
        setError(res.error || "Failed to load site attendance and labor costs");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch attendance data");
    } finally {
      setLoadingLive(false);
    }
  };

  const loadLedgerSheets = async () => {
    setLoadingSheets(true);
    setError("");
    try {
      const res = await accountantApi.getEligibleLaborCosts(selectedProjectId);
      if (res.success) {
        setSheets(res.data || []);
      } else {
        setError(res.error || "Failed to load eligible labor cost attendance records");
      }
    } catch {
      setError("Failed to load eligible labor cost attendance records");
    } finally {
      setLoadingSheets(false);
    }
  };

  // Open modal for posting an independent project's calculated daily cost
  const openPostModalFromProjectCard = (proj) => {
    setSelectedTarget({
      projectId: proj.projectId,
      projectName: proj.projectName,
      projectCode: proj.projectCode,
      date: date,
      amount: proj.totalLaborCost || 0,
      workerCount: proj.presentCount || proj.totalWorkers || 0,
      hours: proj.totalOvertimeHours ? `${proj.presentCount * 8}h + ${proj.totalOvertimeHours}h OT` : `${proj.presentCount * 8}h`,
    });

    const dateFormatted = date.replace(/-/g, "");
    setCustomRef(`LAB-${proj.projectCode || "PRJ"}-${dateFormatted}-${Math.floor(100 + Math.random() * 900)}`);
    setPostNotes(`Authorized labor wage disbursement for project "${proj.projectName}" on workdate ${date}. Calculated cost: ${Number(proj.totalLaborCost || 0).toLocaleString()} ETB.`);
    setIsPostModalOpen(true);
  };

  // Open modal from historical ledger sheet
  const openPostModalFromSheet = (sheet) => {
    setSelectedTarget({
      projectId: sheet.projectId || sheet.project?.id,
      projectName: sheet.projectName || sheet.project?.name,
      projectCode: sheet.projectCode || sheet.project?.code,
      date: sheet.date,
      amount: sheet.estimatedCost || sheet.estimatedLaborCost || 0,
      workerCount: sheet.approvedCount || sheet.workerCount || 0,
      hours: `${sheet.totalHours || 0}h + ${sheet.totalOvertime || 0}h OT`,
    });

    const dateFormatted = sheet.date?.replace(/-/g, "") || "";
    setCustomRef(`LAB-${dateFormatted}-${Math.floor(100 + Math.random() * 900)}`);
    setPostNotes(`Authorized labor cost posting for ${sheet.project?.name || "Project"} workdate ${sheet.date}.`);
    setIsPostModalOpen(true);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTarget) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await accountantApi.postLaborCost({
        projectId: selectedTarget.projectId,
        date: selectedTarget.date,
        customExpenseRef: customRef,
        notes: postNotes,
      });

      if (res.success) {
        setSuccessMsg(`Labor cost of ${Number(res.data?.expense?.amount || selectedTarget.amount).toLocaleString()} ETB successfully posted under reference ${res.data?.expense?.expenseRef || customRef}.`);
        setIsPostModalOpen(false);
        setSelectedTarget(null);
        if (activeTab === "live_costs") {
          loadLiveAttendanceCosts();
        } else {
          loadLedgerSheets();
        }
      } else {
        setError(res.error || "Failed to post labor cost transaction");
      }
    } catch {
      setError("Failed to post labor cost transaction");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered live roster
  const filteredRoster = useMemo(() => {
    return liveRoster.filter((item) => {
      const name = item.fullName || "";
      const code = item.employeeCode || "";
      const trade = item.trade || "";
      const projName = item.projectName || "";
      const query = searchWorker.toLowerCase();

      const matchesSearch =
        !searchWorker ||
        name.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        trade.toLowerCase().includes(query) ||
        projName.toLowerCase().includes(query);

      const matchesProject = projectCardFilter === "all" || item.projectId === projectCardFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [liveRoster, searchWorker, projectCardFilter, statusFilter]);

  // Export CSV for independent project costs
  const exportProjectCostsCSV = () => {
    if (!projectSummaries || projectSummaries.length === 0) return;

    const headers = [
      "Project Name",
      "Project Code",
      "Site Supervisor",
      "Total Workers",
      "Present Workers",
      "Attendance Rate (%)",
      "Overtime Hours",
      "Regular Labor Cost (ETB)",
      "Overtime Labor Cost (ETB)",
      "Total Project Labor Cost (ETB)",
      "Sheet Status",
    ];

    const rows = projectSummaries.map((p) => [
      `"${p.projectName}"`,
      p.projectCode || "",
      `"${p.supervisorName || ""}"`,
      p.totalWorkers,
      p.presentCount,
      p.attendanceRate,
      p.totalOvertimeHours,
      p.regularLaborCost || 0,
      p.overtimeLaborCost || 0,
      p.totalLaborCost || 0,
      p.sheetStatus,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `independent_project_labor_costs_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export worker-level wages CSV
  const exportWorkerWagesCSV = () => {
    if (!liveRoster || liveRoster.length === 0) return;

    const headers = [
      "Worker Code",
      "Full Name",
      "Trade",
      "Project Site",
      "Supervisor",
      "Status",
      "Shift Times",
      "Work Hours",
      "Overtime Hours",
      "Base Daily Rate (ETB)",
      "Regular Pay (ETB)",
      "Overtime Pay (ETB)",
      "Total Calculated Cost (ETB)",
    ];

    const rows = liveRoster.map((r) => [
      r.employeeCode,
      `"${r.fullName}"`,
      r.trade,
      `"${r.projectName}"`,
      `"${r.supervisorName || ""}"`,
      r.status,
      r.checkInTime && r.checkOutTime ? `${r.checkInTime} - ${r.checkOutTime}` : "",
      r.workHours || 0,
      r.overtimeHours || 0,
      r.baseDailyRate || r.dailyRate || 0,
      r.regularCost || 0,
      r.overtimeCost || 0,
      r.calculatedCost || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `worker_wages_breakdown_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? "bg-slate-900/90 border-slate-800"
          : "bg-gradient-to-r from-cyan-50 via-indigo-50/30 to-white border-cyan-100 shadow-xs"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h1 className="text-2xl font-bold tracking-tight">Project Labor Costs & Site Attendance Hub</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                Supervisor Endpoint Sync
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live site attendance collected by Site Supervisors across all projects with independent, project-specific labor cost calculations.
            </p>
          </div>

          {/* Global Controls: Site & Date Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-cyan-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800 shadow-2xs"
                }`}
              >
                <option value="all">🌐 All Projects & Sites</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📍 {p.projectName} ({p.projectCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Work Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-cyan-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800 shadow-2xs"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Navigation View Toggles */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("live_costs")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "live_costs"
                ? "bg-cyan-600 text-white shadow-xs"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>📊</span> Independent Project Costs & Live Attendance
          </button>
          <button
            onClick={() => setActiveTab("ledger_sheets")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "ledger_sheets"
                ? "bg-cyan-600 text-white shadow-xs"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>📜</span> Ledger Posting Queue ({sheets.length})
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="font-semibold text-xs ml-4 hover:opacity-75">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="font-semibold text-xs ml-4 hover:opacity-75">✕</button>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 1: INDEPENDENT PROJECT COSTS & LIVE SITE ATTENDANCE        */}
      {/* ============================================================= */}
      {activeTab === "live_costs" && (
        <div className="space-y-6">
          {/* Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                <span>Total Labor Outlay</span>
                <span>💵</span>
              </div>
              <p className="text-xl font-extrabold mt-1 text-cyan-600 dark:text-cyan-400">
                {Number(liveSummary?.totalLaborCost || 0).toLocaleString()} <span className="text-xs font-normal">ETB</span>
              </p>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Reg: {Number(liveSummary?.regularLaborCost || 0).toLocaleString()} • OT: {Number(liveSummary?.overtimeLaborCost || 0).toLocaleString()}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                <span>Active Workforce</span>
                <span>👥</span>
              </div>
              <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">
                {liveSummary?.totalWorkers || 0}
              </p>
              <div className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                {liveSummary?.presentCount || 0} workers on site today
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                <span>Attendance Rate</span>
                <span>📈</span>
              </div>
              <p className="text-xl font-bold mt-1 text-teal-500">
                {liveSummary?.attendanceRate || 0}%
              </p>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Absences: {liveSummary?.absentCount || 0} • Leaves: {liveSummary?.leaveCount || 0}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                <span>Total Overtime</span>
                <span>⏱️</span>
              </div>
              <p className="text-xl font-bold mt-1 text-amber-500">
                {liveSummary?.totalOvertimeHours || 0} <span className="text-xs font-normal">hrs</span>
              </p>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Overtime compensation calculated
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-[11px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                <span>Reporting Projects</span>
                <span>📍</span>
              </div>
              <p className="text-xl font-bold mt-1 text-indigo-500">
                {projectSummaries.length}
              </p>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Independent project cost accounts
              </div>
            </div>
          </div>

          {/* Section: Independent Project Labor Cost Breakdown */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span>🏗️</span> Independent Labor Cost per Construction Project
                </h2>
                <p className="text-xs text-slate-400">
                  Each project's attendance is verified and financial outlay calculated independently based on worker daily rates and overtime.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadLiveAttendanceCosts}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                    isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>🔄</span> Refresh
                </button>
                <button
                  onClick={exportProjectCostsCSV}
                  disabled={projectSummaries.length === 0}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                    isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>📥</span> Export Project Costs CSV
                </button>
              </div>
            </div>

            {/* Project Cards Grid */}
            {loadingLive ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Calculating independent project labor costs...
              </div>
            ) : projectSummaries.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
                <p className="text-sm text-slate-400">No active projects found for date {date}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projectSummaries.map((p) => {
                  const isFiltered = projectCardFilter === p.projectId;
                  return (
                    <div
                      key={p.projectId}
                      className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isFiltered
                          ? "ring-2 ring-cyan-500 border-cyan-500 bg-cyan-500/5"
                          : isDark
                          ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                          : "bg-white border-slate-200 shadow-xs hover:shadow-md"
                      }`}
                    >
                      <div>
                        {/* Top Badge & Project Code */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {p.projectCode || "PRJ"}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 truncate" title={p.projectName}>
                              {p.projectName}
                            </h3>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            p.sheetStatus === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : p.sheetStatus === "SUBMITTED"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {p.sheetStatus}
                          </span>
                        </div>

                        {/* Supervisor info */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <span>👷‍♂️ Supervisor:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {p.supervisorName || "Assigned"}
                          </span>
                        </div>

                        {/* Independent Cost Highlight */}
                        <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                            Independent Project Cost
                          </div>
                          <div className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300 font-mono mt-0.5">
                            {Number(p.totalLaborCost || 0).toLocaleString()} <span className="text-xs font-normal">ETB</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-cyan-500/20">
                            <span>Regular: {Number(p.regularLaborCost || 0).toLocaleString()} ETB</span>
                            <span>OT: {Number(p.overtimeLaborCost || 0).toLocaleString()} ETB</span>
                          </div>
                        </div>

                        {/* Attendance Statistics Strip */}
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                          <div className={`p-2 rounded-lg border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Workers</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {p.presentCount}/{p.totalWorkers}
                            </span>
                          </div>
                          <div className={`p-2 rounded-lg border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rate</span>
                            <span className="font-bold text-teal-500">{p.attendanceRate}%</span>
                          </div>
                          <div className={`p-2 rounded-lg border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Overtime</span>
                            <span className="font-bold text-amber-500">{p.totalOvertimeHours}h</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setProjectCardFilter(projectCardFilter === p.projectId ? "all" : p.projectId)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                            isFiltered
                              ? "bg-cyan-600 text-white border-cyan-600"
                              : isDark
                              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isFiltered ? "✕ Clear Filter" : "🔍 View Roster"}
                        </button>

                        <button
                          onClick={() => openPostModalFromProjectCard(p)}
                          disabled={!p.totalLaborCost || p.totalLaborCost <= 0}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Authorize and post this project's labor cost to the expense ledger"
                        >
                          <span>💳</span> Post to Ledger
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Worker-Level Attendance & Wage Roster */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>📋</span> Detailed Site Attendance & Worker Wages
                  {projectCardFilter !== "all" && (
                    <span className="text-xs font-normal text-cyan-600 dark:text-cyan-400">
                      (Filtered for: {projectSummaries.find((p) => p.projectId === projectCardFilter)?.projectName || "Selected Project"})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Individual timesheet entries collected on site with calculated daily wages.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search worker, trade, site..."
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  className={`w-48 sm:w-56 px-3 py-1.5 rounded-xl text-xs border focus:ring-1 focus:ring-cyan-500 ${
                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400"
                  }`}
                />

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="PRESENT">🟢 Present</option>
                  <option value="LATE">🟠 Late</option>
                  <option value="HALF_DAY">🟡 Half-Day</option>
                  <option value="ABSENT">🔴 Absent</option>
                  <option value="ON_LEAVE">🔵 On Leave</option>
                </select>

                <button
                  onClick={exportWorkerWagesCSV}
                  disabled={liveRoster.length === 0}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  📥 Export Wages CSV
                </button>
              </div>
            </div>

            {/* Roster Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className={`text-[11px] uppercase tracking-wider border-b ${
                    isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
                  }`}>
                    <tr>
                      <th className="px-3 py-3">Worker</th>
                      <th className="px-3 py-3">Project Site & Supervisor</th>
                      <th className="px-3 py-3">Trade / Team</th>
                      <th className="px-3 py-3 text-center">Site Status</th>
                      <th className="px-3 py-3 text-center">Shift Times</th>
                      <th className="px-2 py-3 text-center">Hours</th>
                      <th className="px-2 py-3 text-center">OT Hours</th>
                      <th className="px-3 py-3 text-right">Base Daily Rate</th>
                      <th className="px-3 py-3 text-right">Calculated Cost</th>
                      <th className="px-2 py-3 text-center">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingLive ? (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400">
                          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                          Loading worker timesheets...
                        </td>
                      </tr>
                    ) : filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400">
                          No workers matching selected filters found.
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((item, idx) => (
                        <tr
                          key={item.id || item.employeeId || idx}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Worker */}
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {item.fullName}
                            </div>
                            <div className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                              {item.employeeCode} • {item.employmentType?.replace(/_/g, " ") || "REGULAR"}
                            </div>
                          </td>

                          {/* Project */}
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              📍 {item.projectName}
                            </div>
                            <div className="text-slate-400 text-[10px] truncate">
                              👷‍♂️ {item.supervisorName || "Supervisor"}
                            </div>
                          </td>

                          {/* Trade */}
                          <td className="px-3 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.trade?.replace(/_/g, " ")}
                            </span>
                            <div className="text-slate-400 text-[10px] mt-0.5">
                              {item.workTeam || "Main Team"}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : item.status === "ABSENT"
                                ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                : item.status === "HALF_DAY"
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : item.status === "LATE"
                                ? "bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                                : "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          {/* Times */}
                          <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {item.checkInTime && item.checkOutTime ? `${item.checkInTime} - ${item.checkOutTime}` : "—"}
                          </td>

                          {/* Hours */}
                          <td className="px-2 py-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                            {Number(item.workHours) > 0 ? `${item.workHours}h` : "0h"}
                          </td>

                          {/* OT */}
                          <td className="px-2 py-2.5 text-center">
                            {Number(item.overtimeHours) > 0 ? (
                              <span className="font-bold text-amber-500 text-[11px]">+{item.overtimeHours}h</span>
                            ) : (
                              <span className="text-slate-400">0h</span>
                            )}
                          </td>

                          {/* Base Daily Rate */}
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                            {Number(item.baseDailyRate || item.dailyRate || 0).toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span>
                          </td>

                          {/* Calculated Cost */}
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400">
                            {Number(item.calculatedCost || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                          </td>

                          {/* Approval Status */}
                          <td className="px-2 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.approvalStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : item.approvalStatus === "SUBMITTED"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {item.approvalStatus || "DRAFT"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: POSTED & ELIGIBLE LEDGER SHEETS (ACCOUNTING BATCH QUEUE)*/}
      {/* ============================================================= */}
      {activeTab === "ledger_sheets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>📜</span> Verified Daily Sheets Awaiting Financial Ledger Posting
              </h2>
              <p className="text-xs text-slate-400">
                Attendance days submitted by Site Supervisors and approved by HR ready for financial expense ledger posting.
              </p>
            </div>
            <button
              onClick={loadLedgerSheets}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>🔄</span> Refresh Queue
            </button>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-semibold ${
                    isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                    <th className="p-4">Work Date</th>
                    <th className="p-4">Project Site</th>
                    <th className="p-4">Workers Approved</th>
                    <th className="p-4">Hours (Reg + OT)</th>
                    <th className="p-4">Calculated Cost</th>
                    <th className="p-4">Ledger Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loadingSheets ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Loading attendance & wage data...
                      </td>
                    </tr>
                  ) : sheets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No attendance sheets awaiting review. When site supervisors collect daily attendance and submit it, sheets will appear here for wage verification and financial posting.
                      </td>
                    </tr>
                  ) : (
                    sheets.map((sheet, idx) => (
                      <tr key={`${sheet.projectId}-${sheet.date}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="p-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {sheet.date}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {sheet.project?.name || sheet.projectName || "Project"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Code: {sheet.project?.code || sheet.projectCode || "PRJ"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{sheet.approvedCount}</span>
                            <span className="text-[10px] text-slate-400">/ {sheet.workerCount} workers</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          <span>{sheet.totalHours || 0}h regular</span>
                          {sheet.totalOvertime > 0 && (
                            <span className="text-amber-500 font-semibold ml-1">
                              +{sheet.totalOvertime}h OT
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          {Number(sheet.estimatedCost || sheet.estimatedLaborCost || 0).toLocaleString()}{" "}
                          <span className="text-[10px] font-normal text-slate-400">ETB</span>
                        </td>
                        <td className="p-4">
                          {sheet.isPosted ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                ✓ Posted
                              </span>
                              {sheet.alreadyPostedExpenseRef && (
                                <div className="font-mono text-[10px] text-slate-400">
                                  Ref: {sheet.alreadyPostedExpenseRef}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Pending Posting
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {sheet.isPosted ? (
                            <span className="text-xs text-slate-400 italic">Financial ledger synced</span>
                          ) : (
                            <button
                              onClick={() => openPostModalFromSheet(sheet)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition"
                            >
                              Authorize & Post
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Authorize & Post Modal */}
      {isPostModalOpen && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
            isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h2 className="text-lg font-bold">Authorize Project Labor Posting</h2>
            <p className="text-xs text-slate-500 mt-1">
              Creates an approved Project Expense under category "LABOR", linking all verified attendance records to eliminate duplicate disbursements.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Project Site:</span>
                <span className="font-semibold">{selectedTarget.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attendance Work Date:</span>
                <span className="font-mono font-semibold">{selectedTarget.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified Workers on Site:</span>
                <span className="font-semibold">{selectedTarget.workerCount} workers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hours Recorded:</span>
                <span className="font-mono">{selectedTarget.hours}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300">Independent Calculated Outlay:</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {Number(selectedTarget.amount).toLocaleString()} ETB
                </span>
              </div>
            </div>

            <form onSubmit={handlePostSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ledger Expense Reference</label>
                <input
                  type="text"
                  value={customRef}
                  onChange={(e) => setCustomRef(e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-sm font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Authorization Remark</label>
                <textarea
                  rows={2}
                  value={postNotes}
                  onChange={(e) => setPostNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs transition"
                >
                  {submitting ? "Posting..." : "Confirm & Post to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
