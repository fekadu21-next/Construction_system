import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hrApi } from "../../services/hrApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AssignmentsPage() {
  const { isDark } = useTheme();

  const [assignments, setAssignments] = useState([]);
  const [metrics, setMetrics] = useState({ totalAssignments: 0, activeAssignments: 0, unassignedWorkers: 0 });
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [unassignedWorkersList, setUnassignedWorkersList] = useState([]);
  const [allWorkersList, setAllWorkersList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [transferModal, setTransferModal] = useState({ open: false, assignment: null });
  const [endModal, setEndModal] = useState({ open: false, assignment: null });
  const [historyModal, setHistoryModal] = useState({ open: false, worker: null, history: [] });

  // Form states
  const [createForm, setCreateForm] = useState({
    workerId: "",
    projectId: "",
    jobRole: "",
    workTeam: "Main Team",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  const [transferForm, setTransferForm] = useState({
    toProjectId: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    jobRole: "",
    workTeam: "Main Team",
    reason: "",
  });

  const [endForm, setEndForm] = useState({
    actualEndDate: new Date().toISOString().split("T")[0],
    reason: "Project site phase completed",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [statusFilter, projectFilter, searchQuery, pagination.page]);

  const loadAuxiliaryData = async () => {
    try {
      const [projRes, availRes, allWorkersRes] = await Promise.all([
        hrApi.getProjects(),
        hrApi.getAvailableWorkers(),
        hrApi.getEmployees({ limit: 100, status: "ACTIVE" }),
      ]);
      if (projRes.success && projRes.data.projects) setProjects(projRes.data.projects);
      if (availRes.success && availRes.data.workers) setUnassignedWorkersList(availRes.data.workers);
      if (allWorkersRes.success && allWorkersRes.data.employees) setAllWorkersList(allWorkersRes.data.employees);
    } catch {
      console.warn("Could not load supporting assignment data");
    }
  };

  const loadAssignments = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.getAssignments({
        status: statusFilter,
        projectId: projectFilter,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.success && res.data) {
        setAssignments(res.data.assignments || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: res.data.pagination.page,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          }));
        }
      } else {
        setStatusMsg({ text: res.error || "Failed to load assignments", type: "error" });
      }
    } catch {
      setStatusMsg({ text: "Failed to load project assignments", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!createForm.workerId || !createForm.projectId) {
      setStatusMsg({ text: "Please select both a worker and a project site", type: "error" });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.assignWorker({
        employeeId: createForm.workerId,
        projectId: createForm.projectId,
        jobRole: createForm.jobRole,
        workTeam: createForm.workTeam,
        startDate: createForm.startDate,
        endDate: createForm.endDate || null,
        notes: createForm.notes,
      });

      if (res.success) {
        setStatusMsg({ text: "✓ Worker successfully assigned to construction site project!", type: "success" });
        setCreateModal(false);
        setCreateForm({
          workerId: "",
          projectId: "",
          jobRole: "",
          workTeam: "Main Team",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          notes: "",
        });
        await loadAssignments();
        await loadAuxiliaryData();
      } else {
        setStatusMsg({ text: res.error || "Failed to create assignment", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to create assignment", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferWorker = async (e) => {
    e.preventDefault();
    if (!transferForm.toProjectId) {
      setStatusMsg({ text: "Please select a destination project site", type: "error" });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.transferWorker({
        employeeId: transferModal.assignment.employeeId,
        toProjectId: transferForm.toProjectId,
        effectiveDate: transferForm.effectiveDate,
        jobRole: transferForm.jobRole || transferModal.assignment.jobRole,
        workTeam: transferForm.workTeam,
        reason: transferForm.reason,
      });

      if (res.success) {
        setStatusMsg({ text: "✓ Worker successfully transferred! Previous assignment archived to history.", type: "success" });
        setTransferModal({ open: false, assignment: null });
        await loadAssignments();
        await loadAuxiliaryData();
      } else {
        setStatusMsg({ text: res.error || "Transfer failed", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Transfer failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndAssignment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.endAssignment(endModal.assignment.id, {
        actualEndDate: endForm.actualEndDate,
        reason: endForm.reason,
      });

      if (res.success) {
        setStatusMsg({ text: "✓ Assignment closed successfully. Worker availability recalculated.", type: "success" });
        setEndModal({ open: false, assignment: null });
        await loadAssignments();
        await loadAuxiliaryData();
      } else {
        setStatusMsg({ text: res.error || "Failed to end assignment", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to end assignment", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (assignment) => {
    try {
      const res = await hrApi.getWorkerAssignments(assignment.employeeId);
      setHistoryModal({
        open: true,
        worker: { name: assignment.workerName, code: assignment.workerCode, trade: assignment.workerTrade },
        history: res.success ? res.data.assignments : [],
      });
    } catch {
      setStatusMsg({ text: "Failed to load worker assignment history", type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 font-mono">
              Site Allocation &amp; Transfers Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Project &amp; Site Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Assign eligible workers to active construction sites, manage project transfers with preserved audit history, and prevent assignment conflicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>➕🏗️</span>
            <span>Create Assignment</span>
          </button>
          <Link
            to="/hr/availability"
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors"
          >
            <span>👥</span> Workforce Availability
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span>{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg({ text: "", type: "" })}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Assignments */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Assignments</span>
            <span className="text-lg">📜</span>
          </div>
          <div className="text-3xl font-black text-white">{metrics.totalAssignments}</div>
          <div className="text-xs text-slate-500 mt-1">Cumulative project site records</div>
        </div>

        {/* Active Assignments */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#09152b] border-blue-900/40" : "bg-blue-50/60 border-blue-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Active Assignments</span>
            <span className="text-lg">🏗️</span>
          </div>
          <div className="text-3xl font-black text-blue-400">{metrics.activeAssignments}</div>
          <div className="text-xs text-slate-500 mt-1">Currently on duty at active project sites</div>
        </div>

        {/* Unassigned Workers */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-[#181024] border-purple-900/40" : "bg-purple-50/60 border-purple-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Unassigned Workers</span>
            <span className="text-lg">🏖️</span>
          </div>
          <div className="text-3xl font-black text-purple-400">{metrics.unassignedWorkers}</div>
          <div className="text-xs text-slate-500 mt-1">
            <button
              onClick={() => setCreateModal(true)}
              className="text-purple-300 font-semibold hover:underline"
            >
              Assign available workers →
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by worker, project, trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-hidden w-64 ${
                isDark ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-300 text-slate-900"
              }`}
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-500">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-hidden ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-300"
            }`}
          >
            <option value="ALL">All Project Sites ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📍 {p.projectName} ({p.projectCode})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-hidden ${
              isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-300"
            }`}
          >
            <option value="ALL">All Assignment Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {(statusFilter !== "ALL" || projectFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setProjectFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{assignments.length}</strong> of {pagination.total} records
        </div>
      </div>

      {/* Assignments Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`text-[10px] font-bold uppercase tracking-wider border-b ${
              isDark ? "bg-slate-900/80 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <tr>
                <th className="py-3.5 px-4">Assigned Worker</th>
                <th className="py-3.5 px-4">Project Site</th>
                <th className="py-3.5 px-4">Role &amp; Team</th>
                <th className="py-3.5 px-3 text-center">Start Date</th>
                <th className="py-3.5 px-3 text-center">Expected End</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading project assignments...</span>
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <span className="text-3xl block mb-2">🏗️</span>
                    <p className="text-sm font-semibold text-slate-300">No project assignments found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click &quot;Create Assignment&quot; to allocate available workers to construction sites.
                    </p>
                  </td>
                </tr>
              ) : (
                assignments.map((a) => {
                  const isActive = a.status === "ACTIVE";
                  const isTransferred = a.status === "TRANSFERRED";

                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Worker Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {a.workerName ? a.workerName.charAt(0).toUpperCase() : "W"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate max-w-[160px]">
                              {a.workerName}
                            </div>
                            <div className="font-mono text-[10px] text-emerald-400">
                              {a.workerCode} • {a.workerPhone || a.workerTrade}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Project Site */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 text-xs truncate max-w-[200px]" title={a.projectName}>
                          📍 {a.projectName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {a.projectCode} • {a.projectLocation}
                        </div>
                      </td>

                      {/* Job Role & Team */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                          {a.jobRole}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {a.workTeam}
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="py-3.5 px-3 text-center text-xs font-mono text-slate-300 whitespace-nowrap">
                        {a.startDate ? new Date(a.startDate).toISOString().split("T")[0] : "—"}
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-3 text-center text-xs font-mono text-slate-400 whitespace-nowrap">
                        {a.endDate ? (
                          <span className="text-amber-400">
                            {new Date(a.endDate).toISOString().split("T")[0]}
                          </span>
                        ) : (
                          <span className="text-slate-600">Open-ended</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : isTransferred
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Action Controls */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isActive && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferModal({ open: true, assignment: a });
                                  setTransferForm({
                                    toProjectId: "",
                                    effectiveDate: new Date().toISOString().split("T")[0],
                                    jobRole: a.jobRole,
                                    workTeam: a.workTeam,
                                    reason: "",
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs transition-colors cursor-pointer"
                                title="Transfer to Another Construction Site"
                              >
                                ⇄ Transfer
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEndModal({ open: true, assignment: a });
                                  setEndForm({
                                    actualEndDate: new Date().toISOString().split("T")[0],
                                    reason: "Phase assignment completed",
                                  });
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                                title="End Assignment Cleanly"
                              >
                                End
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openHistoryModal(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Worker Assignment History"
                          >
                            📜
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <strong className="text-white">{pagination.page}</strong> of{" "}
            <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} records)
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors font-semibold"
            >
              ← Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors font-semibold"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Assignment */}
      {createModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-lg w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Site Assignment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Allocate an active, available worker to an authorized construction project site.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Select Eligible Worker
                </label>
                <select
                  required
                  value={createForm.workerId}
                  onChange={(e) => {
                    const selected = allWorkersList.find((w) => w.id === e.target.value);
                    setCreateForm({
                      ...createForm,
                      workerId: e.target.value,
                      jobRole: selected?.trade || createForm.jobRole,
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                >
                  <option value="">-- Choose Worker --</option>
                  {unassignedWorkersList.map((w) => (
                    <option key={w.id} value={w.id}>
                      🟢 [Available] {w.fullName} ({w.employeeCode} - {w.trade})
                    </option>
                  ))}
                  {allWorkersList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.fullName} ({w.employeeCode} - {w.trade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Destination Project Site
                </label>
                <select
                  required
                  value={createForm.projectId}
                  onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                >
                  <option value="">-- Choose Project Site --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📍 {p.projectName} ({p.projectCode}) - {p.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Job Role / Trade On Site
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mason / Rebar Lead"
                    value={createForm.jobRole}
                    onChange={(e) => setCreateForm({ ...createForm, jobRole: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Work Team / Gang
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Foundation Crew"
                    value={createForm.workTeam}
                    onChange={(e) => setCreateForm({ ...createForm, workTeam: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white scheme-dark outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Expected End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white scheme-dark outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Assignment Notes / Directives
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional supervisor instructions or site conditions..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Worker */}
      {transferModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Transfer Worker: {transferModal.assignment?.workerName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current Site: <strong className="text-blue-400">{transferModal.assignment?.projectName}</strong>.
              Transferring will archive current assignment and open a new active assignment.
            </p>

            <form onSubmit={handleTransferWorker} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Destination Project Site
                </label>
                <select
                  required
                  value={transferForm.toProjectId}
                  onChange={(e) => setTransferForm({ ...transferForm, toProjectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                >
                  <option value="">-- Choose Destination Site --</option>
                  {projects
                    .filter((p) => p.id !== transferModal.assignment?.projectId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        📍 {p.projectName} ({p.projectCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Effective Transfer Date
                  </label>
                  <input
                    type="date"
                    required
                    value={transferForm.effectiveDate}
                    onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white scheme-dark outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Job Role at New Site
                  </label>
                  <input
                    type="text"
                    value={transferForm.jobRole}
                    onChange={(e) => setTransferForm({ ...transferForm, jobRole: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Reason for Transfer
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Critical masonry shortage at Bole project site..."
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModal({ open: false, assignment: null })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: End Assignment */}
      {endModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              End Assignment: {endModal.assignment?.workerName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Project: <strong className="text-white">{endModal.assignment?.projectName}</strong>.
              This records completion date and updates the worker&apos;s availability status for future projects.
            </p>

            <form onSubmit={handleEndAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Actual End Date
                </label>
                <input
                  type="date"
                  required
                  value={endForm.actualEndDate}
                  onChange={(e) => setEndForm({ ...endForm, actualEndDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white scheme-dark outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Completion Reason / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Foundation structural phase completed"
                  value={endForm.reason}
                  onChange={(e) => setEndForm({ ...endForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-[#0c1527] text-white outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEndModal({ open: false, assignment: null })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? "Closing..." : "Complete Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assignment History */}
      {historyModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-lg w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setHistoryModal({ open: false, worker: null, history: [] })}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Assignment History: {historyModal.worker?.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              {historyModal.worker?.code} • {historyModal.worker?.trade}
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {historyModal.history.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">No historical assignments logged.</div>
              ) : (
                historyModal.history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{h.project?.projectName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Role: {h.jobRole} • {h.workTeam || "Main Team"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        📅 {new Date(h.startDate).toISOString().split("T")[0]} →{" "}
                        {h.endDate ? new Date(h.endDate).toISOString().split("T")[0] : "Present"}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        h.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : h.status === "TRANSFERRED"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
