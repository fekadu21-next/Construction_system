import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hrApi } from "../../services/hrApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function HRDashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const fetchDashboardData = async (date) => {
    setLoading(true);
    setError("");
    try {
      const res = await hrApi.getOverview({ date });
      if (res.success && res.data) {
        setData(res.data);
      } else {
        // Fallback to metrics endpoint
        const metricsRes = await hrApi.getMetrics();
        if (metricsRes.success) {
          setData(metricsRes.data);
        } else {
          setError(res.error || metricsRes.error || "Failed to load HR dashboard data");
        }
      }
    } catch {
      setError("Failed to load HR dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const cards = data?.cards || {
    totalWorkers: data?.totalEmployees || 0,
    activeWorkers: data?.activeEmployees || 0,
    pendingTemporaryRequests: data?.pendingTemporaryRequests || 0,
    activeAssignments: data?.activeAssignments || 0,
    unassignedWorkers: data?.unassignedWorkers || 0,
    presentToday: data?.presentToday || 0,
    absentToday: data?.absentToday || 0,
    missingAttendanceSubmissions: data?.missingAttendanceSubmissions || 0,
  };

  const attendanceSummary = data?.attendanceSummary || {
    present: cards.presentToday || 0,
    absent: cards.absentToday || 0,
    late: 0,
    halfDay: 0,
    onLeave: data?.onLeaveEmployees || 0,
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome & Quick Action Header */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isDark
            ? "bg-gradient-to-r from-slate-900 via-[#0d1f33] to-slate-900 border-slate-800"
            : "bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-100 shadow-xs"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
              Central HR Management Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.fullName || "HR Manager"} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time workforce activity, site presence, assignments, and temporary labor requests across all authorized construction projects.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between shadow-xs">
          <span>⚠️ {error}</span>
          <button
            onClick={() => fetchDashboardData(selectedDate)}
            className="underline font-bold text-xs hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* 8 Primary Dashboard Metrics Cards (Organized into 2 rows of 4 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1: Total Workers */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Workers</span>
            <span className="text-base">👥</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {cards.totalWorkers}
          </div>
          <div className="text-xs text-slate-500 mt-1">Enrolled workforce</div>
        </div>

        {/* 2: Active Workers */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? "bg-[#07191d] border-emerald-900/40" : "bg-emerald-50/60 border-emerald-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center justify-between">
            <span>Active Workers</span>
            <span className="text-base">🟢</span>
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-2">
            {cards.activeWorkers}
          </div>
          <div className="text-xs text-slate-500 mt-1">Ready for site work</div>
        </div>

        {/* 3: Pending Temporary Worker Requests */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          cards.pendingTemporaryRequests > 0
            ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
            : isDark
            ? "bg-[#14151f] border-slate-800"
            : "bg-white border-slate-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider flex items-center justify-between text-amber-500">
            <span>Pending Requests</span>
            <span className="text-base">📋</span>
          </div>
          <div className="text-2xl font-black text-amber-500 mt-2">
            {cards.pendingTemporaryRequests}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/hr/approvals" className="hover:underline text-amber-400 font-semibold">
              Needs review →
            </Link>
          </div>
        </div>

        {/* 4: Active Assignments */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? "bg-[#09152b] border-blue-900/40" : "bg-blue-50/60 border-blue-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
            <span>Assignments</span>
            <span className="text-base">🏗️</span>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {cards.activeAssignments}
          </div>
          <div className="text-xs text-slate-500 mt-1">Active on project sites</div>
        </div>

        {/* 5: Unassigned Workers */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? "bg-[#161224] border-purple-900/40" : "bg-purple-50/60 border-purple-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
            <span>Unassigned</span>
            <span className="text-base">🏖️</span>
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">
            {cards.unassignedWorkers}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/hr/assignments" className="hover:underline text-purple-400 font-semibold">
              Assign to site →
            </Link>
          </div>
        </div>

        {/* 6: Present Today */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? "bg-[#081e18] border-teal-900/40" : "bg-teal-50/60 border-teal-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center justify-between">
            <span>Present Today</span>
            <span className="text-base">✓</span>
          </div>
          <div className="text-2xl font-black text-teal-400 mt-2">
            {cards.presentToday}
          </div>
          <div className="text-xs text-slate-500 mt-1">On-site attendance</div>
        </div>

        {/* 7: Absent Today */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? "bg-[#210e14] border-rose-900/40" : "bg-rose-50/60 border-rose-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Absent Today</span>
            <span className="text-base">✕</span>
          </div>
          <div className="text-2xl font-black text-rose-500 mt-2">
            {cards.absentToday}
          </div>
          <div className="text-xs text-slate-500 mt-1">Logged as absent</div>
        </div>

        {/* 8: Missing Attendance Submissions */}
        <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
          cards.missingAttendanceSubmissions > 0
            ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
            : isDark
            ? "bg-[#181124] border-slate-800"
            : "bg-white border-slate-200 shadow-2xs"
        }`}>
          <div className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center justify-between">
            <span>Missing Submissions</span>
            <span className="text-base">⚠️</span>
          </div>
          <div className="text-2xl font-black text-orange-400 mt-2">
            {cards.missingAttendanceSubmissions}
          </div>
          <div className="text-xs text-slate-500 mt-1">Unsubmitted records</div>
        </div>
      </div>

      {/* Missing Submissions Alert Notice (Distinguishing from Absent records) */}
      {data?.missingSubmissionsList?.length > 0 && (
        <div className="p-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <h4 className="font-bold text-sm text-orange-300">
                {data.missingSubmissionsList.length} Site(s) have Not Submitted Daily Attendance for {selectedDate}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Note: Missing records are unrecorded shifts, distinct from workers formally marked as Absent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/hr/attendance"
              className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Inspect Site Sheets →
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Activity & Attendance Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Attendance Breakdown Visualizer */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Daily Site Presence Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified shift presence logs across active construction projects on {selectedDate}.
                </p>
              </div>
              <Link to="/hr/attendance" className="text-xs font-bold text-emerald-400 hover:underline">
                Full Attendance Log →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs text-slate-400 block font-medium">Present</span>
                <span className="text-xl font-black text-emerald-400">{attendanceSummary.present}</span>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                <span className="text-xs text-slate-400 block font-medium">Late</span>
                <span className="text-xl font-black text-orange-400">{attendanceSummary.late}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs text-slate-400 block font-medium">Half-Day</span>
                <span className="text-xl font-black text-amber-400">{attendanceSummary.halfDay}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-xs text-slate-400 block font-medium">Absent</span>
                <span className="text-xl font-black text-rose-400">{attendanceSummary.absent}</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-400 block font-medium">On Leave</span>
                <span className="text-xl font-black text-blue-400">{attendanceSummary.onLeave}</span>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            {cards.totalWorkers > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Workforce Reporting Rate</span>
                  <span className="font-bold text-emerald-400">
                    {Math.round(((cards.presentToday + cards.absentToday) / Math.max(1, cards.totalWorkers)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    style={{ width: `${(cards.presentToday / Math.max(1, cards.totalWorkers)) * 100}%` }}
                    className="bg-emerald-500 h-full"
                    title="Present"
                  />
                  <div
                    style={{ width: `${(cards.absentToday / Math.max(1, cards.totalWorkers)) * 100}%` }}
                    className="bg-rose-500 h-full"
                    title="Absent"
                  />
                  <div
                    style={{ width: `${(cards.missingAttendanceSubmissions / Math.max(1, cards.totalWorkers)) * 100}%` }}
                    className="bg-orange-500 h-full"
                    title="Missing"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recent Assignment Activity */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Recent Site Assignments & Transfers</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest worker project allocations and movements</p>
              </div>
              <Link to="/hr/assignments" className="text-xs font-bold text-blue-400 hover:underline">
                View All Assignments →
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading assignments...</div>
            ) : data?.recentAssignments?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No recent assignment records found.</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data?.recentAssignments?.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
                        🏗️
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">{a.workerName}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {a.workerCode} • {a.trade}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-300 truncate max-w-[180px]">{a.projectName}</div>
                      <div className="text-[10px] text-slate-500">📍 {a.location || "Active Site"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Worker Registrations */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Recent Worker Registrations</h3>
                <p className="text-xs text-slate-400 mt-0.5">Newly enrolled workforce entries</p>
              </div>
              <Link to="/hr/workers" className="text-xs font-bold text-emerald-400 hover:underline">
                Manage All Workers →
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading workers...</div>
            ) : data?.recentRegistrations?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No recent workers registered.</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data?.recentRegistrations?.map((emp) => (
                  <div key={emp.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                        {emp.fullName?.charAt(0) || "W"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white truncate">{emp.fullName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          {emp.employeeCode} • {emp.trade}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        emp.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      }`}>
                        {emp.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">{emp.projectName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pending Approvals & Ending Assignments */}
        <div className="space-y-6">
          {/* Pending Temporary Worker Requests */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>📋</span> Temporary Approvals
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Field worker registrations awaiting HR review</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
                {cards.pendingTemporaryRequests}
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-500 text-xs">Loading requests...</div>
            ) : data?.pendingRequests?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <span className="text-2xl block mb-1">🎉</span>
                No pending temporary worker requests!
              </div>
            ) : (
              <div className="space-y-3">
                {data?.pendingRequests?.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">{r.fullName}</div>
                      <div className="text-[10px] text-amber-400 font-medium truncate">
                        {r.trade} • {r.projectName}
                      </div>
                    </div>
                    <Link
                      to="/hr/approvals"
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                ))}
                <Link
                  to="/hr/approvals"
                  className="block text-center text-xs font-bold text-amber-400 hover:underline pt-2"
                >
                  View All Temporary Approvals →
                </Link>
              </div>
            )}
          </div>

          {/* Assignments Ending Soon */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <span>⏱️</span> Ending Within 14 Days
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Upcoming assignment terminations or extensions</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs">
                {data?.assignmentsEndingSoon?.length || 0}
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-500 text-xs">Loading deadlines...</div>
            ) : data?.assignmentsEndingSoon?.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active assignments ending in the next 14 days.
              </div>
            ) : (
              <div className="space-y-3">
                {data?.assignmentsEndingSoon?.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-2xl border border-slate-800 bg-[#080e1e] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">{a.workerName}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {a.trade} • {a.projectName}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-rose-400 block">
                        {a.daysRemaining}d left
                      </span>
                      <Link
                        to="/hr/assignments"
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        Reassign
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts & Navigation Panel */}
          <div className={`p-6 rounded-3xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <h3 className="font-bold text-sm mb-3">Workforce Operations Quick Access</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/hr/workers"
                className="p-3 rounded-xl border border-slate-800 hover:border-emerald-500/40 bg-slate-900/60 hover:bg-slate-800/80 transition-colors block text-center"
              >
                <span className="text-xl block mb-1">👷</span>
                <span className="font-semibold text-white">Workers Roster</span>
              </Link>

              <Link
                to="/hr/approvals"
                className="p-3 rounded-xl border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 hover:bg-slate-800/80 transition-colors block text-center"
              >
                <span className="text-xl block mb-1">📋</span>
                <span className="font-semibold text-white">Approvals</span>
              </Link>

              <Link
                to="/hr/assignments"
                className="p-3 rounded-xl border border-slate-800 hover:border-blue-500/40 bg-slate-900/60 hover:bg-slate-800/80 transition-colors block text-center"
              >
                <span className="text-xl block mb-1">🏗️</span>
                <span className="font-semibold text-white">Assignments</span>
              </Link>

              <Link
                to="/hr/availability"
                className="p-3 rounded-xl border border-slate-800 hover:border-purple-500/40 bg-slate-900/60 hover:bg-slate-800/80 transition-colors block text-center"
              >
                <span className="text-xl block mb-1">👥</span>
                <span className="font-semibold text-white">Availability</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
