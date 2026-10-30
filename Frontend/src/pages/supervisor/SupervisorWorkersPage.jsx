import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorWorkersPage() {
  const { isDark } = useTheme();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, PENDING_APPROVAL, ON_LEAVE
  const [showFormModal, setShowFormModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    trade: "GENERAL_LABORER",
    dailyRate: 400,
    workTeam: "Main Team",
    nationalId: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const trades = [
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
    loadProjects();
  }, []);

  useEffect(() => {
    if (location.pathname.includes("register-workers") || location.search.includes("action=register")) {
      setShowFormModal(true);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (selectedProjectId) {
      loadWorkers(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await supervisorApi.getProjects();
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setSelectedProjectId(res.data[0].id);
      } else {
        setProjects([]);
        setSelectedProjectId("");
        setWorkers([]);
        setLoading(false);
      }
    } catch {
      setStatusMsg({ text: "Failed to load assigned project", type: "error" });
      setLoading(false);
    }
  };

  const loadWorkers = async (projectId) => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await supervisorApi.getProjectWorkers(projectId);
      if (res.success) {
        // Exclude supervisors from worker list
        const siteLaborers = (res.data.workers || []).filter(
          (w) => w.trade !== "SUPERVISOR" && w.trade !== "SUPERVISER"
        );
        setWorkers(siteLaborers);
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch {
      setStatusMsg({ text: "Failed to load site workers", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setStatusMsg({ text: "Worker full name is required", type: "error" });
      return;
    }
    if (!selectedProjectId) {
      setStatusMsg({ text: "Please select an assigned project site", type: "error" });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ text: "", type: "" });

    try {
      const res = await supervisorApi.addDailyWorker(selectedProjectId, formData);
      if (res.success) {
        setStatusMsg({
          text: `✓ Worker ${res.data.fullName} (${res.data.employeeCode}) successfully registered on site! Sent to HR Manager for formal verification.`,
          type: "success",
        });
        setFormData({
          fullName: "",
          phone: "",
          trade: "GENERAL_LABORER",
          dailyRate: 400,
          workTeam: "Main Team",
          nationalId: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
        });
        setShowFormModal(false);
        await loadWorkers(selectedProjectId);
      } else {
        setStatusMsg({ text: res.error, type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to register worker", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTradeName = (val) => {
    const match = trades.find((t) => t.value === val);
    if (match) return match.label;
    return val?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Laborer";
  };

  // Filtered workers
  const filteredWorkers = workers.filter((w) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (w.fullName || "").toLowerCase().includes(q);
      const codeMatch = (w.employeeCode || "").toLowerCase().includes(q);
      const tradeMatch = (w.trade || "").toLowerCase().includes(q);
      const phoneMatch = (w.phone || "").toLowerCase().includes(q);
      if (!nameMatch && !codeMatch && !tradeMatch && !phoneMatch) return false;
    }
    if (statusFilter === "ACTIVE") return w.status === "ACTIVE";
    if (statusFilter === "PENDING_APPROVAL") return w.status === "PENDING_APPROVAL";
    if (statusFilter === "ON_LEAVE") return w.status === "ON_LEAVE";
    return true;
  });

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const activeCount = workers.filter((w) => w.status === "ACTIVE").length;
  const pendingCount = workers.filter((w) => w.status === "PENDING_APPROVAL").length;
  const onLeaveCount = workers.filter((w) => w.status === "ON_LEAVE").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Worker Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            View assigned workers and site roster. Register daily laborers and site tradesmen directly on location for HR verification and workforce tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFormModal(true)}
            disabled={!selectedProjectId}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>➕</span>
            <span> New Worker</span>
          </button>

        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0a1224] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Enrolled</span>
            <span className="text-base">👷‍♂️</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{workers.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Assigned to this site</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#061e1a] border-emerald-900/40" : "bg-emerald-50/60 border-emerald-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-emerald-500 dark:text-emerald-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Active Workers</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Ready for shift attendance</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#1f170a] border-amber-900/40" : "bg-amber-50/60 border-amber-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-amber-500 dark:text-amber-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Pending HR</span>
            <span className="text-base">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400">{pendingCount}</div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">Awaiting verification</div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0c182e] border-blue-900/40" : "bg-blue-50/60 border-blue-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-blue-500 dark:text-blue-400 text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">On Leave</span>
            <span className="text-base">🏖️</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{onLeaveCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Authorized leave</div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-md transition-all ${statusMsg.type === "success"
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

      {/* Filters and Site Lock Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "bg-[#091122] border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}>
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
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-hidden ${isDark
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

          {/* Search Bar */}
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Search Workers
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, code, trade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-hidden ${isDark
                  ? "bg-[#0c1527] border-slate-700/80 text-slate-200 placeholder-slate-500 focus:border-amber-500"
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

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#070e1c] border border-slate-800 text-xs self-start lg:self-center">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${statusFilter === "ALL" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
          >
            All ({workers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${statusFilter === "ACTIVE" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING_APPROVAL")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${statusFilter === "PENDING_APPROVAL" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
          >
            Pending HR ({pendingCount})
          </button>
        </div>
      </div>

      {/* Workers Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${isDark ? "bg-[#091122] border-slate-800" : "bg-white border-slate-200"
        }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${isDark ? "bg-[#070d1a] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Worker Code</th>
                <th className="py-3 px-4">Trade & Role</th>
                <th className="py-3 px-4">Work Team</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Daily Wage Rate</th>
                <th className="py-3 px-4">HR Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading site workers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">👷‍♂️</span>
                      <p className="text-sm font-semibold text-slate-400">No site workers found</p>
                      <button
                        type="button"
                        onClick={() => setShowFormModal(true)}
                        className="text-xs font-bold text-amber-500 hover:underline mt-1"
                      >
                        + Register the first worker for this site
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => (
                  <tr
                    key={w.id}
                    className={`transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {w.fullName?.charAt(0) || "W"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {w.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {w.employmentType?.replace(/_/g, " ") || "Daily Laborer"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-emerald-500 font-bold">
                      {w.employeeCode}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {formatTradeName(w.trade)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {w.workTeam || "Main Team"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                      {w.phone || "—"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-200">
                      {w.dailyRate ? `${Number(w.dailyRate).toLocaleString()} ETB` : "Standard Rate"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {w.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending HR Approval
                        </span>
                      ) : w.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                          {w.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER WORKER MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 transition-all ${isDark ? "bg-[#0b172d] border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900"
              }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">👷‍♂️</span>
                <h3 className="text-lg font-bold">Register Daily Worker</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Site: <span className="font-bold text-amber-500">{activeProject?.projectName}</span> ({activeProject?.projectCode}). New workers will be automatically submitted to the HR Manager for verification.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Worker Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abebe Bikila"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/40 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Trade / Skill <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.trade}
                    onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/40 outline-hidden"
                  >
                    {trades.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="0911223344"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/40 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Daily Wage Rate (ETB)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    placeholder="400"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/40 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Work Team / Crew
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Masonry Team"
                    value={formData.workTeam}
                    onChange={(e) => setFormData({ ...formData, workTeam: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/40 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  National ID / Kebele ID
                </label>
                <input
                  type="text"
                  placeholder="Optional ID / Kebele Number"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/40 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Enrolling Worker..." : "Register Worker & Submit to HR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

