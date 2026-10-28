import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Building2,
  HardHat,
  Briefcase,
  Phone,
  Mail,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
  RefreshCw,
  Loader2,
  Award,
} from "lucide-react";
import { projectManagerService } from "../../services/projectManagerService.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function WorkforceOverviewPage() {
  const { isDark } = useTheme();

  // State
  const [workers, setWorkers] = useState([]);
  const [summary, setSummary] = useState({
    totalWorkers: 0,
    activeOnSiteToday: 0,
    onLeaveToday: 0,
    availableOffDuty: 0,
    tradesCount: 0,
    tradeBreakdown: {},
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedTrade, setSelectedTrade] = useState("ALL");
  const [selectedAvailability, setSelectedAvailability] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectManagerService.getWorkforce({
        projectId: selectedProject !== "ALL" ? selectedProject : undefined,
      });

      if (res?.success && res.data) {
        setWorkers(res.data.workers || []);
        setSummary(res.data.summary || {});
        setProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load workforce:", err);
      setError("Unable to load workforce records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  // Unique trades
  const uniqueTrades = useMemo(() => {
    const set = new Set();
    workers.forEach((w) => {
      if (w.trade) set.add(w.trade);
    });
    return Array.from(set).sort();
  }, [workers]);

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchTrade = selectedTrade === "ALL" || w.trade === selectedTrade;
      const matchAvailability =
        selectedAvailability === "ALL" || w.availability === selectedAvailability;
      const matchSearch =
        !searchQuery ||
        w.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.trade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.project?.projectName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTrade && matchAvailability && matchSearch;
    });
  }, [workers, selectedTrade, selectedAvailability, searchQuery]);

  // Availability badge helper
  const getAvailabilityBadge = (availability) => {
    switch (availability) {
      case "ACTIVE_ON_SITE":
        return {
          label: "Active On Site",
          className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
          icon: <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />,
        };
      case "ON_LEAVE":
        return {
          label: "On Approved Leave",
          className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "ABSENT":
        return {
          label: "Absent",
          className: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
        };
      case "AVAILABLE":
      default:
        return {
          label: "Available / Off Duty",
          className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workforce Overview</h1>
              <p className="text-sm text-slate-400">
                Track assigned workers, roles, live site attendance, and team availability across projects.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
            isDark
              ? "bg-[#0d1c33] border-slate-700 text-slate-200 hover:bg-[#122544]"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          Refresh Status
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Total Assigned Workforce</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold">{summary.totalWorkers || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Across assigned projects</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Active On Site Today</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{summary.activeOnSiteToday || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Verified via attendance logs</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Available / Off Duty</span>
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{summary.availableOffDuty || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Ready for assignment</div>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? "bg-[#0d1c33]/70 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>On Approved Leave</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{summary.onLeaveToday || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Temporary site absence</div>
        </div>
      </div>

      {/* Trade Breakdown Chips */}
      {summary.tradeBreakdown && Object.keys(summary.tradeBreakdown).length > 0 && (
        <div
          className={`p-4 rounded-xl border space-y-2.5 ${
            isDark ? "bg-[#0d1c33]/50 border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Trade Allocation Breakdown</span>
            <span>{Object.keys(summary.tradeBreakdown).length} Specialist Trades</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.tradeBreakdown).map(([trade, count]) => (
              <button
                key={trade}
                onClick={() => setSelectedTrade(selectedTrade === trade ? "ALL" : trade)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  selectedTrade === trade
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : isDark
                    ? "bg-[#08182e] border-slate-700/80 text-slate-300 hover:border-slate-600"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>{trade}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    selectedTrade === trade ? "bg-white/20 text-white" : "bg-slate-700/40 text-blue-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
              placeholder="Search by worker name, ID code, or trade..."
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

          {/* Trade Filter */}
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDark ? "bg-[#08182e] border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
            }`}
          >
            <option value="ALL">All Trades</option>
            {uniqueTrades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className={`px-3 py-2 text-sm rounded-lg border outline-none ${
              isDark ? "bg-[#08182e] border-slate-700 text-slate-200" : "bg-slate-50 border-slate-300 text-slate-800"
            }`}
          >
            <option value="ALL">All Availability Statuses</option>
            <option value="ACTIVE_ON_SITE">Active On Site</option>
            <option value="AVAILABLE">Available / Off Duty</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-blue-400">{filteredWorkers.length}</span> of {workers.length} workers
        </div>
      </div>

      {/* Workers Table */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading project workforce and live attendance...</p>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div
          className={`p-16 rounded-2xl border text-center ${
            isDark ? "bg-[#0d1c33]/40 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No workers found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or filter options to view workforce allocations.
          </p>
        </div>
      ) : (
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
                  <th className="py-3 px-4 font-semibold">Worker Details</th>
                  <th className="py-3 px-4 font-semibold">Trade / Specialization</th>
                  <th className="py-3 px-4 font-semibold">Assigned Project</th>
                  <th className="py-3 px-4 font-semibold">Today's Availability</th>
                  <th className="py-3 px-4 font-semibold">Shift Hours</th>
                  <th className="py-3 px-4 font-semibold">Employment</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredWorkers.map((w) => {
                  const badge = getAvailabilityBadge(w.availability);

                  return (
                    <tr
                      key={w.id}
                      className={`transition-colors ${
                        isDark ? "hover:bg-[#08182e]/60" : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {w.fullName
                              ? w.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "W"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">{w.fullName}</div>
                            <div className="text-xs text-slate-400 font-mono">{w.employeeCode}</div>
                          </div>
                        </div>
                      </td>

                      {/* Trade */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <HardHat className="w-3.5 h-3.5 text-blue-400" />
                          <span>{w.trade}</span>
                        </div>
                      </td>

                      {/* Assigned Project */}
                      <td className="py-3.5 px-4">
                        {w.project ? (
                          <div className="text-xs">
                            <span className="font-semibold text-blue-400">{w.project.projectName}</span>
                            <div className="text-[10px] text-slate-400 font-mono">{w.project.projectCode}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Availability Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Shift Hours / Check-in */}
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {w.todayAttendance ? (
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              <span>{w.todayAttendance.workHours} hrs</span>
                              {w.todayAttendance.overtimeHours > 0 && (
                                <span className="text-amber-400 text-[10px]">
                                  (+{w.todayAttendance.overtimeHours} OT)
                                </span>
                              )}
                            </div>
                            {w.todayAttendance.checkInTime && (
                              <div className="text-[10px] text-slate-400">
                                In: {w.todayAttendance.checkInTime}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Employment Type */}
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-semibold">
                          {w.employmentType ? w.employmentType.replace("_", " ") : "DAILY LABORER"}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {w.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{w.phone}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
