import { useState, useEffect } from "react";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorAttendancePage() {
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get("projectId") || "");
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || new Date().toISOString().split("T")[0]);

  const [attendanceData, setAttendanceData] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PRESENT, ON_LEAVE, ABSENT, PENDING_HR

  // Detail Modal for Eye Icon
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState(null);

  // Correction request modal
  const [correctionModal, setCorrectionModal] = useState({ open: false, recordId: null, employeeName: "" });
  const [correctionReason, setCorrectionReason] = useState("");

  // Add Daily Worker Modal
  const [addWorkerModal, setAddWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: "",
    phone: "",
    trade: "GENERAL_LABORER",
    dailyRate: 400,
    workTeam: "Main Team",
    nationalId: "",
  });
  const [addingWorker, setAddingWorker] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadAttendanceRoster();
    }
  }, [selectedProjectId, selectedDate]);

  const loadProjects = async () => {
    try {
      const res = await supervisorApi.getProjects();
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        if (!selectedProjectId || !res.data.some((p) => p.id === selectedProjectId)) {
          setSelectedProjectId(res.data[0].id);
        }
      } else {
        setProjects([]);
        setSelectedProjectId("");
        setRoster([]);
        setLoading(false);
      }
    } catch {
      setStatusMsg({ text: "Failed to load assigned site project", type: "error" });
      setLoading(false);
    }
  };

  const loadAttendanceRoster = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await supervisorApi.getAttendance(selectedProjectId, selectedDate);
      if (res.success) {
        setAttendanceData(res.data);
        setRoster(res.data.roster || []);
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch {
      setStatusMsg({ text: "Failed to load attendance roster", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChangeByWorkerId = (employeeId, field, value) => {
    setRoster((prev) =>
      prev.map((worker) => {
        if (worker.employeeId !== employeeId) return worker;
        const updated = { ...worker, [field]: value };

        // Auto calculate hours if status changes or times change
        if (field === "status") {
          if (["ABSENT", "ON_LEAVE", "HOLIDAY", "REST_DAY"].includes(value)) {
            updated.workHours = 0.0;
            updated.overtimeHours = 0.0;
            updated.checkInTime = "";
            updated.checkOutTime = "";
          } else if (value === "HALF_DAY") {
            updated.workHours = 4.0;
            if (!updated.checkInTime) updated.checkInTime = "08:00";
            if (!updated.checkOutTime) updated.checkOutTime = "12:00";
          } else if (value === "PRESENT") {
            if (!updated.checkInTime) updated.checkInTime = "08:00";
            if (!updated.checkOutTime) updated.checkOutTime = "17:00";
            updated.workHours = 8.0;
          } else if (value === "LATE") {
            if (!updated.checkInTime) updated.checkInTime = "09:00";
            if (!updated.checkOutTime) updated.checkOutTime = "17:00";
            updated.workHours = 7.0;
          }
        }

        return updated;
      })
    );
  };

  const handleMarkAllPresent = () => {
    if (isApproved) return;
    setRoster((prev) =>
      prev.map((worker) => {
        if (worker.status === "ON_LEAVE") return worker;
        return {
          ...worker,
          status: "PRESENT",
          checkInTime: worker.checkInTime || "08:00",
          checkOutTime: worker.checkOutTime || "17:00",
          workHours: 8.0,
          overtimeHours: worker.overtimeHours ?? 0,
        };
      })
    );
    setStatusMsg({ text: "✓ Marked all available site workers as Present (08:00 - 17:00, 8h)", type: "success" });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const payload = {
        projectId: selectedProjectId,
        date: selectedDate,
        records: roster.map((r) => ({
          employeeId: r.employeeId,
          status: r.status,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime,
          workHours: Number(r.workHours),
          overtimeHours: Number(r.overtimeHours),
          notes: r.notes,
          workTeam: r.workTeam,
        })),
      };

      const res = await supervisorApi.saveAttendance(payload);
      if (res.success) {
        setStatusMsg({ text: "✓ Attendance draft successfully saved!", type: "success" });
        loadAttendanceRoster();
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch (e) {
      setStatusMsg({ text: e.message || "Failed to save draft", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitToHR = async () => {
    setSubmitting(true);
    setStatusMsg({ text: "", type: "" });
    try {
      await supervisorApi.saveAttendance({
        projectId: selectedProjectId,
        date: selectedDate,
        records: roster.map((r) => ({
          employeeId: r.employeeId,
          status: r.status,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime,
          workHours: Number(r.workHours),
          overtimeHours: Number(r.overtimeHours),
          notes: r.notes,
          workTeam: r.workTeam,
        })),
      });

      const res = await supervisorApi.submitAttendance({
        projectId: selectedProjectId,
        date: selectedDate,
      });

      if (res.success) {
        setStatusMsg({
          text: "✓ Daily site attendance successfully submitted to the Accountant for wage review & disbursement!",
          type: "success",
        });
        loadAttendanceRoster();
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch (e) {
      setStatusMsg({ text: e.message || "Submission failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCorrectionRequest = async () => {
    if (!correctionReason.trim()) return;
    try {
      const res = await supervisorApi.requestCorrection({
        attendanceId: correctionModal.recordId,
        reason: correctionReason.trim(),
      });
      if (res.success) {
        setStatusMsg({ text: "✓ Correction request submitted to HR", type: "success" });
        setCorrectionModal({ open: false, recordId: null, employeeName: "" });
        setCorrectionReason("");
        loadAttendanceRoster();
      }
    } catch {
      setStatusMsg({ text: "Failed to send correction request", type: "error" });
    }
  };

  const handleAddDailyWorker = async (e) => {
    e.preventDefault();
    if (!newWorker.fullName.trim()) return;
    setAddingWorker(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await supervisorApi.addDailyWorker(selectedProjectId, newWorker);
      if (res.success) {
        setStatusMsg({
          text: `✓ Daily worker ${res.data.fullName} (${res.data.employeeCode}) registered on site and submitted to HR for approval!`,
          type: "success",
        });
        setAddWorkerModal(false);
        setNewWorker({
          fullName: "",
          phone: "",
          trade: "GENERAL_LABORER",
          dailyRate: 400,
          workTeam: "Main Team",
          nationalId: "",
        });
        await loadAttendanceRoster();
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to register daily worker", type: "error" });
    } finally {
      setAddingWorker(false);
    }
  };

  const formatTrade = (trade) => {
    if (!trade) return "Laborer";
    const map = {
      GENERAL_LABORER: "General Laborer",
      CARPENTER: "Carpenter",
      MASON: "Mason",
      STEEL_FIXER: "Steel Fixer",
      ELECTRICIAN: "Electrician",
      PLUMBER: "Plumber",
      PAINTER: "Painter",
      WELDER: "Welder",
      SCAFFOLDER: "Scaffolder",
      HEAVY_OPERATOR: "Heavy Equipment Operator",
      SITE_HELPER: "Site Helper",
    };
    return map[trade] || trade.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isApproved = attendanceData?.sheetStatus === "APPROVED";
  const isSubmitted = attendanceData?.sheetStatus === "SUBMITTED";

  // KPI Calculations
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const totalWorkers = roster.length;
  const presentCount = roster.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const onLeaveCount = roster.filter((r) => r.status === "ON_LEAVE").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const pendingHrCount = roster.filter((r) => r.employeeStatus === "PENDING_APPROVAL").length;
  const totalOtHours = roster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
  const totalRegHours = roster.reduce((sum, r) => sum + (Number(r.workHours) || 0), 0);
  const estimatedWageCost = roster.reduce((sum, r) => {
    if (["ABSENT", "ON_LEAVE"].includes(r.status)) return sum;
    const rate = Number(r.dailyRate) || 400;
    const hours = Number(r.workHours) || 0;
    const ot = Number(r.overtimeHours) || 0;
    const hourlyRate = rate / 8;
    return sum + hours * hourlyRate + ot * hourlyRate * 1.5;
  }, 0);

  // Filtered Roster
  const filteredRoster = roster.filter((worker) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (worker.fullName || "").toLowerCase().includes(q);
      const codeMatch = (worker.employeeCode || "").toLowerCase().includes(q);
      const tradeMatch = (worker.trade || "").toLowerCase().includes(q);
      if (!nameMatch && !codeMatch && !tradeMatch) return false;
    }
    if (statusFilter === "PRESENT") return worker.status === "PRESENT";
    if (statusFilter === "ON_LEAVE") return worker.status === "ON_LEAVE";
    if (statusFilter === "ABSENT") return worker.status === "ABSENT";
    if (statusFilter === "PENDING_HR") return worker.employeeStatus === "PENDING_APPROVAL";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider uppercase font-mono">
              Site Supervisor Operations
            </span>
            <span className="text-slate-400 text-xs">• Shift Roster Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Daily Attendance & Labor Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Record check-in/out times, monitor active site crews, and route daily attendance sheets directly to the Accountant for wage payout.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddWorkerModal(true)}
            disabled={!selectedProjectId}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>➕👷‍♂️</span>
            <span>Add Daily Worker</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={isApproved || roster.length === 0}
            className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              isApproved || roster.length === 0
                ? "opacity-50 cursor-not-allowed bg-slate-800/40 text-slate-500 border-slate-800"
                : isDark
                ? "bg-[#0b1428] hover:bg-[#122040] text-emerald-400 border-emerald-500/30"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
            }`}
            title="Mark all workers Present with standard 08:00 - 17:00 shift"
          >
            <span>⚡</span>
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || isApproved}
            className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              isApproved
                ? "opacity-50 cursor-not-allowed bg-slate-800/40 text-slate-500 border-slate-800"
                : isDark
                ? "border-slate-700/80 bg-[#0d162a] hover:bg-[#162342] text-slate-200"
                : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
            }`}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save Draft</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSubmitToHR}
            disabled={submitting || isApproved || roster.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              isApproved
                ? "bg-slate-700/50 text-slate-400 cursor-not-allowed shadow-none"
                : isSubmitted
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/25"
            }`}
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : isSubmitted ? (
              <>
                <span>📤</span>
                <span>Re-Submit to Accountant</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Submit to Accountant for Payout</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Workforce */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#0a1224] border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Site Roster</span>
            <span className="text-base">👷‍♂️</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalWorkers}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Assigned to Site</span>
            {pendingHrCount > 0 && (
              <span className="text-amber-500 font-semibold">• {pendingHrCount} Pending HR</span>
            )}
          </div>
        </div>

        {/* Card 2: Present on Shift */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#061e1a] border-emerald-900/40" : "bg-emerald-50/60 border-emerald-200 shadow-xs"
        }`}>
          <div className="flex items-center justify-between text-emerald-500 dark:text-emerald-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Present on Site</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {presentCount}
            <span className="text-xs font-semibold text-slate-400 ml-1">/ {totalWorkers}</span>
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
            {totalWorkers > 0 ? `${Math.round((presentCount / totalWorkers) * 100)}% active shift turnout` : "0% active"}
          </div>
        </div>

        {/* Card 3: On Leave / Absent */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#0c182e] border-blue-900/40" : "bg-blue-50/60 border-blue-200 shadow-xs"
        }`}>
          <div className="flex items-center justify-between text-blue-500 dark:text-blue-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Leave & Absent</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {onLeaveCount + absentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {onLeaveCount} on leave • {absentCount} absent
          </div>
        </div>

        {/* Card 4: Overtime */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#1f170a] border-amber-900/40" : "bg-amber-50/60 border-amber-200 shadow-xs"
        }`}>
          <div className="flex items-center justify-between text-amber-500 dark:text-amber-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Overtime Log</span>
            <span className="text-base">⏱️</span>
          </div>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400">
            {totalOtHours} <span className="text-xs font-bold text-slate-400">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalRegHours} hrs regular shift
          </div>
        </div>

        {/* Card 5: Estimated Cost */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Est. Shift Wages</span>
            <span className="text-base">💰</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {Math.round(estimatedWageCost).toLocaleString()}{" "}
            <span className="text-xs font-bold text-slate-400">ETB</span>
          </div>
          <div className="text-[11px] text-emerald-500 mt-1 font-medium">
            → Routes to Accountant
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-md transition-all ${
            statusMsg.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
            <span className="font-medium">{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg({ text: "", type: "" })}
            className="text-xs font-bold uppercase tracking-wider underline hover:opacity-80 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter, Site & Date Control Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark ? "bg-[#091122] border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Project Lock/Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Assigned Site Project
            </label>
            {projects.length === 1 ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1b36] border border-blue-500/30 text-xs font-bold text-blue-300">
                <span>🔒</span>
                <span>{projects[0].projectName}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-[10px]">
                  {projects[0].projectCode}
                </span>
              </div>
            ) : projects.length > 1 ? (
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSearchParams({ projectId: e.target.value, date: selectedDate });
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-hidden ${
                  isDark
                    ? "bg-[#0c1527] border-slate-700 text-slate-200"
                    : "bg-slate-50 border-slate-300 text-slate-800"
                }`}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} ({p.projectCode})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs font-semibold text-rose-400 py-1">
                ⚠️ No site project currently assigned to you
              </div>
            )}
          </div>

          {/* Date Picker with Quick Date shortcuts */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Shift Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSearchParams({ projectId: selectedProjectId, date: e.target.value });
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium outline-hidden ${
                  isDark
                    ? "bg-[#0c1527] border-slate-700 text-slate-200 scheme-dark"
                    : "bg-slate-50 border-slate-300 text-slate-800"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                  setSearchParams({ projectId: selectedProjectId, date: today });
                }}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Search Crew
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search worker, EMP ID, trade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-hidden ${
                  isDark
                    ? "bg-[#0c1527] border-slate-700/80 text-slate-200 placeholder-slate-500 focus:border-cyan-500"
                    : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400"
                }`}
              />
              <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Filter Pills & Sheet Badge */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070e1c] border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({roster.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PRESENT")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "PRESENT"
                  ? "bg-[#06291e] text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Present ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ON_LEAVE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "ON_LEAVE"
                  ? "bg-[#0c1f44] text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-blue-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Leave ({onLeaveCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ABSENT")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "ABSENT"
                  ? "bg-[#2a0e14] text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-rose-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Absent ({absentCount})
            </button>
          </div>

          {/* Sheet Status Badge */}
          <div className="flex items-center gap-2 pl-2">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider inline-flex items-center gap-1.5 ${
                attendanceData?.sheetStatus === "APPROVED"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : attendanceData?.sheetStatus === "SUBMITTED"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  attendanceData?.sheetStatus === "APPROVED"
                    ? "bg-emerald-400"
                    : attendanceData?.sheetStatus === "SUBMITTED"
                    ? "bg-blue-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              {attendanceData?.sheetStatus || "DRAFT"}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Table Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">Daily Site Muster Roll</span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400">{filteredRoster.length} workers in view</span>
        </div>
        <div className="inline-flex items-center gap-2 text-emerald-400 text-[11px] font-semibold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl shadow-xs self-start sm:self-auto">
          <span className="text-sm">⇅</span>
          <span>Scroll table vertically to view complete worker roster</span>
        </div>
      </div>

      {/* Cybernetic High-Contrast Dark Attendance Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#070c18] shadow-2xl overflow-hidden">
        {/* Scrollable container with sticky header - zero clipped or cut-off information */}
        <div className="overflow-y-auto overflow-x-auto max-h-[640px] custom-scrollbar">
          <table className="w-full min-w-[1040px] text-left border-collapse">
            {/* Sticky Table Header pinned during vertical scroll */}
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="border-b border-slate-800 bg-[#091122] text-[11px] font-bold uppercase tracking-wider text-[#8da2be] whitespace-nowrap select-none">
                <th className="py-3.5 px-4 bg-[#091122] min-w-[220px]">WORKER</th>
                <th className="py-3.5 px-3 bg-[#091122] min-w-[160px]">TRADE / SITE</th>
                <th className="py-3.5 px-3 bg-[#091122] min-w-[140px]">STATUS</th>
                <th className="py-3.5 px-3 bg-[#091122] min-w-[210px]">CHECK-IN / OUT</th>
                <th className="py-3.5 px-2 bg-[#091122] text-center min-w-[70px]">HOURS</th>
                <th className="py-3.5 px-2 bg-[#091122] text-center min-w-[65px]">OT</th>
                <th className="py-3.5 px-3 bg-[#091122] min-w-[180px]">NOTES</th>
                <th className="py-3.5 px-3 text-center bg-[#091122] min-w-[65px]">ACTION</th>
              </tr>
            </thead>

            {/* Table Body matching screenshot */}
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-slate-300">Loading daily site muster roll...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <span className="text-3xl block">👷‍♂️</span>
                      <p className="font-semibold text-slate-300">No workers match your current search or filters.</p>
                      <p className="text-xs text-slate-500">
                        Try resetting filters or click <strong>&quot;Add Daily Worker&quot;</strong> to register field crew members.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoster.map((row) => {
                  const isLeaveOrAbsent = ["ABSENT", "ON_LEAVE"].includes(row.status);

                  return (
                    <tr
                      key={row.employeeId}
                      className="hover:bg-[#0c162b]/70 transition-colors group"
                    >
                      {/* 1. WORKER Column - Full name and badges without cut-off */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[220px]">
                        <div className="flex items-center gap-3">
                          {/* Circular Teal Avatar Badge with First Letter */}
                          <div className="w-9 h-9 rounded-full bg-[#0d9488] text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                            {row.fullName ? row.fullName.charAt(0).toUpperCase() : "W"}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                                {row.fullName}
                              </span>
                              {row.employeeStatus === "PENDING_APPROVAL" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                  Pending HR
                                </span>
                              )}
                              {row.employmentType === "DAILY_LABORER" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                                  Daily
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[#34d399] font-medium tracking-wide mt-0.5">
                              {row.employeeCode || `EMP-${row.employeeId?.slice(-4) || "0000"}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. TRADE / SITE Column - Full Trade and Site project name */}
                      <td className="py-3.5 px-3 whitespace-nowrap min-w-[160px]">
                        <div>
                          <div className="font-semibold text-white text-xs">
                            {formatTrade(row.trade)}
                          </div>
                          <div className="text-[11px] text-[#8da2be] mt-0.5">
                            {currentProject?.projectName || row.workTeam || "Unassigned"}
                          </div>
                        </div>
                      </td>

                      {/* 3. STATUS Column (Glowing pill dropdown matching screenshot) */}
                      <td className="py-3.5 px-3 whitespace-nowrap min-w-[140px]">
                        <div className="relative inline-flex items-center">
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold select-none transition-all ${
                              row.status === "ON_LEAVE"
                                ? "bg-[#0e1d3d] text-blue-300 border-blue-500/40"
                                : row.status === "PRESENT"
                                ? "bg-[#07241d] text-emerald-300 border-emerald-500/40"
                                : row.status === "ABSENT"
                                ? "bg-[#250d15] text-rose-300 border-rose-500/40"
                                : row.status === "LATE"
                                ? "bg-[#261706] text-amber-300 border-amber-500/40"
                                : "bg-[#1f103b] text-purple-300 border-purple-500/40"
                            }`}
                          >
                            {/* Glowing Colored Status Dot */}
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                row.status === "ON_LEAVE"
                                  ? "bg-blue-400 shadow-[0_0_8px_#3b82f6]"
                                  : row.status === "PRESENT"
                                  ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                                  : row.status === "ABSENT"
                                  ? "bg-rose-400 shadow-[0_0_8px_#f43f5e]"
                                  : row.status === "LATE"
                                  ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
                                  : "bg-purple-400 shadow-[0_0_8px_#a855f7]"
                              }`}
                            />

                            {/* Status Label */}
                            <span className="capitalize text-xs">
                              {row.status === "ON_LEAVE"
                                ? "On Leave"
                                : row.status === "PRESENT"
                                ? "Present"
                                : row.status === "ABSENT"
                                ? "Absent"
                                : row.status === "LATE"
                                ? "Late"
                                : "Half Day"}
                            </span>

                            {/* Dropdown Caret */}
                            <svg
                              className="w-3.5 h-3.5 opacity-60 ml-0.5 text-current shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Transparent Native Select Layer */}
                          <select
                            value={row.status}
                            disabled={isApproved}
                            onChange={(e) => handleFieldChangeByWorkerId(row.employeeId, "status", e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <option value="PRESENT" className="bg-[#0b1325] text-emerald-300">
                              Present
                            </option>
                            <option value="ON_LEAVE" className="bg-[#0b1325] text-blue-300">
                              On Leave
                            </option>
                            <option value="ABSENT" className="bg-[#0b1325] text-rose-300">
                              Absent
                            </option>
                            <option value="LATE" className="bg-[#0b1325] text-amber-300">
                              Late
                            </option>
                            <option value="HALF_DAY" className="bg-[#0b1325] text-purple-300">
                              Half Day
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* 4. CHECK-IN / OUT Column - Sufficient width so numbers and pickers never cut off */}
                      <td className="py-3.5 px-3 whitespace-nowrap min-w-[210px]">
                        {isLeaveOrAbsent ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                            <div className="w-[88px] px-2.5 py-1.5 rounded-lg bg-[#0c1527] border border-slate-800 text-center select-none tracking-widest text-xs">
                              --:--
                            </div>
                            <span className="text-slate-600 font-bold text-xs">-</span>
                            <div className="w-[88px] px-2.5 py-1.5 rounded-lg bg-[#0c1527] border border-slate-800 text-center select-none tracking-widest text-xs">
                              --:--
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={row.checkInTime || "08:00"}
                              disabled={isApproved}
                              onChange={(e) =>
                                handleFieldChangeByWorkerId(row.employeeId, "checkInTime", e.target.value)
                              }
                              className="w-[90px] px-2 py-1.5 rounded-lg bg-[#0c1527] border border-slate-700/70 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-hidden transition-colors scheme-dark"
                            />
                            <span className="text-slate-500 font-bold text-xs">-</span>
                            <input
                              type="time"
                              value={row.checkOutTime || "17:00"}
                              disabled={isApproved}
                              onChange={(e) =>
                                handleFieldChangeByWorkerId(row.employeeId, "checkOutTime", e.target.value)
                              }
                              className="w-[90px] px-2 py-1.5 rounded-lg bg-[#0c1527] border border-slate-700/70 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-hidden transition-colors scheme-dark"
                            />
                          </div>
                        )}
                      </td>

                      {/* 5. HOURS Column */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap min-w-[70px]">
                        <span className="text-sm font-extrabold text-white tracking-wide">
                          {row.workHours ?? 0}h
                        </span>
                      </td>

                      {/* 6. OT Column */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap min-w-[65px]">
                        <input
                          type="number"
                          min="0"
                          max="8"
                          step="0.5"
                          value={row.overtimeHours ?? 0}
                          disabled={isApproved || isLeaveOrAbsent}
                          onChange={(e) =>
                            handleFieldChangeByWorkerId(row.employeeId, "overtimeHours", e.target.value)
                          }
                          className="w-12 px-1.5 py-1.5 rounded-lg bg-[#0c1527] border border-slate-700/70 text-slate-200 text-xs font-bold text-center focus:border-amber-500 focus:outline-hidden transition-colors disabled:opacity-40"
                        />
                      </td>

                      {/* 7. NOTES Column */}
                      <td className="py-3.5 px-3 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Add shift notes..."
                          value={row.notes || ""}
                          disabled={isApproved}
                          onChange={(e) =>
                            handleFieldChangeByWorkerId(row.employeeId, "notes", e.target.value)
                          }
                          className="w-full min-w-[150px] px-3 py-1.5 rounded-lg bg-[#0c1527] border border-slate-700/70 text-slate-200 placeholder-slate-500 text-xs focus:border-cyan-500 focus:outline-hidden transition-colors disabled:opacity-40"
                        />
                      </td>

                      {/* 8. Action Eye Icon Button */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap min-w-[65px]">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerDetail(row)}
                          title="View Worker Shift Profile"
                          className="w-8 h-8 mx-auto rounded-full bg-[#0c1527] hover:bg-[#142340] border border-slate-700/70 flex items-center justify-center transition-all group/eye cursor-pointer shadow-xs hover:border-cyan-500/60"
                        >
                          <svg
                            className="w-4 h-4 text-slate-400 group-hover/eye:text-cyan-400 transition-colors"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <circle cx="12" cy="12" r="1.6" fill="#f43f5e" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary Stats */}
        <div className="border-t border-slate-800 bg-[#091122] px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-white">{filteredRoster.length}</strong> of{" "}
              <strong className="text-white">{roster.length}</strong> site workers
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Total Shift Hours: <strong className="text-emerald-400 font-bold">{totalRegHours} hrs</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Overtime Logged: <strong className="text-amber-400 font-bold">{totalOtHours} hrs</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Auto-sync enabled • Changes saved on Draft
            </span>
          </div>
        </div>
      </div>

      {/* Worker Detail Inspection Modal (Opened via Eye Icon) */}
      {selectedWorkerDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-lg w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedWorkerDetail(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            {/* Header / Avatar */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                {selectedWorkerDetail.fullName ? selectedWorkerDetail.fullName.charAt(0).toUpperCase() : "W"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">
                    {selectedWorkerDetail.fullName}
                  </h3>
                  {selectedWorkerDetail.employeeStatus === "PENDING_APPROVAL" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pending HR
                    </span>
                  )}
                  {selectedWorkerDetail.employeeStatus === "ACTIVE" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HR Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#34d399] mt-0.5">
                  <span>{selectedWorkerDetail.employeeCode}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-sans font-semibold">
                    {formatTrade(selectedWorkerDetail.trade)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-3 rounded-xl bg-[#0c1527] border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Site</span>
                <span className="font-bold text-white text-sm mt-0.5 block truncate">
                  {currentProject?.projectName || "Main Site"}
                </span>
                <span className="text-[11px] text-slate-400">{currentProject?.projectCode}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Wage Rate</span>
                <span className="font-bold text-emerald-400 text-sm mt-0.5 block">
                  {selectedWorkerDetail.dailyRate || 400} ETB / day
                </span>
                <span className="text-[11px] text-slate-400">
                  ~{Math.round((Number(selectedWorkerDetail.dailyRate) || 400) / 8)} ETB / hour
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Work Gang / Team</span>
                <span className="font-bold text-white text-sm mt-0.5 block">
                  {selectedWorkerDetail.workTeam || "Main Team"}
                </span>
                <span className="text-[11px] text-slate-400">Trade: {formatTrade(selectedWorkerDetail.trade)}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0c1527] border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                <span className="font-bold text-cyan-400 text-sm mt-0.5 block font-mono">
                  {selectedWorkerDetail.phone || "No phone listed"}
                </span>
                <span className="text-[11px] text-slate-400">ID: {selectedWorkerDetail.nationalId || "N/A"}</span>
              </div>
            </div>

            {/* Today's Shift Snapshot */}
            <div className="p-4 rounded-2xl bg-[#070e1d] border border-slate-800 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Today&apos;s Shift Snapshot ({selectedDate})
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Status</span>
                  <span className="text-sm font-bold text-emerald-300">
                    {selectedWorkerDetail.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">In / Out</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {selectedWorkerDetail.checkInTime || "--:--"} - {selectedWorkerDetail.checkOutTime || "--:--"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Hours</span>
                  <span className="text-sm font-extrabold text-white">
                    {selectedWorkerDetail.workHours ?? 0}h
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Overtime</span>
                  <span className="text-sm font-bold text-amber-400">
                    +{selectedWorkerDetail.overtimeHours ?? 0}h
                  </span>
                </div>
              </div>

              {selectedWorkerDetail.notes && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-500 font-semibold">Notes: </span>
                  <span className="text-slate-300 italic">{selectedWorkerDetail.notes}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3">
              {isApproved && (
                <button
                  type="button"
                  onClick={() => {
                    setCorrectionModal({
                      open: true,
                      recordId: selectedWorkerDetail.id,
                      employeeName: selectedWorkerDetail.fullName,
                    });
                    setSelectedWorkerDetail(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                >
                  Request Correction
                </button>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setSelectedWorkerDetail(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Daily Worker Modal */}
      {addWorkerModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleAddDailyWorker}
            className="max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl relative"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl">
                👷‍♂️
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Register On-Site Daily Laborer</h3>
                <p className="text-[11px] text-slate-400">Added to today&apos;s shift & routed to HR for verification</p>
              </div>
            </div>

            {/* Destination Project Notice */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold">🔒 Destination Site:</span>
                <span className="font-bold underline">
                  {currentProject?.projectName || "Assigned Project"}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-500/20 font-mono font-bold">
                {currentProject?.projectCode}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Kebede"
                  value={newWorker.fullName}
                  onChange={(e) => setNewWorker({ ...newWorker, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="0911000000"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Daily Wage (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={newWorker.dailyRate}
                    onChange={(e) => setNewWorker({ ...newWorker, dailyRate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-white focus:border-emerald-500 outline-hidden font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Trade / Craft
                  </label>
                  <select
                    value={newWorker.trade}
                    onChange={(e) => setNewWorker({ ...newWorker, trade: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-white focus:border-emerald-500 outline-hidden"
                  >
                    <option value="GENERAL_LABORER">General Laborer</option>
                    <option value="MASON">Mason (Plaster / Brick)</option>
                    <option value="CARPENTER">Carpenter / Formwork</option>
                    <option value="STEEL_FIXER">Steel Fixer / Rebar</option>
                    <option value="ELECTRICIAN">Electrician</option>
                    <option value="PLUMBER">Plumber / Pipefitter</option>
                    <option value="PAINTER">Painter</option>
                    <option value="WELDER">Welder</option>
                    <option value="SCAFFOLDER">Scaffolder</option>
                    <option value="HEAVY_OPERATOR">Heavy Equipment Operator</option>
                    <option value="SITE_HELPER">Site Helper</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Work Team / Gang
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Concrete Team"
                    value={newWorker.workTeam}
                    onChange={(e) => setNewWorker({ ...newWorker, workTeam: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  National ID / Kebele ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. AA-99281-22"
                  value={newWorker.nationalId}
                  onChange={(e) => setNewWorker({ ...newWorker, nationalId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700/80 bg-[#0c1527] text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setAddWorkerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingWorker}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {addingWorker ? "Submitting to HR..." : "✓ Submit to HR & Add to Roster"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Correction Modal */}
      {correctionModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Request Attendance Correction</h3>
            <p className="text-xs text-slate-400 mb-4">
              Explain why {correctionModal.employeeName}&apos;s approved record requires modification.
            </p>

            <textarea
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Worker completed 2 overtime hours not captured on initial morning sheet..."
              className="w-full p-3 rounded-xl border border-slate-700 bg-[#0c1527] text-white placeholder-slate-500 text-xs outline-hidden mb-4 focus:border-amber-500"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCorrectionModal({ open: false, recordId: null, employeeName: "" })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCorrectionRequest}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
