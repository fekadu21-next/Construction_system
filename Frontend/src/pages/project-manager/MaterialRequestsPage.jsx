import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function MaterialRequestsPage() {
  const { isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Action state
  const [actionRequest, setActionRequest] = useState(null); // { request, type: 'APPROVE' | 'REJECT' }
  const [actionNotes, setActionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setRequests(res.data.pendingMaterialRequests || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleConfirmAction = async () => {
    if (!actionRequest) return;
    setSubmitting(true);
    try {
      let res;
      if (actionRequest.type === "APPROVE") {
        res = await projectManagerService.approveMaterialRequest(actionRequest.request.id, actionNotes);
      } else {
        res = await projectManagerService.rejectMaterialRequest(actionRequest.request.id, actionNotes);
      }

      if (res.success) {
        showToast(res.message);
        setActionRequest(null);
        setActionNotes("");
        await loadRequests();
      } else {
        showToast(res.error || "Action failed.");
      }
    } catch {
      showToast("Error processing action.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return `ETB ${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
    const matchSearch =
      !search ||
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestingEngineer.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedMaterials.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-sm font-medium">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Material Requests & Approvals
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {requests.filter((r) => r.status === "PENDING").length} Pending
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review site engineer requisitions, verify budget allocations, and authorize procurement orders.
          </p>
        </div>

        <Link
          to="/project-manager/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>

      {/* Tabs & Search */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === tab
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search request #, project, materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isDark
                  ? "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Loading material requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-white dark:bg-[#0d1c33] border-slate-200 dark:border-slate-800 text-slate-500">
          <span className="text-4xl">📦</span>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">No material requests found</p>
          <p className="text-xs text-slate-400 mt-1">Try switching tabs or adjusting search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const isPending = r.status === "PENDING";
            return (
              <div
                key={r.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                        {r.requestNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {r.projectName}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          r.urgency === "Critical"
                            ? "bg-rose-500 text-white animate-pulse"
                            : r.urgency === "High"
                            ? "bg-amber-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {r.urgency} Urgency
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : r.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      🛠️ {r.requestedMaterials}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span>Requester: <strong className="text-slate-700 dark:text-slate-200">{r.requestingEngineer}</strong></span>
                      <span>•</span>
                      <span>Date: {r.requestDate}</span>
                      <span>•</span>
                      <span>Delivery Site: {r.deliveryLocation || "Central Yard"}</span>
                      <span>•</span>
                      <span>Estimated Total: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(r.totalEstimatedCost)}</strong></span>
                    </div>

                    {r.justification && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                        " {r.justification} "
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending ? (
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => setActionRequest({ request: r, type: "REJECT" })}
                        className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold transition-all"
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => setActionRequest({ request: r, type: "APPROVE" })}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition-all transform active:scale-95"
                      >
                        ✓ Approve Request
                      </button>
                    </div>
                  ) : (
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-slate-400">
                        {r.status === "APPROVED" ? "✓ Authorized by PM" : "✕ Declined by PM"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Approval / Rejection */}
      {actionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#0b172d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>{actionRequest.type === "APPROVE" ? "✅" : "🛑"}</span>
                  <span>
                    {actionRequest.type === "APPROVE" ? "Approve Material Requisition" : "Reject Material Requisition"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request #{actionRequest.request.requestNumber} • {actionRequest.request.projectName}
                </p>
              </div>
              <button
                onClick={() => setActionRequest(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Materials: {actionRequest.request.requestedMaterials}
                </p>
                <p className="text-slate-500">
                  Estimated Cost: <strong className="text-emerald-600 font-bold">{formatCurrency(actionRequest.request.totalEstimatedCost)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  {actionRequest.type === "APPROVE" ? "Approval Notes (Optional)" : "Reason for Rejection"}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionRequest.type === "APPROVE"
                      ? "Add delivery conditions, priority instructions, or site storage instructions..."
                      : "State specific grounds: budget cap exceeded, inventory already available, or invalid specs..."
                  }
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                    isDark
                      ? "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActionRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                  actionRequest.type === "APPROVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {submitting
                  ? "Processing..."
                  : actionRequest.type === "APPROVE"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
