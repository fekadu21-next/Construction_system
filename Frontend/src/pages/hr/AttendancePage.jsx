import { useState, useEffect, useMemo } from "react";
import { hrApi } from "../../services/hrApi.js";
import { supervisorApi } from "../../services/supervisorApi.js";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_APPROVAL_STATUSES,
  WORKER_TRADES,
  EMPLOYMENT_TYPES,
} from "../../constants/hrConstants.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AttendancePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Active Tab: "entry" | "dashboard" | "history" | "reports"
  const [activeTab, setActiveTab] = useState("entry");

  // Shared state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Tab 1: Daily Site Attendance State (Read-only monitoring of supervisor records)
  const [roster, setRoster] = useState([]);
  const [sheetStatus, setSheetStatus] = useState("DRAFT");
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [projectSummaries, setProjectSummaries] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [searchWorker, setSearchWorker] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Report Issue Modal State (Strictly Read-Only HR: Request Supervisor Review / Report Issue)
  const [reportIssueModal, setReportIssueModal] = useState({
    open: false,
    projectId: "",
    date: "",
    employeeId: "",
    employeeName: "",
    issueType: "MISSING_RECORD",
    description: "",
  });
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Tab 2: Dashboard State
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Tab 3: History State
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [historyFilters, setHistoryFilters] = useState({
    search: "",
    status: "all",
    employmentType: "all",
    startDate: "",
    endDate: "",
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Worker Detail Modal
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [workerDetail, setWorkerDetail] = useState(null);
  const [loadingWorkerDetail, setLoadingWorkerDetail] = useState(false);
  const [approvingWorkerId, setApprovingWorkerId] = useState(null);
  const [approvingAll, setApprovingAll] = useState(false);

  // Tab 4: Reports State
  const [reportData, setReportData] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [loadingReport, setLoadingReport] = useState(false);

  const isHRorGM = ["HR_MANAGER", "GENERAL_MANAGER", "ADMIN"].includes(user?.role);

  // Initial Load Projects using supervisorApi endpoint
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch when tab or relevant filters change
  useEffect(() => {
    if (activeTab === "entry") {
      fetchDailyAttendance();
    } else if (activeTab === "dashboard") {
      fetchDashboardData();
    } else if (activeTab === "history") {
      fetchHistory(1);
    } else if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, date, selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await supervisorApi.getProjects();
      if (res.success) {
        setProjects(Array.isArray(res.data) ? res.data : res.data?.projects || []);
      }
    } catch {
      console.warn("Could not load projects from supervisor endpoint");
    }
  };

  // -------------------------------------------------------------
  // TAB 1: DAILY SITE ATTENDANCE (SUPERVISOR LOGS)
  // -------------------------------------------------------------
  const fetchDailyAttendance = async () => {
    setLoadingRoster(true);
    setErrorMsg("");
    try {
      const res = await supervisorApi.getAttendance(selectedProjectId, date);
      if (res.success && res.data) {
        setRoster(res.data.roster || []);
        setSheetStatus(res.data.sheetStatus || "DRAFT");
        setAttendanceSummary(res.data.summary || null);
        setProjectSummaries(res.data.projectSummaries || []);
      } else {
        setErrorMsg(res.error || "Failed to load site attendance roster");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load attendance records");
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleApproveWorkerDirect = async (workerId, workerName) => {
    if (!workerId) return;
    setApprovingWorkerId(workerId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await hrApi.approveEmployee(workerId);
      if (res.success) {
        setSuccessMsg(`✓ Daily worker "${workerName || ""}" approved and automatically added to the active employee table!`);
        await fetchDailyAttendance();
        if (selectedWorkerId === workerId) {
          openWorkerDetail(workerId);
        }
      } else {
        setErrorMsg(res.error || "Failed to approve daily worker");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to approve daily worker");
    } finally {
      setApprovingWorkerId(null);
    }
  };

  const handleApproveAllPending = async () => {
    const pendingList = roster.filter((r) => r.employeeStatus === "PENDING_APPROVAL");
    if (pendingList.length === 0) return;
    setApprovingAll(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      let approvedCount = 0;
      for (const worker of pendingList) {
        const id = worker.employeeId || worker.id || worker.employee?.id;
        if (id) {
          const res = await hrApi.approveEmployee(id);
          if (res.success) approvedCount++;
        }
      }
      setSuccessMsg(`✓ Successfully approved ${approvedCount} daily worker(s)! Automatically added to active employee workforce table.`);
      await fetchDailyAttendance();
    } catch (err) {
      setErrorMsg(err.message || "Failed to approve all pending daily workers");
    } finally {
      setApprovingAll(false);
    }
  };

  const handleReportIssue = async () => {
    if (!reportIssueModal.description.trim()) {
      setErrorMsg("Please provide an issue description or reason for review.");
      return;
    }
    setSubmittingIssue(true);
    setErrorMsg("");
    try {
      const res = await hrApi.reportAttendanceIssue({
        projectId: reportIssueModal.projectId,
        date: reportIssueModal.date || date,
        employeeId: reportIssueModal.employeeId || null,
        issueType: reportIssueModal.issueType || "ATTENDANCE_MISMATCH",
        description: reportIssueModal.description.trim(),
      });
      if (res.success) {
        setSuccessMsg("✓ Attendance review request sent to Site Supervisor and logged in system audit trail.");
        setReportIssueModal({
          open: false,
          projectId: "",
          date: "",
          employeeId: "",
          employeeName: "",
          issueType: "MISSING_RECORD",
          description: "",
        });
      } else {
        setErrorMsg(res.error || "Failed to submit attendance issue");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit attendance issue");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const exportDailyCSV = () => {
    if (!roster || roster.length === 0) return;

    const headers = [
      "Worker Code",
      "Full Name",
      "Trade",
      "Project Site",
      "Site Supervisor",
      "Status",
      "Check-In",
      "Check-Out",
      "Work Hours",
      "Overtime Hours",
      "Approval Status",
      "Notes",
    ];

    const rows = roster.map((r) => [
      r.employeeCode || r.employee?.employeeCode || "",
      `"${r.fullName || r.employee?.fullName || ""}"`,
      r.trade || r.employee?.trade || "",
      `"${r.projectName || r.employee?.assignedProject?.projectName || ""}"`,
      `"${r.supervisorName || ""}"`,
      r.status,
      r.checkInTime || "",
      r.checkOutTime || "",
      r.workHours || 0,
      r.overtimeHours || 0,
      r.approvalStatus || "DRAFT",
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `site_attendance_${date}_${selectedProjectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const name = item.fullName || item.employee?.fullName || "";
      const code = item.employeeCode || item.employee?.employeeCode || "";
      const trade = item.trade || item.employee?.trade || "";
      const projName = item.projectName || item.employee?.assignedProject?.projectName || "";
      const projCode = item.projectCode || item.employee?.assignedProject?.projectCode || "";

      const query = searchWorker.toLowerCase();
      const matchesSearch =
        !searchWorker ||
        name.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        trade.toLowerCase().includes(query) ||
        projName.toLowerCase().includes(query) ||
        projCode.toLowerCase().includes(query);

      const matchesTrade = tradeFilter === "all" || trade === tradeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesProject = projectFilter === "all" || item.projectId === projectFilter;

      return matchesSearch && matchesTrade && matchesStatus && matchesProject;
    });
  }, [roster, searchWorker, tradeFilter, statusFilter, projectFilter]);

  // Attendance stats for selected date
  const stats = useMemo(() => {
    const exactPresent = roster.filter((r) => r.status === "PRESENT").length;
    const late = roster.filter((r) => r.status === "LATE").length;
    const halfDay = roster.filter((r) => r.status === "HALF_DAY").length;
    const absent = roster.filter((r) => r.status === "ABSENT").length;
    const onLeave = roster.filter((r) => r.status === "ON_LEAVE").length;
    const holiday = roster.filter((r) => r.status === "HOLIDAY").length;
    const restDay = roster.filter((r) => r.status === "REST_DAY").length;
    const totalOT = roster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
    const totalHours = roster.reduce((sum, r) => sum + (Number(r.workHours) || 0), 0);

    const working = roster.filter((r) => !["HOLIDAY", "REST_DAY", "ON_LEAVE"].includes(r.status)).length;
    const effectivePresent = exactPresent + late + halfDay * 0.5;
    const rate = working > 0 ? Math.round((effectivePresent / working) * 100) : 0;

    const loggedCount = roster.filter((r) => r.isLogged).length;
    const missing = Math.max(0, roster.length - loggedCount);

    return {
      present: exactPresent,
      late,
      halfDay,
      absent,
      onLeave,
      holiday,
      restDay,
      missing,
      totalOT: Math.round(totalOT * 10) / 10,
      totalHours: Math.round(totalHours * 10) / 10,
      rate,
      total: roster.length,
      loggedCount,
    };
  }, [roster]);

  // -------------------------------------------------------------
  // TAB 2: ATTENDANCE DASHBOARD
  // -------------------------------------------------------------
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const res = await hrApi.getAttendanceDashboard({ date, projectId: selectedProjectId });
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: ATTENDANCE HISTORY
  // -------------------------------------------------------------
  const fetchHistory = async (page = 1) => {
    setLoadingHistory(true);
    try {
      const res = await hrApi.getAttendanceHistory({
        page,
        limit: historyPagination.limit,
        projectId: selectedProjectId,
        search: historyFilters.search,
        status: historyFilters.status,
        employmentType: historyFilters.employmentType,
        startDate: historyFilters.startDate,
        endDate: historyFilters.endDate,
      });

      if (res.success) {
        setHistoryRecords(res.data?.records || []);
        setHistoryPagination(res.data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("History fetch failed:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // -------------------------------------------------------------
  // WORKER DETAIL MODAL
  // -------------------------------------------------------------
  const openWorkerDetail = async (workerId) => {
    setSelectedWorkerId(workerId);
    setLoadingWorkerDetail(true);
    try {
      const res = await hrApi.getWorkerAttendance(workerId);
      if (res.success) {
        setWorkerDetail(res.data);
      }
    } catch (err) {
      console.error("Failed to load worker attendance detail:", err);
    } finally {
      setLoadingWorkerDetail(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 4: REPORTS & LABOR SUMMARY
  // -------------------------------------------------------------
  const fetchReports = async () => {
    setLoadingReport(true);
    try {
      const res = await hrApi.getAttendanceReports({
        month: reportMonth,
        year: reportYear,
        projectId: selectedProjectId,
      });
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Reports fetch failed:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  const exportReportCSV = () => {
    if (!reportData?.rows || reportData.rows.length === 0) return;

    const headers = [
      "Worker Code",
      "Full Name",
      "Trade",
      "Employment Type",
      "Project Site",
      "Present Days",
      "Late Days",
      "Half Days",
      "Absent Days",
      "Leave Days",
      "Effective Work Days",
      "Total Regular Hours",
      "Total Overtime Hours",
      "Attendance Rate (%)",
    ];

    const rows = reportData.rows.map((r) => [
      r.employeeCode,
      `"${r.fullName}"`,
      r.trade,
      r.employmentType,
      `"${r.assignedProject}"`,
      r.presentDays,
      r.lateDays,
      r.halfDays,
      r.absentDays,
      r.leaveDays,
      r.effectiveDays,
      r.totalWorkHours,
      r.totalOvertimeHours,
      r.attendanceRate,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${reportYear}_${String(reportMonth).padStart(2, "0")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Attendance Management Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time site presence, timesheets, approval workflows, audit trail, and labor cost reports.
          </p>
        </div>

        {/* Global Controls: Project Site & Date Selection */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Site:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-emerald-500 ${
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
            <span className="text-xs font-semibold text-slate-400 uppercase">Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800 shadow-2xs"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "entry", label: "Daily Site Attendance", icon: "📋" },
          { id: "dashboard", label: "Attendance Dashboard", icon: "📊" },
          { id: "history", label: "Attendance History & Logs", icon: "📜" },
          { id: "reports", label: "Monthly Labor Reports", icon: "📑" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-xs"
                : isDark
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="font-semibold text-xs ml-4 hover:opacity-75">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="font-semibold text-xs ml-4 hover:opacity-75">✕</button>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 1: DAILY SITE ATTENDANCE (SUPERVISOR LOGS)                 */}
      {/* ============================================================= */}
      {activeTab === "entry" && (
        <div className="space-y-6">
          {/* Status & Action Control Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-bold text-slate-400">Sheet Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                  sheetStatus === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : sheetStatus === "SUBMITTED"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                    : sheetStatus === "REJECTED"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                }`}>
                  {ATTENDANCE_APPROVAL_STATUSES[sheetStatus]?.label || sheetStatus}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  {selectedProjectId === "all"
                    ? `🌐 All Active Sites (${projects.length} Projects)`
                    : `📍 ${projects.find((p) => p.id === selectedProjectId)?.projectName || "Site"} (Supervisor: ${roster[0]?.supervisorName || "Assigned"})`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                ℹ️ View-only site attendance recorded directly by Site Supervisors using site attendance endpoints.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchDailyAttendance}
                disabled={loadingRoster}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                }`}
                title="Refresh attendance from supervisor endpoint"
              >
                <span>🔄</span> {loadingRoster ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={exportDailyCSV}
                disabled={roster.length === 0}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <span>📥</span> Export CSV
              </button>

              <button
                type="button"
                onClick={() =>
                  setReportIssueModal({
                    open: true,
                    projectId: selectedProjectId !== "all" ? selectedProjectId : projects[0]?.id || "",
                    date,
                    employeeId: "",
                    employeeName: "",
                    issueType: "SUPERVISOR_SUBMISSION_MISSING",
                    description: "",
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Report attendance issue or request site supervisor review without mutating records"
              >
                <span>🚩</span> Report Issue / Request Review
              </button>
            </div>
          </div>


          {/* Pending Daily Workers Alert Banner */}
          {roster.filter((r) => r.employeeStatus === "PENDING_APPROVAL").length > 0 && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              isDark ? "bg-amber-950/30 border-amber-800/60 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">👷‍♂️</span>
                <div>
                  <h4 className="font-bold text-sm">
                    {roster.filter((r) => r.employeeStatus === "PENDING_APPROVAL").length} New Daily Worker(s) Registered on Site Awaiting HR Approval
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    Click &quot;Approve Worker&quot; on any worker row below or &quot;Approve All&quot; to activate and automatically add them to the employee workforce table.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApproveAllPending}
                  disabled={approvingAll}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>✓</span> {approvingAll ? "Approving All..." : `Approve All (${roster.filter((r) => r.employeeStatus === "PENDING_APPROVAL").length})`}
                </button>
              </div>
            </div>
          )}

          {/* KPI Summary Cards (Cleanly formatted in 2 rows of 4 cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Assigned", val: stats.total, color: "text-slate-700 dark:text-slate-200", icon: "👥" },
              { label: "Present", val: stats.present, color: "text-emerald-500", icon: "🟢" },
              { label: "Late", val: stats.late, color: "text-orange-500", icon: "🟠" },
              { label: "Absent", val: stats.absent, color: "text-rose-500", icon: "🔴" },
              { label: "Missing", val: stats.missing, color: "text-amber-500", icon: "❓" },
              { label: "Half-Day", val: stats.halfDay, color: "text-amber-400", icon: "🟡" },
              { label: "On Leave", val: stats.onLeave, color: "text-blue-500", icon: "🔵" },
              { label: "Overtime", val: `${stats.totalOT}h`, color: "text-indigo-500", icon: "⏱️" },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xs"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-slate-400">
                  <span>{kpi.label}</span>
                  <span>{kpi.icon}</span>
                </div>
                <div className={`text-base font-bold mt-1 ${kpi.color}`}>{kpi.val}</div>
              </div>
            ))}
          </div>

          {/* Table Filters Bar */}
          <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search worker, site, trade..."
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  className={`w-48 sm:w-60 pl-7 pr-2.5 py-1 rounded-xl text-xs border focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400"
                  }`}
                />
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">🔍</span>
              </div>

              {/* Project Filter (if all selected) */}
              {selectedProjectId === "all" && (
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName}
                    </option>
                  ))}
                </select>
              )}

              {/* Trade Filter */}
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="all">All Trades</option>
                {WORKER_TRADES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="all">All Statuses</option>
                {ATTENDANCE_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>

              {(searchWorker || tradeFilter !== "all" || statusFilter !== "all" || projectFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchWorker("");
                    setTradeFilter("all");
                    setStatusFilter("all");
                    setProjectFilter("all");
                  }}
                  className="text-xs text-slate-400 hover:text-emerald-500 font-semibold px-2 py-1"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredRoster.length}</span> of {roster.length} workers
            </div>
          </div>

          {/* Roster Table (Read-Only Supervisor Log View) */}
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
                    <th className="px-3 py-3">Project Site / Supervisor</th>
                    <th className="px-3 py-3">Trade & Team</th>
                    <th className="px-3 py-3">Site Status</th>
                    <th className="px-3 py-3 text-center">Shift Times</th>
                    <th className="px-2 py-3 text-center">Hours</th>
                    <th className="px-2 py-3 text-center">Overtime</th>
                    <th className="px-3 py-3">Supervisor Notes</th>
                    <th className="px-2 py-3 text-center">Approval</th>
                    <th className="px-2 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingRoster ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                        Loading site attendance from supervisor endpoint...
                      </td>
                    </tr>
                  ) : filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        No attendance records matching filters found for this date.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((item, idx) => {
                      const workerId = item.employeeId || item.employee?.id;
                      const workerName = item.fullName || item.employee?.fullName || "Worker";
                      const workerCode = item.employeeCode || item.employee?.employeeCode || "N/A";
                      const trade = item.trade || item.employee?.trade || "GENERAL_LABORER";
                      const projectName = item.projectName || item.employee?.assignedProject?.projectName || "Unassigned";
                      const projectCode = item.projectCode || item.employee?.assignedProject?.projectCode || "";
                      const supervisorName = item.supervisorName || "Assigned Supervisor";

                      return (
                        <tr
                          key={item.id || workerId || idx}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Worker Identity */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {workerName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate" title={workerName}>
                                  {workerName}
                                </div>
                                <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1.5 flex-wrap">
                                  <span>{workerCode} • {item.employmentType?.replace(/_/g, " ") || "REGULAR"}</span>
                                  {item.employeeStatus === "PENDING_APPROVAL" && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                      Pending HR
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Trade & Site */}
                          <td className="px-3 py-2.5 text-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={projectName}>
                              📍 {projectName} {projectCode ? `(${projectCode})` : ""}
                            </div>
                            <div className="text-slate-400 text-[10px] truncate flex items-center gap-1 mt-0.5">
                              <span>👷‍♂️</span>
                              <span>{supervisorName}</span>
                            </div>
                          </td>

                          {/* Trade & Team */}
                          <td className="px-3 py-2.5 text-xs">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {trade.replace(/_/g, " ")}
                            </span>
                            <div className="text-slate-400 text-[10px] mt-0.5">
                              {item.workTeam || "Main Team"}
                            </div>
                          </td>

                          {/* Status Badge (Read-Only) */}
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.status === "PRESENT"
                                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : item.status === "ABSENT"
                                ? "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                : item.status === "HALF_DAY"
                                ? "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : item.status === "LATE"
                                ? "bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                                : item.status === "ON_LEAVE"
                                ? "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                                : "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                            }`}>
                              <span>{ATTENDANCE_STATUSES.find((s) => s.value === item.status)?.icon || "●"}</span>
                              <span>{ATTENDANCE_STATUSES.find((s) => s.value === item.status)?.label || item.status}</span>
                            </span>
                          </td>

                          {/* Check-In / Check-Out Times */}
                          <td className="px-3 py-2.5 text-center font-mono text-xs">
                            {item.checkInTime && item.checkOutTime ? (
                              <span className="text-slate-700 dark:text-slate-300">
                                {item.checkInTime} - {item.checkOutTime}
                              </span>
                            ) : item.checkInTime ? (
                              <span className="text-slate-700 dark:text-slate-300">In: {item.checkInTime}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Work Hours */}
                          <td className="px-2 py-2.5 text-center font-bold text-xs text-slate-800 dark:text-slate-200">
                            {Number(item.workHours) > 0 ? `${item.workHours}h` : "0h"}
                          </td>

                          {/* Overtime Hours */}
                          <td className="px-2 py-2.5 text-center">
                            {Number(item.overtimeHours) > 0 ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                +{item.overtimeHours}h OT
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">0h</span>
                            )}
                          </td>

                          {/* Supervisor Notes */}
                          <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={item.notes || ""}>
                            {item.notes ? (
                              <span className="italic">{item.notes}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Approval Status */}
                          <td className="px-2 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.approvalStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : item.approvalStatus === "SUBMITTED"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : item.approvalStatus === "REJECTED"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {item.approvalStatus || "DRAFT"}
                            </span>
                          </td>

                          {/* Action (Worker Details & Approval) */}
                          <td className="px-2 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {item.employeeStatus === "PENDING_APPROVAL" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveWorkerDirect(workerId, workerName);
                                  }}
                                  disabled={approvingWorkerId === workerId}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Approve Daily Worker Registration"
                                >
                                  <span>✓</span> {approvingWorkerId === workerId ? "Approving..." : "Approve Worker"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openWorkerDetail(workerId)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="View Worker Attendance History"
                              >
                                👁️
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReportIssueModal({
                                    open: true,
                                    projectId: item.projectId || (selectedProjectId !== "all" ? selectedProjectId : projects[0]?.id || ""),
                                    date,
                                    employeeId: workerId,
                                    employeeName: workerName,
                                    issueType: "ATTENDANCE_MISMATCH",
                                    description: "",
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Report attendance discrepancy / request review for this worker"
                              >
                                🚩
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
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: ATTENDANCE DASHBOARD                                    */}
      {/* ============================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {loadingDashboard ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading attendance analytics...
            </div>
          ) : (
            <>
              {/* Top Trend & Metrics Strip */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="text-xs font-semibold uppercase text-slate-400">Active Site Workforce</div>
                  <div className="text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">
                    {dashboardData?.kpis?.totalWorkers || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Total registered active workers on site</div>
                </div>

                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="text-xs font-semibold uppercase text-slate-400">Attendance Rate Today</div>
                  <div className="text-3xl font-extrabold mt-1 text-emerald-500">
                    {dashboardData?.kpis?.attendancePercentage || 0}%
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${dashboardData?.kpis?.attendancePercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="text-xs font-semibold uppercase text-slate-400">Presence Breakdown</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-emerald-500">
                      {dashboardData?.kpis?.presentCount || 0}
                    </span>
                    <span className="text-xs text-slate-400">Present</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xl font-bold text-rose-500">
                      {dashboardData?.kpis?.absentCount || 0}
                    </span>
                    <span className="text-xs text-slate-400">Absent</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {dashboardData?.kpis?.onLeaveCount || 0} worker(s) on approved leave
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <div className="text-xs font-semibold uppercase text-slate-400">Overtime Logged</div>
                  <div className="text-3xl font-extrabold mt-1 text-indigo-500">
                    {dashboardData?.kpis?.totalOvertime || 0} <span className="text-sm font-normal text-slate-400">hrs</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {dashboardData?.kpis?.totalWorkHours || 0} total working hours recorded
                  </div>
                </div>
              </div>

              {/* 14-Day Attendance Trend Visualizer */}
              <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold">14-Day Attendance Rate Trend</h3>
                    <p className="text-xs text-slate-500">Daily presence rate tracking across project sites.</p>
                  </div>
                  <div className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Target: ≥ 90%
                  </div>
                </div>

                <div className="flex items-end gap-2 h-44 pt-6 pb-2 overflow-x-auto">
                  {dashboardData?.trend?.map((item, idx) => (
                    <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.rate}%
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md h-full flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all ${
                            item.rate >= 85
                              ? "bg-emerald-500 group-hover:bg-emerald-400"
                              : item.rate >= 70
                              ? "bg-amber-500 group-hover:bg-amber-400"
                              : "bg-rose-500 group-hover:bg-rose-400"
                          }`}
                          style={{ height: `${item.rate || 4}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                        {item.dayName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project-Wise Breakdown & Pending Approvals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Summaries Table */}
                <div className={`lg:col-span-2 p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h3 className="text-base font-bold mb-3">Project Site Attendance Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className={`uppercase border-b text-slate-400 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                        <tr>
                          <th className="py-2.5 px-3">Project Site</th>
                          <th className="py-2.5 px-3">Location</th>
                          <th className="py-2.5 px-3 text-center">Assigned</th>
                          <th className="py-2.5 px-3 text-center">Present</th>
                          <th className="py-2.5 px-3">Attendance Rate</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {dashboardData?.projectSummaries?.map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {proj.projectName}
                              <div className="text-[10px] text-slate-400 font-mono">{proj.projectCode}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{proj.location}</td>
                            <td className="py-3 px-3 text-center font-bold">{proj.assignedWorkers}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-500">{proj.present}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${proj.attendanceRate >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                                    style={{ width: `${proj.attendanceRate}%` }}
                                  />
                                </div>
                                <span className="font-bold">{proj.attendanceRate}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                proj.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : proj.status === "SUBMITTED"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                {proj.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pending Review Queue */}
                <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
                  <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                    <span>Pending Approvals</span>
                    {dashboardData?.pendingApprovals?.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-500 font-bold">
                        {dashboardData.pendingApprovals.length}
                      </span>
                    )}
                  </h3>

                  {dashboardData?.pendingApprovals?.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      <span className="text-2xl block mb-1">🎉</span>
                      All site attendance sheets are up to date and verified!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData?.pendingApprovals?.map((pa, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            isDark ? "bg-slate-800/40 border-slate-700" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-900 dark:text-white">
                              {pa.projectName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              📅 {pa.date} • {pa.count} records submitted
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setDate(pa.date);
                              if (pa.projectId) setSelectedProjectId(pa.projectId);
                              setActiveTab("entry");
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: ATTENDANCE HISTORY & SEARCH                             */}
      {/* ============================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Multi-Criteria Filters */}
          <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Worker Search</label>
                <input
                  type="text"
                  placeholder="Name, ID, or phone..."
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, search: e.target.value }))}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Attendance Status</label>
                <select
                  value={historyFilters.status}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, status: e.target.value }))}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="all">All Statuses</option>
                  {ATTENDANCE_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Employment Type</label>
                <select
                  value={historyFilters.employmentType}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, employmentType: e.target.value }))}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="all">All Employment Types</option>
                  {EMPLOYMENT_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>{et.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">From Date</label>
                <input
                  type="date"
                  value={historyFilters.startDate}
                  onChange={(e) => setHistoryFilters((f) => ({ ...f, startDate: e.target.value }))}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                  }`}
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">To Date</label>
                  <input
                    type="date"
                    value={historyFilters.endDate}
                    onChange={(e) => setHistoryFilters((f) => ({ ...f, endDate: e.target.value }))}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                    }`}
                  />
                </div>
                <button
                  onClick={() => fetchHistory(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Historical Log Table */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`text-xs uppercase tracking-wider border-b ${
                  isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                  <tr>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Worker</th>
                    <th className="px-4 py-3.5">Trade & Site</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Times</th>
                    <th className="px-4 py-3.5">Hours (Reg / OT)</th>
                    <th className="px-4 py-3.5">Approval</th>
                    <th className="px-4 py-3.5">Notes</th>
                    <th className="px-4 py-3.5 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Fetching historical attendance records...
                      </td>
                    </tr>
                  ) : historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-slate-400">
                        No historical attendance records matching criteria.
                      </td>
                    </tr>
                  ) : (
                    historyRecords.map((rec) => {
                      const recDateStr = rec.date ? rec.date.split("T")[0] : "";
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {recDateStr}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {rec.employee?.fullName}
                            </div>
                            <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                              {rec.employee?.employeeCode}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <div className="font-medium capitalize text-slate-700 dark:text-slate-300">
                              {rec.employee?.trade?.replace(/_/g, " ").toLowerCase()}
                            </div>
                            <div className="text-slate-400">{rec.project?.projectName || "Unassigned"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                              rec.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : rec.status === "ABSENT"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                : rec.status === "HALF_DAY"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : rec.status === "LATE"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {rec.checkInTime && rec.checkOutTime ? `${rec.checkInTime} - ${rec.checkOutTime}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            <span>{rec.workHours}h</span>
                            {Number(rec.overtimeHours) > 0 && (
                              <span className="text-amber-500 ml-1.5 font-bold">+{rec.overtimeHours}h OT</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              rec.approvalStatus === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : rec.approvalStatus === "SUBMITTED"
                                ? "bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {rec.approvalStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">
                            {rec.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openWorkerDetail(rec.employee?.id)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500"
                              title="Inspect Worker Attendance"
                            >
                              👁️
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className={`p-4 border-t flex items-center justify-between text-xs ${
              isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-600"
            }`}>
              <div>
                Showing page <span className="font-bold">{historyPagination.page}</span> of{" "}
                <span className="font-bold">{historyPagination.totalPages}</span> ({historyPagination.total} total records)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={historyPagination.page <= 1 || loadingHistory}
                  onClick={() => fetchHistory(historyPagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <button
                  disabled={historyPagination.page >= historyPagination.totalPages || loadingHistory}
                  onClick={() => fetchHistory(historyPagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: REPORTS & LABOR SUMMARY                                 */}
      {/* ============================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Report Filter & Export Bar */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase text-slate-400">Period:</span>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ].map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>

              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                onClick={fetchReports}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Generate Report
              </button>
            </div>

            <button
              onClick={exportReportCSV}
              disabled={!reportData?.rows || reportData.rows.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span>📥</span> Export CSV Report
            </button>
          </div>

          {/* Period Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-xs uppercase text-slate-400 font-semibold">Total Workers Audited</div>
              <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {reportData?.totalWorkers || 0}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-xs uppercase text-slate-400 font-semibold">Total Regular Hours</div>
              <div className="text-2xl font-bold mt-1 text-emerald-500">
                {reportData?.overallSummary?.totalWorkHours || 0} hrs
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-xs uppercase text-slate-400 font-semibold">Total Overtime Hours</div>
              <div className="text-2xl font-bold mt-1 text-amber-500">
                {reportData?.overallSummary?.totalOvertimeHours || 0} hrs
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-2xs"}`}>
              <div className="text-xs uppercase text-slate-400 font-semibold">Average Attendance Rate</div>
              <div className="text-2xl font-bold mt-1 text-teal-500">
                {reportData?.overallSummary?.averageAttendanceRate || 0}%
              </div>
            </div>
          </div>

          {/* Report Matrix Table */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`uppercase tracking-wider border-b ${
                  isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                  <tr>
                    <th className="px-4 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Worker Name</th>
                    <th className="px-4 py-3.5">Trade & Site</th>
                    <th className="px-4 py-3.5 text-center">Present</th>
                    <th className="px-4 py-3.5 text-center">Late</th>
                    <th className="px-4 py-3.5 text-center">Half-Day</th>
                    <th className="px-4 py-3.5 text-center">Absent</th>
                    <th className="px-4 py-3.5 text-center">Effective Days</th>
                    <th className="px-4 py-3.5 text-right">Regular Hrs</th>
                    <th className="px-4 py-3.5 text-right">OT Hrs</th>
                    <th className="px-4 py-3.5 text-right">Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingReport ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Generating labor attendance report...
                      </td>
                    </tr>
                  ) : reportData?.rows?.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16 text-slate-400">
                        No labor attendance data for selected period.
                      </td>
                    </tr>
                  ) : (
                    reportData?.rows?.map((row) => (
                      <tr key={row.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.employeeCode}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {row.fullName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="capitalize">{row.trade.replace(/_/g, " ").toLowerCase()}</div>
                          <div className="text-slate-400 text-[10px]">{row.assignedProject}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-500">{row.presentDays}</td>
                        <td className="px-4 py-3 text-center font-bold text-orange-500">{row.lateDays}</td>
                        <td className="px-4 py-3 text-center font-bold text-amber-500">{row.halfDays}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-500">{row.absentDays}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {row.effectiveDays}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{row.totalWorkHours}h</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-500">
                          {row.totalOvertimeHours > 0 ? `+${row.totalOvertimeHours}h` : "0h"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-teal-500">
                          {row.attendanceRate}%
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

      {/* ============================================================= */}
      {/* REPORT ATTENDANCE ISSUE / REQUEST SUPERVISOR REVIEW MODAL     */}
      {/* ============================================================= */}
      {reportIssueModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl ${
            isDark ? "bg-[#091122] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚩</span>
                <div>
                  <h3 className="text-base font-bold">Report Attendance Issue / Request Review</h3>
                  <p className="text-xs text-slate-400">
                    HR is strictly read-only. This action requests a review from the Site Supervisor without altering raw records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportIssueModal({ ...reportIssueModal, open: false })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Project Site
                  </label>
                  <select
                    value={reportIssueModal.projectId}
                    onChange={(e) => setReportIssueModal({ ...reportIssueModal, projectId: e.target.value })}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-hidden ${
                      isDark ? "bg-[#0c1527] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectName} ({p.projectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={reportIssueModal.date}
                    onChange={(e) => setReportIssueModal({ ...reportIssueModal, date: e.target.value })}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-hidden ${
                      isDark ? "bg-[#0c1527] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Issue Type
                </label>
                <select
                  value={reportIssueModal.issueType}
                  onChange={(e) => setReportIssueModal({ ...reportIssueModal, issueType: e.target.value })}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-hidden ${
                    isDark ? "bg-[#0c1527] border-slate-700 text-white" : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <option value="MISSING_RECORD">Missing Attendance Record</option>
                  <option value="SUPERVISOR_SUBMISSION_MISSING">Site Supervisor Submission Missing</option>
                  <option value="ATTENDANCE_MISMATCH">Check-In / Check-Out Time Mismatch</option>
                  <option value="OVERTIME_DISCREPANCY">Overtime Discrepancy</option>
                  <option value="LEAVE_CONFLICT">Conflict with Approved Leave</option>
                  <option value="OTHER">Other Discrepancy</option>
                </select>
              </div>

              {reportIssueModal.employeeName && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  Target Worker: <strong>{reportIssueModal.employeeName}</strong>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Issue Description &amp; Instructions to Supervisor
                </label>
                <textarea
                  rows={3}
                  value={reportIssueModal.description}
                  onChange={(e) => setReportIssueModal({ ...reportIssueModal, description: e.target.value })}
                  placeholder="Describe the discrepancy, missing roster log, or overtime question for the site supervisor..."
                  className={`w-full p-3 rounded-xl text-xs border outline-hidden ${
                    isDark ? "bg-[#0c1527] border-slate-700 text-white focus:border-amber-500" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReportIssueModal({ ...reportIssueModal, open: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportIssue}
                disabled={submittingIssue || !reportIssueModal.description.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingIssue ? "Logging & Notifying..." : "🚩 Send Request to Supervisor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* WORKER ATTENDANCE DETAIL MODAL                                 */}
      {/* ============================================================= */}
      {selectedWorkerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border shadow-xl ${
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
                  {workerDetail?.worker?.fullName?.charAt(0) || "W"}
                </div>
                <div>
                  <h3 className="text-base font-bold">{workerDetail?.worker?.fullName || "Worker Attendance"}</h3>
                  <div className="text-xs text-slate-400 font-mono">
                    {workerDetail?.worker?.employeeCode} • {workerDetail?.worker?.trade?.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedWorkerId(null);
                  setWorkerDetail(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {workerDetail?.worker?.status === "PENDING_APPROVAL" && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-600 dark:text-amber-300 font-medium">
                  This daily laborer was registered on site by the supervisor and is awaiting HR approval.
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveWorkerDirect(selectedWorkerId, workerDetail.worker.fullName)}
                  disabled={approvingWorkerId === selectedWorkerId}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
                >
                  {approvingWorkerId === selectedWorkerId ? "Approving..." : "✓ Approve Daily Worker"}
                </button>
              </div>
            )}

            {loadingWorkerDetail ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading worker history details...
              </div>
            ) : workerDetail ? (
              <div className="space-y-6 mt-4">
                {/* Worker KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Present Days</div>
                    <div className="text-xl font-bold text-emerald-500 mt-1">{workerDetail.summary.presentDays}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Late Days</div>
                    <div className="text-xl font-bold text-orange-500 mt-1">{workerDetail.summary.lateDays}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Absent Days</div>
                    <div className="text-xl font-bold text-rose-500 mt-1">{workerDetail.summary.absentDays}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Attendance Rate</div>
                    <div className="text-xl font-bold text-teal-500 mt-1">{workerDetail.summary.attendanceRate}%</div>
                  </div>
                </div>

                {/* Individual Logs List */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Shifts & Attendance Logs</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {workerDetail.logs.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No logged attendance shifts found.</p>
                    ) : (
                      workerDetail.logs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            isDark ? "bg-slate-800/40 border-slate-800" : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              📅 {log.date.split("T")[0]} • {log.project?.projectName || "Site"}
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {log.checkInTime && log.checkOutTime ? `${log.checkInTime} - ${log.checkOutTime}` : "No time logged"} • {log.workHours}h work
                              {Number(log.overtimeHours) > 0 && <span className="text-amber-500 font-bold ml-1">+{log.overtimeHours}h OT</span>}
                            </div>
                            {log.notes && <div className="text-slate-500 text-[10px] italic mt-0.5">Note: {log.notes}</div>}
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            log.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : log.status === "ABSENT"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
