import { useState, useEffect } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantMaterialCostsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "expenses"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Record Material Cost Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordFormData, setRecordFormData] = useState({
    projectId: "",
    amount: "",
    description: "",
    payee: "",
    receiptNumber: "",
    paymentMethod: "BANK_TRANSFER",
    notes: "",
  });
  const [submittingCost, setSubmittingCost] = useState(false);

  // Detail Modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadMaterialCosts();
  }, [selectedProjectId]);

  const loadMaterialCosts = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await accountantApi.getMaterialCosts(selectedProjectId);
      if (res.success && res.data) {
        setData(res.data);
        if (!recordFormData.projectId && res.data.projects?.length > 0) {
          setRecordFormData((prev) => ({ ...prev, projectId: res.data.projects[0].id }));
        }
      } else {
        setStatusMsg({ text: res.error || "Failed to load material costs", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Error loading material costs", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordCostSubmit = async (e) => {
    e.preventDefault();
    if (!recordFormData.projectId || !recordFormData.amount) {
      setStatusMsg({ text: "Project and Amount are required", type: "error" });
      return;
    }

    setSubmittingCost(true);
    try {
      const res = await accountantApi.recordMaterialCost(recordFormData);
      if (res.success) {
        setStatusMsg({ text: "✓ Material purchase & receipt successfully logged in ledger!", type: "success" });
        setIsRecordModalOpen(false);
        setRecordFormData({
          projectId: data.projects[0]?.id || "",
          amount: "",
          description: "",
          payee: "",
          receiptNumber: "",
          paymentMethod: "BANK_TRANSFER",
          notes: "",
        });
        loadMaterialCosts();
      } else {
        setStatusMsg({ text: res.error || "Failed to record material cost", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to submit material cost", type: "error" });
    } finally {
      setSubmittingCost(false);
    }
  };

  const filteredRequests = (data?.requests || []).filter((req) => {
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = (req.requestNumber || "").toLowerCase().includes(q);
      const matchProj = (req.project?.projectName || "").toLowerCase().includes(q);
      const matchMat = (req.requestedMaterials || "").toLowerCase().includes(q);
      const matchReq = (req.requester?.fullName || "").toLowerCase().includes(q);
      return matchNum || matchProj || matchMat || matchReq;
    }
    return true;
  });

  const filteredExpenses = (data?.expenses || []).filter((exp) => {
    if (statusFilter !== "all" && exp.paymentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = (exp.referenceNumber || "").toLowerCase().includes(q);
      const matchProj = (exp.project?.projectName || "").toLowerCase().includes(q);
      const matchPayee = (exp.payee || "").toLowerCase().includes(q);
      const matchDesc = (exp.description || "").toLowerCase().includes(q);
      return matchRef || matchProj || matchPayee || matchDesc;
    }
    return true;
  });

  const exportCSV = () => {
    const isReq = activeTab === "requests";
    const headers = isReq
      ? ["Request #", "Project", "Requested By", "Materials", "Estimated Cost (ETB)", "Urgency", "Status", "Date"]
      : ["Reference #", "Project", "Payee", "Amount (ETB)", "Payment Method", "Status", "Date", "Notes"];

    const rows = isReq
      ? filteredRequests.map((r) => [
          r.requestNumber,
          `"${r.project?.projectName || ""}"`,
          `"${r.requester?.fullName || ""}"`,
          `"${(r.requestedMaterials || "").replace(/"/g, '""')}"`,
          r.totalEstimatedCost || 0,
          r.urgency,
          r.status,
          new Date(r.createdAt).toLocaleDateString(),
        ])
      : filteredExpenses.map((e) => [
          e.referenceNumber,
          `"${e.project?.projectName || ""}"`,
          `"${e.payee || ""}"`,
          e.amount,
          e.paymentMethod,
          e.paymentStatus,
          new Date(e.expenseDate).toLocaleDateString(),
          `"${(e.notes || "").replace(/"/g, '""')}"`,
        ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `material_costs_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || {
    totalMaterialBudget: 0,
    totalMaterialSpend: 0,
    pendingCommitments: 0,
    variance: 0,
    totalRequestsCount: 0,
    pendingRequestsCount: 0,
    totalExpensesCount: 0,
  };

  const utilizationRate = summary.totalMaterialBudget > 0
    ? Math.round((summary.totalMaterialSpend / summary.totalMaterialBudget) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? "bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800"
          : "bg-gradient-to-r from-indigo-50 via-cyan-50/40 to-white border-indigo-100 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Material Costs & Purchase Tracking</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Cost Control
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Track project site material requisitions, purchase orders, delivery receipts, and actual material expenditure against approved budget allocations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-colors cursor-pointer ${
                isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
              }`}
            >
              <span>📥</span> Export CSV
            </button>
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>➕</span> Record Material Receipt / Cost
            </button>
          </div>
        </div>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          statusMsg.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ text: "", type: "" })} className="underline font-semibold ml-4">✕</button>
        </div>
      )}

      {/* Global Project Site Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter By Project Site:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
              isDark ? "bg-[#0b1328] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800 shadow-2xs"
            }`}
          >
            <option value="all">🌐 All Active Sites</option>
            {data?.projects?.map((p) => (
              <option key={p.id} value={p.id}>
                🏗️ {p.projectName} ({p.projectCode})
              </option>
            ))}
          </select>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0b1328] border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📋 Material Requests ({summary.totalRequestsCount})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "expenses"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🧾 Actual Spend & Receipts ({summary.totalExpensesCount})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Material Budget */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Allocated Budget</span>
            <span className="text-base">💼</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {summary.totalMaterialBudget.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total approved material allocation</p>
        </div>

        {/* Total Material Spend */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Actual Spend</span>
            <span className="text-base">💳</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {summary.totalMaterialSpend.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{utilizationRate}% of material budget utilized</p>
        </div>

        {/* Pending Commitments */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Pending Orders</span>
            <span className="text-base">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {summary.pendingCommitments.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{summary.pendingRequestsCount} requisition(s) pending delivery</p>
        </div>

        {/* Variance / Remaining */}
        <div className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Available Variance</span>
            <span className="text-base">{summary.variance >= 0 ? "🟢" : "🔴"}</span>
          </div>
          <div className={`text-2xl font-black mt-1 ${summary.variance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {summary.variance.toLocaleString()} <span className="text-xs font-semibold text-slate-400">ETB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.variance >= 0 ? "Under budget ceiling" : "Budget overrun warning"}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={activeTab === "requests" ? "Search request #, site, materials, requester..." : "Search ref #, vendor, description..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-4 py-2 text-xs rounded-xl border outline-hidden ${
              isDark ? "bg-slate-800/80 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 placeholder-slate-400"
            }`}
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white">✕</button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <option value="all">All Statuses</option>
            {activeTab === "requests" ? (
              <>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ORDERED">Ordered</option>
                <option value="DELIVERED">Delivered</option>
              </>
            ) : (
              <>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="overflow-x-auto">
          {activeTab === "requests" ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-slate-400 uppercase font-bold text-[11px] ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <th className="py-3.5 px-4">Request #</th>
                  <th className="py-3.5 px-4">Project Site</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4">Materials / Items</th>
                  <th className="py-3.5 px-4 text-right">Estimated Cost</th>
                  <th className="py-3.5 px-4 text-center">Urgency</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading material requisitions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="text-2xl mb-1">📦</div>
                      <p className="font-semibold text-slate-300">No material requests found.</p>
                      <p className="text-[11px] text-slate-500">Material requests submitted by Site Engineers will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-500 dark:text-indigo-400">
                        {req.requestNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {req.project?.projectName || "Unassigned"}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {req.project?.projectCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {req.requester?.fullName || "Site Engineer"}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {req.requester?.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate" title={req.requestedMaterials}>
                        <span className="font-medium">{req.requestedMaterials || "Specified materials"}</span>
                        {req.items?.length > 0 && (
                          <span className="block text-[10px] text-indigo-400">
                            {req.items.length} item line(s)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {req.totalEstimatedCost ? `${Number(req.totalEstimatedCost).toLocaleString()} ETB` : "Pending Quote"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.urgency === "URGENT" || req.urgency === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          req.status === "APPROVED" || req.status === "DELIVERED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : req.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-slate-400 uppercase font-bold text-[11px] ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <th className="py-3.5 px-4">Reference #</th>
                  <th className="py-3.5 px-4">Project Site</th>
                  <th className="py-3.5 px-4">Payee / Vendor</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Actual Cost</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading material expense ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="text-2xl mb-1">🧾</div>
                      <p className="font-semibold text-slate-300">No material expenses logged.</p>
                      <p className="text-[11px] text-slate-500">Record material purchases and delivery receipts using the button above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {exp.referenceNumber || `MAT-${exp.id.slice(-6)}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {exp.project?.projectName}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {exp.project?.projectCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-400">
                        {exp.payee || "Vendor"}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate" title={exp.description}>
                        {exp.description || "Material procurement"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-emerald-400">
                        {Number(exp.amount).toLocaleString()} ETB
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {exp.paymentMethod?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          exp.paymentStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}>
                          {exp.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(exp.expenseDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Material Cost Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
            isDark ? "bg-[#0b1328] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧱</span>
                <div>
                  <h3 className="text-lg font-bold">Record Material Purchase / Receipt</h3>
                  <p className="text-xs text-slate-400">Post actual site material delivery & invoice to ledger</p>
                </div>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordCostSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Project Site *</label>
                <select
                  required
                  value={recordFormData.projectId}
                  onChange={(e) => setRecordFormData({ ...recordFormData, projectId: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  {data?.projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} ({p.projectCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Cost Amount (ETB) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 85000"
                    value={recordFormData.amount}
                    onChange={(e) => setRecordFormData({ ...recordFormData, amount: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border font-mono font-bold ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Receipt / Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-9872"
                    value={recordFormData.receiptNumber}
                    onChange={(e) => setRecordFormData({ ...recordFormData, receiptNumber: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border font-mono ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payee / Supplier Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Dangote Cement / Mugher / National Steel"
                  value={recordFormData.payee}
                  onChange={(e) => setRecordFormData({ ...recordFormData, payee: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Material Description</label>
                <input
                  type="text"
                  placeholder="e.g. 500 Bags OPC Cement, Grade 42.5"
                  value={recordFormData.description}
                  onChange={(e) => setRecordFormData({ ...recordFormData, description: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={recordFormData.paymentMethod}
                    onChange={(e) => setRecordFormData({ ...recordFormData, paymentMethod: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="BANK_TRANSFER">Bank Wire / CBE / Telebirr</option>
                    <option value="CHECK">Check / Cheque</option>
                    <option value="CASH">Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Delivery batch notes..."
                    value={recordFormData.notes}
                    onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs border ${
                      isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCost}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingCost ? "Logging..." : "Confirm & Post to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
            isDark ? "bg-[#0b1328] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-indigo-400">Requisition #{selectedRequest.requestNumber}</h3>
                <p className="text-xs text-slate-400">{selectedRequest.project?.projectName}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
                <span>Estimated Cost Valuation:</span>
                <span className="text-sm font-black text-white">
                  {selectedRequest.totalEstimatedCost ? `${Number(selectedRequest.totalEstimatedCost).toLocaleString()} ETB` : "Not Quoted"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">Requested Materials:</span>
                <p className="p-3 rounded-xl bg-slate-800/20 border border-slate-700/40 text-slate-200 whitespace-pre-wrap">
                  {selectedRequest.requestedMaterials}
                </p>
              </div>

              {selectedRequest.justification && (
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Site Justification:</span>
                  <p className="p-2.5 rounded-xl bg-slate-800/20 text-slate-300">
                    {selectedRequest.justification}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <div>
                  <span className="block font-semibold">Requester:</span>
                  <span className="text-white">{selectedRequest.requester?.fullName}</span>
                </div>
                <div>
                  <span className="block font-semibold">Submitted On:</span>
                  <span className="text-white">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
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

