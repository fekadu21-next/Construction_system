import { useState, useEffect } from "react";
import { hrApi } from "../../services/hrApi.js";
import { ATTENDANCE_STATUSES } from "../../constants/hrConstants.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AttendancePage() {
  const { isDark } = useTheme();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectId, setProjectId] = useState("all");
  const [projects, setProjects] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [date, projectId]);

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

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrApi.getAttendance({ date, projectId });
      if (res.success) {
        setRoster(res.data?.roster || []);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  const updateWorkerStatus = (employeeId, status) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.employee.id === employeeId ? { ...item, status } : item
      )
    );
  };

  const updateWorkerOvertime = (employeeId, overtimeHours) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.employee.id === employeeId ? { ...item, overtimeHours } : item
      )
    );
  };

  const updateWorkerNotes = (employeeId, notes) => {
    setRoster((prev) =>
      prev.map((item) =>
        item.employee.id === employeeId ? { ...item, notes } : item
      )
    );
  };

  const handleMarkAll = (status) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const records = roster.map((item) => ({
        employeeId: item.employee.id,
        projectId: item.employee.assignedProjectId || (projectId !== "all" ? projectId : null),
        status: item.status,
        overtimeHours: item.overtimeHours ? Number(item.overtimeHours) : 0,
        notes: item.notes || null,
      }));

      const res = await hrApi.recordAttendance({
        date,
        projectId: projectId !== "all" ? projectId : null,
        records,
      });

      if (res.success) {
        setSuccess(`Successfully saved attendance records for ${records.length} workers.`);
        fetchAttendance();
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message || "Failed to record attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((r) => ["PRESENT", "HALF_DAY", "LATE"].includes(r.status)).length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const totalOvertime = roster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Site Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log worker presence, track overtime hours, and record site labor logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAttendance}
            disabled={saving || roster.length === 0}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>💾</span> {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="font-semibold text-xs ml-4">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-semibold text-xs ml-4">✕</button>
        </div>
      )}

      {/* Controls Bar */}
      <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Filter Project Site</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              <option value="all">All Sites & Workers</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2 pt-4 sm:pt-0">
            <span className="text-xs font-semibold uppercase text-slate-400 mr-2">Quick Mark:</span>
            <button
              type="button"
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Present Workers</p>
            <p className="text-2xl font-bold text-emerald-500 mt-0.5">{presentCount} <span className="text-xs text-slate-400 font-normal">/ {roster.length}</span></p>
          </div>
          <span className="text-2xl">✅</span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Absent Workers</p>
            <p className="text-2xl font-bold text-rose-500 mt-0.5">{absentCount}</p>
          </div>
          <span className="text-2xl">❌</span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Overtime Hours</p>
            <p className="text-2xl font-bold text-blue-500 mt-0.5">{totalOvertime} <span className="text-xs text-slate-400 font-normal">hrs</span></p>
          </div>
          <span className="text-2xl">⏱️</span>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className={`text-xs uppercase tracking-wider border-b ${
              isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
            }`}>
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Worker</th>
                <th className="px-5 py-3.5">Trade & Site</th>
                <th className="px-5 py-3.5">Attendance Status</th>
                <th className="px-5 py-3.5">Overtime (Hours)</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading worker roster for {date}...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No active employees found to record attendance.
                  </td>
                </tr>
              ) : (
                roster.map((item) => (
                  <tr key={item.employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.employee.employeeCode}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.employee.fullName}</div>
                      <div className="text-xs text-slate-400">{item.employee.phone}</div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <div className="font-medium capitalize">{item.employee.trade.replace(/_/g, " ").toLowerCase()}</div>
                      <div className="text-slate-400">{item.employee.assignedProject?.projectName || "Unassigned"}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="relative inline-block w-40">
                        <select
                          value={item.status}
                          onChange={(e) => updateWorkerStatus(item.employee.id, e.target.value)}
                          className={`w-full py-1.5 pl-3 pr-8 rounded-xl text-xs font-semibold border appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            item.status === "PRESENT"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                              : item.status === "ABSENT"
                              ? "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                              : item.status === "HALF_DAY"
                              ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                              : item.status === "LATE"
                              ? "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800"
                              : "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                          }`}
                        >
                          {ATTENDANCE_STATUSES.map((st) => (
                            <option
                              key={st.value}
                              value={st.value}
                              className={isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-800"}
                            >
                              {st.label === "Present" ? "🟢 Present" :
                               st.label === "Absent" ? "🔴 Absent" :
                               st.label === "Half Day" ? "🟡 Half Day" :
                               st.label === "Late" ? "🟠 Late" : "🔵 On Leave"}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-xs opacity-60">
                          ▾
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={item.overtimeHours || ""}
                        onChange={(e) => updateWorkerOvertime(item.employee.id, e.target.value)}
                        placeholder="0.0"
                        className={`w-20 px-2.5 py-1 rounded-lg text-xs border text-center font-semibold focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                        }`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={item.notes || ""}
                        onChange={(e) => updateWorkerNotes(item.employee.id, e.target.value)}
                        placeholder="Optional note..."
                        className={`w-full min-w-[120px] px-2.5 py-1 rounded-lg text-xs border focus:ring-2 focus:ring-emerald-500 ${
                          isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400"
                        }`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
