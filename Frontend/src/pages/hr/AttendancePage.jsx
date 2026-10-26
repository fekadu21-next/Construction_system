import { useState, useEffect, useMemo, useRef } from "react";
import { hrApi } from "../../services/hrApi.js";
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

  // Tab 1: Daily Entry State
  const [roster, setRoster] = useState([]);
  const [sheetStatus, setSheetStatus] = useState("DRAFT");
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchWorker, setSearchWorker] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Review Modal State (for rejection or approval note)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState("APPROVED");
  const [reviewerNote, setReviewerNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

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

  // Tab 4: Reports State
  const [reportData, setReportData] = useState(null);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [loadingReport, setLoadingReport] = useState(false);

  const isHRorGM = ["HR_MANAGER", "GENERAL_MANAGER"].includes(user?.role);

  // Initial Load Projects
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

  // Warn on browser unload if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchProjects = async () => {
    try {
      const res = await hrApi.getProjects();
      if (res.success) {
        setProjects(res.data?.projects || []);
      }
    } catch {
      console.warn("Could not load projects");
    }
  };

  // -------------------------------------------------------------
  // TAB 1: DAILY ENTRY & WORKFORCE ROSTER
  // -------------------------------------------------------------
  const fetchDailyAttendance = async () => {
    setLoadingRoster(true);
    setErrorMsg("");
    try {
      const res = await hrApi.getAttendance({ date, projectId: selectedProjectId });
      if (res.success) {
        setRoster(res.data?.roster || []);
        setSheetStatus(res.data?.approvalStatus || "DRAFT");
        setHasUnsavedChanges(false);
      } else {
        setErrorMsg(res.error || "Failed to load worker roster");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load attendance records");
    } finally {
      setLoadingRoster(false);
    }
  };

  const updateWorkerField = (employeeId, field, value) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.employee.id !== employeeId) return item;
        const updated = { ...item, [field]: value };

        // Automatically update times/hours when status changes
        if (field === "status") {
          if (value === "PRESENT") {
            if (!updated.checkInTime) updated.checkInTime = "08:00";
            if (!updated.checkOutTime) updated.checkOutTime = "17:00";
            updated.workHours = 8.0;
          } else if (value === "HALF_DAY") {
            if (!updated.checkInTime) updated.checkInTime = "08:00";
            updated.checkOutTime = "12:00";
            updated.workHours = 4.0;
          } else if (value === "LATE") {
            if (!updated.checkInTime) updated.checkInTime = "09:00";
            if (!updated.checkOutTime) updated.checkOutTime = "17:00";
            updated.workHours = 7.5;
          } else if (["ABSENT", "ON_LEAVE", "HOLIDAY", "REST_DAY"].includes(value)) {
            updated.checkInTime = "";
            updated.checkOutTime = "";
            updated.workHours = 0;
            updated.overtimeHours = 0;
          }
        }

        // Automatically calculate workHours if times entered
        if (field === "checkInTime" || field === "checkOutTime") {
          const inT = field === "checkInTime" ? value : item.checkInTime;
          const outT = field === "checkOutTime" ? value : item.checkOutTime;
          if (inT && outT) {
            const [inH, inM] = inT.split(":").map(Number);
            const [outH, outM] = outT.split(":").map(Number);
            if (!isNaN(inH) && !isNaN(outH)) {
              let diff = (outH * 60 + outM) - (inH * 60 + inM);
              if (diff < 0) diff += 24 * 60;
              if (diff >= 300) diff -= 60; // 1-hour lunch break
              updated.workHours = Math.round((diff / 60) * 10) / 10;
            }
          }
        }

        return updated;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status) => {
    setRoster((prev) =>
      prev.map((item) => ({
        ...item,
        status,
        checkInTime: status === "PRESENT" ? "08:00" : status === "HALF_DAY" ? "08:00" : "",
        checkOutTime: status === "PRESENT" ? "17:00" : status === "HALF_DAY" ? "12:00" : "",
        workHours: status === "PRESENT" ? 8 : status === "HALF_DAY" ? 4 : 0,
        overtimeHours: status === "PRESENT" ? item.overtimeHours : 0,
      }))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveAttendance = async (saveAction = "SAVE") => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const records = roster.map((item) => ({
        employeeId: item.employee.id,
        projectId: item.employee.assignedProjectId || (selectedProjectId !== "all" ? selectedProjectId : null),
        status: item.status,
        checkInTime: item.checkInTime || null,
        checkOutTime: item.checkOutTime || null,
        workHours: Number(item.workHours || 0),
        overtimeHours: Number(item.overtimeHours || 0),
        notes: item.notes || null,
      }));

      const res = await hrApi.recordAttendance({
        date,
        projectId: selectedProjectId !== "all" ? selectedProjectId : null,
        records,
        saveAction,
      });

      if (res.success) {
        setSuccessMsg(res.message || `Attendance records saved successfully.`);
        setHasUnsavedChanges(false);
        fetchDailyAttendance();
      } else {
        setErrorMsg(res.error || "Failed to save attendance");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to record site attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSheet = async () => {
    if (hasUnsavedChanges) {
      await handleSaveAttendance("SUBMIT");
      return;
    }

    setSaving(true);
    try {
      const res = await hrApi.submitAttendance({
        date,
        projectId: selectedProjectId !== "all" ? selectedProjectId : null,
      });
      if (res.success) {
        setSuccessMsg(`Attendance sheet for ${date} submitted for review.`);
        fetchDailyAttendance();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReviewSheet = async () => {
    setReviewing(true);
    try {
      const res = await hrApi.reviewAttendance({
        date,
        projectId: selectedProjectId !== "all" ? selectedProjectId : null,
        status: reviewAction,
        reviewerNote,
      });
      if (res.success) {
        setSuccessMsg(`Attendance sheet marked as ${reviewAction.toLowerCase()}.`);
        setReviewModalOpen(false);
        setReviewerNote("");
        fetchDailyAttendance();
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setReviewing(false);
    }
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const matchesSearch =
        !searchWorker ||
        item.employee.fullName.toLowerCase().includes(searchWorker.toLowerCase()) ||
        item.employee.employeeCode.toLowerCase().includes(searchWorker.toLowerCase());

      const matchesTrade = tradeFilter === "all" || item.employee.trade === tradeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesTrade && matchesStatus;
    });
  }, [roster, searchWorker, tradeFilter, statusFilter]);

  // Attendance stats for selected date
  const stats = useMemo(() => {
    const present = roster.filter((r) => r.status === "PRESENT").length;
    const late = roster.filter((r) => r.status === "LATE").length;
    const halfDay = roster.filter((r) => r.status === "HALF_DAY").length;
    const absent = roster.filter((r) => r.status === "ABSENT").length;
    const onLeave = roster.filter((r) => r.status === "ON_LEAVE").length;
    const holiday = roster.filter((r) => r.status === "HOLIDAY").length;
    const restDay = roster.filter((r) => r.status === "REST_DAY").length;
    const totalOT = roster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
    const totalHours = roster.reduce((sum, r) => sum + (Number(r.workHours) || 0), 0);

    const working = roster.filter((r) => !["HOLIDAY", "REST_DAY", "ON_LEAVE"].includes(r.status)).length;
    const effectivePresent = present + late + halfDay * 0.5;
    const rate = working > 0 ? Math.round((effectivePresent / working) * 100) : 0;

    return {
      present,
      late,
      halfDay,
      absent,
      onLeave,
      holiday,
      restDay,
      totalOT: Math.round(totalOT * 10) / 10,
      totalHours: Math.round(totalHours * 10) / 10,
      rate,
      total: roster.length,
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
              onChange={(e) => {
                if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Change project anyway?")) return;
                setSelectedProjectId(e.target.value);
              }}
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
              onChange={(e) => {
                if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Change date anyway?")) return;
                setDate(e.target.value);
              }}
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
          { id: "entry", label: "Daily Timesheet Entry", icon: "⏱️" },
          { id: "dashboard", label: "Attendance Dashboard", icon: "📊" },
          { id: "history", label: "Attendance History & Logs", icon: "📜" },
          { id: "reports", label: "Monthly Labor Reports", icon: "📑" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (hasUnsavedChanges && !window.confirm("You have unsaved attendance changes. Switch tab anyway?")) return;
              setActiveTab(tab.id);
            }}
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
      {/* TAB 1: DAILY ENTRY & WORKFORCE ROSTER                          */}
      {/* ============================================================= */}
      {activeTab === "entry" && (
        <div className="space-y-6">
          {/* Status & Action Control Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
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

              {hasUnsavedChanges && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 animate-pulse">
                  ● Unsaved Changes
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleSaveAttendance("DRAFT")}
                disabled={saving || roster.length === 0}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                💾 Save as Draft
              </button>

              <button
                onClick={handleSubmitSheet}
                disabled={saving || roster.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>📤</span> {saving ? "Submitting..." : "Submit for Approval"}
              </button>

              {isHRorGM && (
                <>
                  <button
                    onClick={() => {
                      setReviewAction("APPROVED");
                      setReviewModalOpen(true);
                    }}
                    disabled={saving || roster.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>✓</span> Approve Sheet
                  </button>
                  <button
                    onClick={() => {
                      setReviewAction("REJECTED");
                      setReviewModalOpen(true);
                    }}
                    disabled={saving || roster.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-300 dark:border-rose-800 transition-colors"
                  >
                    <span>✕</span> Return with Note
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
            {[
              { label: "Assigned", val: stats.total, color: "text-slate-700 dark:text-slate-200", icon: "👥" },
              { label: "Present", val: stats.present, color: "text-emerald-500", icon: "🟢" },
              { label: "Late", val: stats.late, color: "text-orange-500", icon: "🟠" },
              { label: "Half-Day", val: stats.halfDay, color: "text-amber-500", icon: "🟡" },
              { label: "Absent", val: stats.absent, color: "text-rose-500", icon: "🔴" },
              { label: "On Leave", val: stats.onLeave, color: "text-blue-500", icon: "🔵" },
              { label: "Rate %", val: `${stats.rate}%`, color: "text-teal-500", icon: "📈" },
              { label: "Overtime", val: `${stats.totalOT}h`, color: "text-indigo-500", icon: "⏱️" },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl border flex flex-col justify-between ${
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

          {/* Table Filters & Quick Mark Bar */}
          <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search worker..."
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  className={`w-44 sm:w-52 pl-7 pr-2.5 py-1 rounded-xl text-xs border focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400"
                  }`}
                />
                <span className="absolute left-2 top-1.5 text-xs text-slate-400">🔍</span>
              </div>

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
            </div>

            {/* Quick Bulk Marking */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-slate-400 mr-1">Bulk:</span>
              <button
                type="button"
                onClick={() => handleMarkAll("PRESENT")}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("HALF_DAY")}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors"
              >
                All Half Day
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("ABSENT")}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className={`rounded-2xl border overflow-hidden ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}>
            <div className="w-full overflow-x-hidden">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead className={`text-[11px] uppercase tracking-wider border-b ${
                  isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
                }`}>
                  <tr>
                    <th className="px-2.5 py-2.5 w-[22%]">Worker</th>
                    <th className="px-2 py-2.5 w-[16%]">Trade / Site</th>
                    <th className="px-2 py-2.5 w-[15%]">Status</th>
                    <th className="px-2 py-2.5 w-[17%]">Check-In / Out</th>
                    <th className="px-1 py-2.5 text-center w-[6%]">Hours</th>
                    <th className="px-1 py-2.5 text-center w-[6%]">OT</th>
                    <th className="px-2 py-2.5 w-[14%]">Notes</th>
                    <th className="px-1 py-2.5 text-center w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingRoster ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
                        Loading roster...
                      </td>
                    </tr>
                  ) : filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        No active employees matching filters found.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((item) => (
                      <tr
                        key={item.employee.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Worker Identity */}
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                              {item.employee.fullName.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1 truncate">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate" title={item.employee.fullName}>
                                {item.employee.fullName}
                              </div>
                              <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                                {item.employee.employeeCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Trade & Site */}
                        <td className="px-2 py-2 text-xs min-w-0">
                          <div className="font-medium capitalize text-slate-800 dark:text-slate-200 truncate" title={item.employee.trade.replace(/_/g, " ").toLowerCase()}>
                            {item.employee.trade.replace(/_/g, " ").toLowerCase()}
                          </div>
                          <div className="text-slate-400 text-[10px] truncate" title={item.employee.assignedProject?.projectName || "Unassigned"}>
                            {item.employee.assignedProject?.projectName || "Unassigned"}
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="px-2 py-2">
                          <div className="relative w-full">
                            <select
                              value={item.status}
                              onChange={(e) => updateWorkerField(item.employee.id, "status", e.target.value)}
                              className={`w-full py-1 pl-1.5 pr-4 rounded-lg text-[11px] font-semibold border appearance-none cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate ${
                                item.status === "PRESENT"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                                  : item.status === "ABSENT"
                                  ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                                  : item.status === "HALF_DAY"
                                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                                  : item.status === "LATE"
                                  ? "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
                                  : item.status === "ON_LEAVE"
                                  ? "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                                  : "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
                              }`}
                            >
                              {ATTENDANCE_STATUSES.map((st) => (
                                <option
                                  key={st.value}
                                  value={st.value}
                                  className={isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}
                                >
                                  {st.icon} {st.label}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-[9px] opacity-60">
                              ▾
                            </div>
                          </div>
                        </td>

                        {/* Check-In / Check-Out */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              value={item.checkInTime || ""}
                              onChange={(e) => updateWorkerField(item.employee.id, "checkInTime", e.target.value)}
                              disabled={["ABSENT", "ON_LEAVE", "HOLIDAY", "REST_DAY"].includes(item.status)}
                              className={`w-full max-w-[56px] px-0.5 py-0.5 rounded text-[11px] border text-center font-mono focus:ring-1 focus:ring-emerald-500 disabled:opacity-30 ${
                                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                              }`}
                            />
                            <span className="text-slate-400 text-[10px] shrink-0">-</span>
                            <input
                              type="time"
                              value={item.checkOutTime || ""}
                              onChange={(e) => updateWorkerField(item.employee.id, "checkOutTime", e.target.value)}
                              disabled={["ABSENT", "ON_LEAVE", "HOLIDAY", "REST_DAY"].includes(item.status)}
                              className={`w-full max-w-[56px] px-0.5 py-0.5 rounded text-[11px] border text-center font-mono focus:ring-1 focus:ring-emerald-500 disabled:opacity-30 ${
                                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                              }`}
                            />
                          </div>
                        </td>

                        {/* Calculated Work Hours */}
                        <td className="px-1 py-2 text-center font-bold text-xs text-slate-800 dark:text-slate-200">
                          {item.workHours}h
                        </td>

                        {/* Overtime Hours */}
                        <td className="px-1 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="16"
                            step="0.5"
                            value={item.overtimeHours || ""}
                            onChange={(e) => updateWorkerField(item.employee.id, "overtimeHours", e.target.value)}
                            placeholder="0"
                            disabled={["ABSENT", "ON_LEAVE", "HOLIDAY", "REST_DAY"].includes(item.status)}
                            className={`w-10 px-0.5 py-0.5 rounded text-xs border text-center font-semibold focus:ring-1 focus:ring-emerald-500 disabled:opacity-30 ${
                              Number(item.overtimeHours) >= 4
                                ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold"
                                : isDark
                                ? "bg-slate-800 border-slate-700 text-white"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          />
                        </td>

                        {/* Notes / Reason */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.notes || ""}
                            onChange={(e) => updateWorkerField(item.employee.id, "notes", e.target.value)}
                            placeholder={
                              item.status === "ABSENT"
                                ? "Absence..."
                                : item.status === "LATE"
                                ? "Lateness..."
                                : "Notes..."
                            }
                            className={`w-full px-1.5 py-0.5 rounded text-[11px] border focus:ring-1 focus:ring-emerald-500 truncate ${
                              isDark
                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                                : "bg-slate-50 border-slate-200 placeholder-slate-400"
                            }`}
                          />
                        </td>

                        {/* Inspect Details */}
                        <td className="px-1 py-2 text-center">
                          <button
                            onClick={() => openWorkerDetail(item.employee.id)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Worker Attendance Details"
                          >
                            👁️
                          </button>
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
      {/* REVIEW & APPROVAL MODAL (HR / GM ACTION)                       */}
      {/* ============================================================= */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-xl ${
            isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <h3 className="text-lg font-bold">
              {reviewAction === "APPROVED" ? "Approve Attendance Sheet" : "Return Sheet for Correction"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {reviewAction === "APPROVED"
                ? `You are confirming and verifying the site attendance sheet for ${date}.`
                : `You are returning the site attendance sheet for ${date} to site supervisor with corrective feedback.`}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                {reviewAction === "APPROVED" ? "Reviewer Note (Optional)" : "Correction Reason / Instructions (Required)"}
              </label>
              <textarea
                rows={3}
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder={
                  reviewAction === "APPROVED"
                    ? "Verified against site logbook..."
                    : "Please recheck overtime hours for carpenter crew..."
                }
                className={`w-full p-3 rounded-xl text-xs border focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSheet}
                disabled={reviewing || (reviewAction === "REJECTED" && !reviewerNote.trim())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
                  reviewAction === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {reviewing ? "Processing..." : reviewAction === "APPROVED" ? "Confirm & Approve" : "Return Sheet"}
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
