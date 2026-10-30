import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hrApi } from "../../services/hrApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function WorkforceAvailabilityPage() {
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    categories: { available: [], assigned: [], onLeave: [], unavailable: [] },
    counts: { total: 0, available: 0, assigned: 0, onLeave: 0, unavailable: 0 },
    shortages: [],
  });
  const [activeTab, setActiveTab] = useState("available"); // available, assigned, onLeave, unavailable
  const [search, setSearch] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("ALL");
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const trades = [
    { value: "ALL", label: "All Trades & Skills" },
    { value: "GENERAL_LABORER", label: "General Laborer" },
    { value: "CARPENTER", label: "Carpenter" },
    { value: "MASON", label: "Mason" },
    { value: "STEEL_FIXER", label: "Steel Fixer" },
    { value: "ELECTRICIAN", label: "Electrician" },
    { value: "PLUMBER", label: "Plumber" },
    { value: "PAINTER", label: "Painter" },
    { value: "WELDER", label: "Welder" },
    { value: "SCAFFOLDER", label: "Scaffolder" },
    { value: "HEAVY_OPERATOR", label: "Heavy Equipment Operator" },
    { value: "SITE_HELPER", label: "Site Helper" },
  ];

  useEffect(() => {
    loadAvailability();
  }, [search, selectedTrade]);

  const loadAvailability = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.getAvailability({
        search,
        trade: selectedTrade,
      });
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setStatusMsg({ text: res.error || "Failed to load workforce availability", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to load availability", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const counts = data?.counts || data?.metrics || {
    total: 0,
    available: 0,
    assigned: 0,
    onLeave: 0,
    unavailable: 0,
  };
  const categories = data?.categories || data?.workers || {
    available: [],
    assigned: [],
    onLeave: [],
    unavailable: [],
  };
  const shortages = data?.shortages || data?.projectShortages || [];
  const currentList = Array.isArray(categories[activeTab]) ? categories[activeTab] : [];

  const formatTrade = (trade) => {
    if (!trade) return "Laborer";
    return trade.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧭</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Workforce Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Workforce Availability
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Real-time availability tracking across construction trades. Assess available talent, active site assignments, authorized leaves, and shortages before deploying crew.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/hr/assignments"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>🚀</span>
            <span>Assign Available Worker</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Available */}
        <button
          type="button"
          onClick={() => setActiveTab("available")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "available"
              ? "ring-2 ring-emerald-500 bg-emerald-950/30 border-emerald-500/50"
              : isDark
              ? "bg-[#061e1a] border-emerald-900/40 hover:border-emerald-700/60"
              : "bg-emerald-50/60 border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-500 dark:text-emerald-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Available for Site</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {counts.available}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Ready for deployment
          </div>
        </button>

        {/* Assigned */}
        <button
          type="button"
          onClick={() => setActiveTab("assigned")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "assigned"
              ? "ring-2 ring-blue-500 bg-blue-950/30 border-blue-500/50"
              : isDark
              ? "bg-[#0c182e] border-blue-900/40 hover:border-blue-700/60"
              : "bg-blue-50/60 border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between text-blue-500 dark:text-blue-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Currently Assigned</span>
            <span className="text-base">📍</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {counts.assigned}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active on site projects
          </div>
        </button>

        {/* On Leave */}
        <button
          type="button"
          onClick={() => setActiveTab("onLeave")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "onLeave"
              ? "ring-2 ring-purple-500 bg-purple-950/30 border-purple-500/50"
              : isDark
              ? "bg-[#180f28] border-purple-900/40 hover:border-purple-700/60"
              : "bg-purple-50/60 border-purple-200"
          }`}
        >
          <div className="flex items-center justify-between text-purple-500 dark:text-purple-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">On Approved Leave</span>
            <span className="text-base">🏖️</span>
          </div>
          <div className="text-2xl font-black text-purple-500 dark:text-purple-400">
            {counts.onLeave}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">
            Leave records verified
          </div>
        </button>

        {/* Inactive / Unavailable */}
        <button
          type="button"
          onClick={() => setActiveTab("unavailable")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "unavailable"
              ? "ring-2 ring-slate-500 bg-slate-800/40 border-slate-600"
              : isDark
              ? "bg-[#0f172a] border-slate-800 hover:border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Unavailable / Inactive</span>
            <span className="text-base">🔒</span>
          </div>
          <div className="text-2xl font-black text-slate-400">
            {counts.unavailable}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Suspended or terminated
          </div>
        </button>
      </div>

      {/* Shortage Radar & Recommendations */}
      {shortages && shortages.length > 0 && (
        <div className={`p-4 rounded-2xl border ${
          isDark ? "bg-[#1e140a] border-amber-800/50 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="font-bold text-sm">Site Workforce Shortage Alerts</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {shortages.length} Alert{shortages.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shortages.map((shortage, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-black/20 border border-amber-500/20 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white">{shortage.projectName}</div>
                  <div className="text-amber-400 text-[11px] mt-0.5">
                    Needs: <strong>{shortage.neededRole}</strong> ({shortage.deficitCount} worker{shortage.deficitCount > 1 ? "s" : ""})
                  </div>
                </div>
                <Link
                  to={`/hr/assignments?projectId=${shortage.projectId}&trade=${shortage.neededTrade || ""}`}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
                >
                  Fulfill →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
            statusMsg.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
              : "border-rose-500/30 bg-rose-950/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg({ text: "", type: "" })}
            className="text-xs uppercase font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDark ? "bg-[#091122] border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by worker name, code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-64 pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-hidden ${
                isDark
                  ? "bg-[#0c1527] border-slate-700 text-slate-200 placeholder-slate-500 focus:border-emerald-500"
                  : "bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400"
              }`}
            />
            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">🔍</span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Trade Filter */}
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-hidden ${
              isDark
                ? "bg-[#0c1527] border-slate-700 text-slate-200"
                : "bg-slate-50 border-slate-300 text-slate-800"
            }`}
          >
            {trades.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{currentList.length}</strong> personnel in category
        </div>
      </div>

      {/* Workers Roster Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#070c18] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#091122] text-[11px] font-bold uppercase tracking-wider text-[#8da2be]">
                <th className="py-3 px-4">WORKER</th>
                <th className="py-3 px-3">TRADE / SKILL</th>
                <th className="py-3 px-3">STATUS & ELIGIBILITY</th>
                <th className="py-3 px-3">CURRENT LOCATION</th>
                <th className="py-3 px-3">DATES / LEAVE</th>
                <th className="py-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading workforce roster...</span>
                    </div>
                  </td>
                </tr>
              ) : currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-1">
                      <span className="text-3xl block">👥</span>
                      <p className="font-semibold text-slate-300">
                        No workers found under &quot;{activeTab}&quot; category
                      </p>
                      <p className="text-xs text-slate-500">
                        Try adjusting your search criteria or switch to another availability tab.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentList.map((worker) => (
                  <tr key={worker.id} className="hover:bg-[#0c162b]/70 transition-colors">
                    {/* Worker Info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30 shrink-0">
                          {worker.fullName ? worker.fullName.charAt(0).toUpperCase() : "W"}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{worker.fullName}</div>
                          <div className="text-[11px] font-mono text-emerald-400">{worker.employeeCode}</div>
                        </div>
                      </div>
                    </td>

                    {/* Trade */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{formatTrade(worker.trade)}</div>
                      <div className="text-[10px] text-slate-400">ETB {worker.dailyRate || 400}/day</div>
                    </td>

                    {/* Eligibility Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {activeTab === "available" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Eligible for Site Assignment
                        </span>
                      )}
                      {activeTab === "assigned" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Active on Site
                        </span>
                      )}
                      {activeTab === "onLeave" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          On Approved {worker.activeLeave?.leaveType || "Leave"}
                        </span>
                      )}
                      {activeTab === "unavailable" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Status: {worker.status}
                        </span>
                      )}
                    </td>

                    {/* Current Location / Project */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {worker.assignedProject ? (
                        <div>
                          <div className="font-semibold text-white">{worker.assignedProject.projectName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {worker.assignedProject.location || worker.assignedProject.projectCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Unassigned (Pool)</span>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {worker.activeLeave ? (
                        <div className="text-[11px] text-purple-300">
                          <span>
                            {new Date(worker.activeLeave.startDate).toLocaleDateString()} -{" "}
                            {new Date(worker.activeLeave.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : worker.assignmentStartDate ? (
                        <div className="text-[11px] text-slate-300">
                          <span>Since: {new Date(worker.assignmentStartDate).toLocaleDateString()}</span>
                          {worker.assignmentEndDate && (
                            <span className="block text-[10px] text-slate-500">
                              Until: {new Date(worker.assignmentEndDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-medium">Immediate deployment</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      {activeTab === "available" && (
                        <Link
                          to={`/hr/assignments?workerId=${worker.id}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Assign →
                        </Link>
                      )}
                      {activeTab === "assigned" && (
                        <Link
                          to={`/hr/assignments?workerId=${worker.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs transition-colors"
                        >
                          Transfer / View
                        </Link>
                      )}
                      {(activeTab === "onLeave" || activeTab === "unavailable") && (
                        <Link
                          to={`/hr/workers?search=${worker.employeeCode}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                        >
                          View Worker
                        </Link>
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
  );
}
