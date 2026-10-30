import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { hrApi } from "../../services/hrApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function TemporaryApprovalsPage() {
  const { isDark } = useTheme();

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, returned: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: "", request: null }); // type: "APPROVE", "REJECT", "RETURN"
  const [actionReason, setActionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [statusFilter, projectFilter, searchQuery, pagination.page]);

  const loadProjects = async () => {
    try {
      const res = await hrApi.getProjects();
      if (res.success && res.data.projects) {
        setProjects(res.data.projects);
      }
    } catch {
      console.warn("Could not load projects list");
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.getTemporaryRequests({
        status: statusFilter,
        projectId: projectFilter,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.success && res.data) {
        setRequests(res.data.requests || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            page: res.data.pagination.page,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          }));
        }
      } else {
        setStatusMsg({ text: res.error || "Failed to load requests", type: "error" });
      }
    } catch {
      setStatusMsg({ text: "Failed to load temporary worker requests", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    setProcessing(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await hrApi.approveEmployee(request.id);
      if (res.success) {
        setStatusMsg({
          text: `✓ Worker ${request.fullName} (${request.employeeCode}) successfully approved and added to active workforce!`,
          type: "success",
        });
        setActionModal({ open: false, type: "", request: null });
        await loadRequests();
      } else {
        setStatusMsg({ text: res.error || "Approval failed", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to approve request", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrReturn = async () => {
    if (!actionReason.trim()) {
      setStatusMsg({ text: "A reason or feedback note is required to proceed", type: "error" });
      return;
    }

    setProcessing(true);
    setStatusMsg({ text: "", type: "" });
    try {
      let res;
      if (actionModal.type === "REJECT") {
        res = await hrApi.rejectEmployee(actionModal.request.id, actionReason.trim());
      } else {
        res = await hrApi.returnTemporaryRequest(actionModal.request.id, actionReason.trim());
      }

      if (res.success) {
        setStatusMsg({
          text: actionModal.type === "REJECT"
            ? `✓ Application for ${actionModal.request.fullName} rejected. Reason logged.`
            : `✓ Application returned to site supervisor for revision with your feedback note.`,
          type: "success",
        });
        setActionModal({ open: false, type: "", request: null });
        setActionReason("");
        await loadRequests();
      } else {
        setStatusMsg({ text: res.error || "Action failed", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Operation failed", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
              Onboarding &amp; Verification Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Temporary Worker Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Review and formally authorize daily laborers and site tradesmen registered directly on construction locations by Site Supervisors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/hr/workers"
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors"
          >
            <span>👷</span> View Active Workers
          </Link>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Status Notifications */}
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

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter("PENDING_APPROVAL")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "PENDING_APPROVAL"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/10"
              : isDark
              ? "bg-[#0b1329] border-slate-800 hover:border-slate-700"
              : "bg-white border-slate-200 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center justify-between">
            <span>Pending Review</span>
            <span>⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{counts.pending}</div>
          <div className="text-[10px] text-slate-500 mt-1">Awaiting formal decision</div>
        </div>

        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "ACTIVE"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10"
              : isDark
              ? "bg-[#0b1329] border-slate-800 hover:border-slate-700"
              : "bg-white border-slate-200 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Approved</span>
            <span>✓</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{counts.approved}</div>
          <div className="text-[10px] text-slate-500 mt-1">Active site workforce</div>
        </div>

        <div
          onClick={() => setStatusFilter("RETURNED")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "RETURNED"
              ? "ring-2 ring-blue-500 border-blue-500 bg-blue-500/10"
              : isDark
              ? "bg-[#0b1329] border-slate-800 hover:border-slate-700"
              : "bg-white border-slate-200 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
            <span>Returned</span>
            <span>↩️</span>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1">{counts.returned}</div>
          <div className="text-[10px] text-slate-500 mt-1">Returned for correction</div>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "REJECTED"
              ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/10"
              : isDark
              ? "bg-[#0b1329] border-slate-800 hover:border-slate-700"
              : "bg-white border-slate-200 shadow-2xs hover:shadow-xs"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Rejected</span>
            <span>✕</span>
          </div>
          <div className="text-2xl font-black text-rose-500 mt-1">{counts.rejected}</div>
          <div className="text-[10px] text-slate-500 mt-1">Declined applications</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by worker name, EMP code, trade..."
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
            <option value="ALL">All Application Statuses</option>
            <option value="PENDING_APPROVAL">Pending Review</option>
            <option value="ACTIVE">Approved / Active</option>
            <option value="RETURNED">Returned for Revision</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {(statusFilter !== "ALL" || projectFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setProjectFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{requests.length}</strong> of {pagination.total} applications
        </div>
      </div>

      {/* Requests Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`text-[10px] font-bold uppercase tracking-wider border-b ${
              isDark ? "bg-slate-900/80 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
            }`}>
              <tr>
                <th className="py-3.5 px-4">Applicant Worker</th>
                <th className="py-3.5 px-4">Trade / Craft</th>
                <th className="py-3.5 px-4">Requested Project Site</th>
                <th className="py-3.5 px-3 text-right">Daily Rate</th>
                <th className="py-3.5 px-3 text-center">Registered Date</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading temporary worker applications...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <span className="text-3xl block mb-2">📋</span>
                    <p className="text-sm font-semibold text-slate-300">No temporary worker requests found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      New worker registrations from site supervisors will appear here for formal HR authorization.
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isPending = ["PENDING_APPROVAL", "PENDING"].includes(r.status);
                  const isReturned = r.status === "RETURNED";
                  const isApproved = ["ACTIVE", "APPROVED"].includes(r.status);
                  const isRejected = r.status === "REJECTED";

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Worker Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {r.fullName ? r.fullName.charAt(0).toUpperCase() : "W"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate max-w-[160px]">
                              {r.fullName}
                            </div>
                            <div className="font-mono text-[10px] text-emerald-400">
                              {r.employeeCode} • {r.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trade / Craft */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                          {r.trade?.replace(/_/g, " ")}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {r.workTeam || "Site Crew"}
                        </div>
                      </td>

                      {/* Project Site & Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 text-xs truncate max-w-[200px]" title={r.projectName}>
                          📍 {r.projectName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {r.projectCode} • {r.projectLocation}
                        </div>
                      </td>

                      {/* Daily Rate */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        {Number(r.dailyRate || 400).toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-500 font-normal">ETB/day</span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-3 text-center text-xs text-slate-400 font-mono whitespace-nowrap">
                        {r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : isApproved
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : isReturned
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {r.status?.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(r)}
                                disabled={processing}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                                title="Approve & Onboard to Active Workforce"
                              >
                                ✓ Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionModal({ open: true, type: "RETURN", request: r });
                                  setActionReason("");
                                }}
                                disabled={processing}
                                className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs transition-colors cursor-pointer"
                                title="Return to Supervisor with Revision Note"
                              >
                                ↩️ Return
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionModal({ open: true, type: "REJECT", request: r });
                                  setActionReason("");
                                }}
                                disabled={processing}
                                className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-semibold text-xs transition-colors cursor-pointer"
                                title="Decline Application with Reason"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Inspect Complete Application Dossier"
                          >
                            👁️
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

      {/* Reject / Return Modal with Mandatory Reason */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {actionModal.type === "REJECT"
                ? `Reject Application: ${actionModal.request?.fullName}`
                : `Return Application for Correction: ${actionModal.request?.fullName}`}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {actionModal.type === "REJECT"
                ? "Provide a justification for rejecting this worker application. This reason is recorded in the audit log."
                : "Explain what information or documents the Site Supervisor must rectify before this worker can be authorized."}
            </p>

            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Missing valid national ID verification or wrong trade classification for site requirements..."
              className="w-full p-3 rounded-xl border border-slate-700 bg-[#0c1527] text-white placeholder-slate-500 text-xs outline-hidden mb-4 focus:border-amber-500"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: "", request: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectOrReturn}
                disabled={processing || !actionReason.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                  actionModal.type === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-500 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                } disabled:opacity-50`}
              >
                {processing ? "Recording..." : actionModal.type === "REJECT" ? "Confirm Rejection" : "Return to Supervisor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Worker Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="max-w-lg w-full rounded-3xl p-6 border border-slate-800 bg-[#091124] text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                {selectedRequest.fullName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedRequest.fullName}</h3>
                <div className="text-xs font-mono text-emerald-400">
                  {selectedRequest.employeeCode} • {selectedRequest.trade}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Project Site</span>
                <span className="font-semibold text-white mt-0.5 block">{selectedRequest.projectName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Site Location</span>
                <span className="font-semibold text-white mt-0.5 block">{selectedRequest.projectLocation}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                <span className="font-semibold text-white mt-0.5 block">{selectedRequest.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Wage Rate</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">{selectedRequest.dailyRate} ETB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">National ID / Kebele</span>
                <span className="font-semibold text-white mt-0.5 block">{selectedRequest.nationalId || "Not Provided"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency Contact</span>
                <span className="font-semibold text-white mt-0.5 block">
                  {selectedRequest.emergencyContactName || "N/A"} {selectedRequest.emergencyContactPhone ? `(${selectedRequest.emergencyContactPhone})` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
