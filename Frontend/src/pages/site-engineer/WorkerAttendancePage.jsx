import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, HardHat, Calendar, Save, CheckCircle2, Clock, Edit3, X, Building2, ClipboardList } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

const ATTENDANCE_STATUS_STYLES = {
  PRESENT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
  ABSENT: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
  HALF_DAY: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  LATE: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300",
  LEAVE: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300",
};

export default function WorkerAttendancePage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [workers, setWorkers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form state for today's workers
  // { [workerId]: { status: 'PRESENT', workHours: 8, overtimeHours: 0, notes: '', checkInTime: '08:00', checkOutTime: '17:00' } }
  const [workerEntries, setWorkerEntries] = useState({});

  // Correction Modal state
  const [correctionRecord, setCorrectionRecord] = useState(null);
  const [correctionStatus, setCorrectionStatus] = useState("PRESENT");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionOvertime, setCorrectionOvertime] = useState(0);
  const [correcting, setCorrecting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectWorkersAndHistory();
    }
  }, [selectedProjectId, selectedDate]);

  const loadProjects = async () => {
    const res = await siteEngineerService.getProjects();
    if (res.success && res.data.projects?.length > 0) {
      setProjects(res.data.projects);
      setSelectedProjectId(res.data.projects[0].id);
    }
  };

  const loadProjectWorkersAndHistory = async () => {
    setLoadingWorkers(true);
    setLoadingHistory(true);
    setFeedback(null);
    try {
      const [workersRes, attRes] = await Promise.all([
        siteEngineerService.getProjectWorkers(selectedProjectId),
        siteEngineerService.getAttendance({
          projectId: selectedProjectId,
          date: selectedDate,
        }),
      ]);

      if (workersRes.success) {
        const workerList = workersRes.data || [];
        setWorkers(workerList);

        // Prepopulate worker entries
        const initialEntries = {};
        workerList.forEach((w) => {
          initialEntries[w.id] = {
            status: "PRESENT",
            workHours: 8,
            overtimeHours: 0,
            notes: "",
            checkInTime: "08:00",
            checkOutTime: "17:00",
          };
        });
        setWorkerEntries(initialEntries);
      }

      if (attRes.success) {
        setAttendanceRecords(attRes.data?.records || []);
      }
    } finally {
      setLoadingWorkers(false);
      setLoadingHistory(false);
    }
  };

  const handleStatusChange = (workerId, status) => {
    setWorkerEntries((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status,
        workHours: status === "ABSENT" || status === "LEAVE" ? 0 : status === "HALF_DAY" ? 4 : 8,
      },
    }));
  };

  const handleFieldChange = (workerId, field, value) => {
    setWorkerEntries((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value,
      },
    }));
  };

  const markAll = (status) => {
    const updated = {};
    workers.forEach((w) => {
      updated[w.id] = {
        ...workerEntries[w.id],
        status,
        workHours: status === "ABSENT" || status === "LEAVE" ? 0 : status === "HALF_DAY" ? 4 : 8,
      };
    });
    setWorkerEntries(updated);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedProjectId || workers.length === 0) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      // Build batch records
      const records = workers.map((w) => {
        const entry = workerEntries[w.id] || { status: "PRESENT", workHours: 8, overtimeHours: 0 };
        return {
          employeeId: w.id,
          status: entry.status,
          workHours: Number(entry.workHours),
          overtimeHours: Number(entry.overtimeHours || 0),
          checkInTime: entry.checkInTime,
          checkOutTime: entry.checkOutTime,
          notes: entry.notes,
        };
      });

      const res = await siteEngineerService.recordAttendance({
        projectId: selectedProjectId,
        date: selectedDate,
        records,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || `Successfully recorded attendance for ${res.data?.recordedCount} worker(s)!`,
        });
        await loadProjectWorkersAndHistory();
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to record attendance.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCorrection = (rec) => {
    setCorrectionRecord(rec);
    setCorrectionStatus(rec.status);
    setCorrectionOvertime(rec.overtimeHours || 0);
    setCorrectionReason("");
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!correctionRecord) return;
    if (!correctionReason.trim()) {
      alert("Please provide a reason for correcting historical attendance.");
      return;
    }

    setCorrecting(true);
    try {
      const res = await siteEngineerService.updateAttendance(correctionRecord.id, {
        status: correctionStatus,
        overtimeHours: correctionOvertime,
        correctionReason,
      });

      if (res.success) {
        setCorrectionRecord(null);
        await loadProjectWorkersAndHistory();
      } else {
        alert(res.error || "Correction failed");
      }
    } finally {
      setCorrecting(false);
    }
  };

  const alreadyRecordedWorkerIds = new Set(attendanceRecords.map((r) => r.employeeId));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Worker Attendance Roster
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              Site Workforce Desk
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Record daily labor check-ins, overtime, and work shifts for assigned trade workers and daily laborers.
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

      {/* Control Bar: Select Project & Date */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Project Picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Site Location</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Fill Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => markAll("PRESENT")}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll("ABSENT")}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Eligible Workers Attendance Roster */}
      <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HardHat className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span>Daily Workforce Roster ({workers.length} Assigned Personnel)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Eligible active employees assigned by HR to this project.
            </p>
          </div>

          <button
            onClick={handleSubmitAttendance}
            disabled={submitting || workers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? "Saving..." : "Submit Daily Attendance"}</span>
          </button>
        </div>

        {loadingWorkers ? (
          <div className="text-center py-12 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Loading workforce roster...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-xs font-bold mt-2">No active workers currently assigned to this site.</p>
            <p className="text-[11px] text-slate-500">Workforce assignments are managed by Human Resources.</p>
          </div>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Worker / Trade</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Hours</th>
                  <th className="py-2.5 px-3">Overtime</th>
                  <th className="py-2.5 px-3">Shift Times</th>
                  <th className="py-2.5 px-3">Field Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {workers.map((worker) => {
                  const isRecorded = alreadyRecordedWorkerIds.has(worker.id);
                  const entry = workerEntries[worker.id] || { status: "PRESENT", workHours: 8, overtimeHours: 0 };

                  return (
                    <tr
                      key={worker.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        isRecorded ? "opacity-75" : ""
                      }`}
                    >
                      {/* Worker info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {worker.fullName}
                              {isRecorded && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  Recorded ✓
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {worker.employeeCode} • {worker.phone}
                            </p>
                          </div>
                          <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-300/30">
                            {worker.trade}
                          </span>
                        </div>
                      </td>

                      {/* Status Buttons */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {["PRESENT", "HALF_DAY", "ABSENT", "LATE", "LEAVE"].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(worker.id, st)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                entry.status === st
                                  ? ATTENDANCE_STATUS_STYLES[st] + " shadow-xs font-black"
                                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {st.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Regular Hours */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={entry.workHours ?? 8}
                          onChange={(e) => handleFieldChange(worker.id, "workHours", e.target.value)}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </td>

                      {/* Overtime Hours */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          max="8"
                          step="0.5"
                          value={entry.overtimeHours ?? 0}
                          onChange={(e) => handleFieldChange(worker.id, "overtimeHours", e.target.value)}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </td>

                      {/* Times */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="08:00"
                            value={entry.checkInTime || ""}
                            onChange={(e) => handleFieldChange(worker.id, "checkInTime", e.target.value)}
                            className="w-14 px-1.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="text"
                            placeholder="17:00"
                            value={entry.checkOutTime || ""}
                            onChange={(e) => handleFieldChange(worker.id, "checkOutTime", e.target.value)}
                            className="w-14 px-1.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="e.g. Scaffolding crew"
                          value={entry.notes || ""}
                          onChange={(e) => handleFieldChange(worker.id, "notes", e.target.value)}
                          className="w-full min-w-[120px] px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance History Table & Corrections */}
      <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span>Recorded Attendance History ({selectedDate})</span>
            </h2>
            <p className="text-xs text-slate-500">Historical logs submitted for this project and date.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{attendanceRecords.length} Records</span>
        </div>

        {loadingHistory ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading history...</p>
        ) : attendanceRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center italic">
            No attendance records found for this date.
          </p>
        ) : (
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 px-3">Worker</th>
                  <th className="py-2 px-3">Trade</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Hours</th>
                  <th className="py-2 px-3">Overtime</th>
                  <th className="py-2 px-3">Audit / Reason</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                      {rec.employees?.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{rec.employees?.trade}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ATTENDANCE_STATUS_STYLES[rec.status] || "bg-slate-100"}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{rec.workHours ?? 8}h</td>
                    <td className="py-2.5 px-3 font-semibold">{rec.overtimeHours ?? 0}h</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500">
                      {rec.correctionReason ? `Corrected: ${rec.correctionReason}` : rec.notes || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenCorrection(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-blue-500" />
                        <span>Correct</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Attendance Correction Modal */}
      {correctionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-blue-500" /> Correct Attendance Record
                </h3>
                <p className="text-xs text-slate-500">{correctionRecord.employees?.fullName} ({selectedDate})</p>
              </div>
              <button
                onClick={() => setCorrectionRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Corrected Status</label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  <option value="PRESENT">Present</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Overtime Hours</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  step="0.5"
                  value={correctionOvertime}
                  onChange={(e) => setCorrectionOvertime(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Correction (Required for Audit Trail) *
                </label>
                <textarea
                  rows="3"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Worker was on morning biometric log but missed afternoon badge reader."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectionRecord(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {correcting ? "Saving..." : "Save Correction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
