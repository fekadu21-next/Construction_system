import { useState, useEffect } from "react";
import { accountantApi } from "../../services/accountantApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantReportsPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [reportData, setReportData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [activeTab, setActiveTab] = useState("variance"); // variance, categories, labor, payables, ledger
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadProjectsAndReport();
  }, [selectedProjectId, startDate, endDate]);

  const loadProjectsAndReport = async () => {
    setLoading(true);
    setError("");
    try {
      // Load projects if not already loaded
      if (projects.length === 0) {
        const dashRes = await accountantApi.getDashboard();
        if (dashRes.success && dashRes.data.projects) {
          setProjects(dashRes.data.projects);
        }
      }

      const params = {
        projectId: selectedProjectId,
        startDate,
        endDate,
      };

      const res = await accountantApi.getReports(params);
      if (res.success) {
        setReportData(res.data);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to generate financial reports");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let headers = [];
    let rows = [];
    let filename = `financial_report_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;

    if (activeTab === "variance") {
      headers = ["Project", "Approved Budget (ETB)", "Actual Expenses (ETB)", "Variance (ETB)", "Utilization %"];
      rows = (reportData.budgetVariance || []).map((v) => [
        `"${v.projectName}"`,
        v.approvedBudget,
        v.actualExpense,
        v.variance,
        `${v.utilizationPercentage}%`,
      ]);
    } else if (activeTab === "categories") {
      headers = ["Category", "Total Spent (ETB)", "Transaction Count"];
      rows = (reportData.categoryBreakdown || []).map((c) => [
        `"${c.category}"`,
        c.amount,
        c.count,
      ]);
    } else if (activeTab === "labor") {
      headers = ["Work Date", "Project", "Workers Approved", "Regular Hours", "Overtime", "Calculated Cost (ETB)"];
      rows = (reportData.laborItems || []).map((l) => [
        l.date,
        `"${l.projectName || "Project"}"`,
        l.workerCount,
        l.regularHours,
        l.overtimeHours,
        l.cost,
      ]);
    } else if (activeTab === "payables") {
      headers = ["Supplier", "Total Invoiced (ETB)", "Total Paid (ETB)", "Outstanding Balance (ETB)"];
      rows = (reportData.supplierPayables || []).map((s) => [
        `"${s.supplierName}"`,
        s.totalInvoiced,
        s.totalPaid,
        s.outstandingBalance,
      ]);
    } else {
      headers = ["Reference", "Date", "Category", "Description", "Amount (ETB)", "Status", "Payment"];
      rows = (reportData.expenseItems || []).map((e) => [
        `"${e.expenseRef || e.id}"`,
        e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : "",
        e.category,
        `"${(e.description || "").replace(/"/g, '""')}"`,
        e.amount,
        e.approvalStatus,
        e.paymentStatus,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? "bg-slate-900 border-slate-800"
          : "bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Financial Reports & Auditing</h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                GAAP Compliant
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Multi-dimensional cost breakdowns, variance auditing, supplier payables, and authorized ledger export.
            </p>
          </div>

          <button
            onClick={exportToCSV}
            disabled={!reportData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition"
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Active Tab (CSV)
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Project Scope</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-medium rounded-xl border focus:outline-hidden ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-700"
              }`}
            >
              <option value="all">Enterprise-Wide (All Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Period Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-700"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Period End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-700"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        {[
          { id: "variance", label: "Budget vs Actual Variance" },
          { id: "categories", label: "Cost by Category" },
          { id: "labor", label: "Labor Cost Audits" },
          { id: "payables", label: "Supplier Payables Ledger" },
          { id: "ledger", label: "Detailed Expense Journal" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-xs font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Tab Panels */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Aggregating financial reports...</span>
          </div>
        </div>
      ) : !reportData ? (
        <div className="p-8 text-center text-slate-500">No report data generated.</div>
      ) : (
        <div>
          {/* Tab 1: Budget Variance */}
          {activeTab === "variance" && (
            <div className={`rounded-xl border overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-semibold ${
                      isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      <th className="p-4">Project</th>
                      <th className="p-4">Approved Budget</th>
                      <th className="p-4">Actual Recorded Expenses</th>
                      <th className="p-4">Remaining Balance</th>
                      <th className="p-4">Utilization %</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {(reportData.budgetVariance || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">No projects or budgets in period.</td>
                      </tr>
                    ) : (
                      (reportData.budgetVariance || []).map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{v.projectName}</td>
                          <td className="p-4 font-mono">{Number(v.approvedBudget).toLocaleString()} ETB</td>
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                            {Number(v.actualExpense).toLocaleString()} ETB
                          </td>
                          <td className={`p-4 font-mono font-bold ${v.variance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {Number(v.variance).toLocaleString()} ETB
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    v.utilizationPercentage > 100
                                      ? "bg-rose-500"
                                      : v.utilizationPercentage > 85
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(v.utilizationPercentage, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{v.utilizationPercentage}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              v.utilizationPercentage > 100
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : v.utilizationPercentage > 85
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            }`}>
                              {v.utilizationPercentage > 100 ? "OVER BUDGET" : v.utilizationPercentage > 85 ? "HIGH RISK" : "ON TRACK"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Category Breakdown */}
          {activeTab === "categories" && (
            <div className={`p-6 rounded-xl border ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <h2 className="text-base font-bold mb-4">Cost Distribution by Expense Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(reportData.categoryBreakdown || []).map((cat, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase">{cat.category}</span>
                      <p className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">
                        {Number(cat.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">ETB</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {cat.count} txns
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Labor Ledger */}
          {activeTab === "labor" && (
            <div className={`rounded-xl border overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-semibold ${
                      isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      <th className="p-4">Date</th>
                      <th className="p-4">Project</th>
                      <th className="p-4">Workers</th>
                      <th className="p-4">Regular Hours</th>
                      <th className="p-4">Overtime Hours</th>
                      <th className="p-4">Calculated Outlay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {(reportData.laborItems || []).length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-500">No labor records found in this range.</td></tr>
                    ) : (
                      (reportData.laborItems || []).map((l, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-mono">{l.date}</td>
                          <td className="p-4 font-semibold">{l.projectName || "Project"}</td>
                          <td className="p-4">{l.workerCount} workers</td>
                          <td className="p-4 font-mono">{l.regularHours || 0} hrs</td>
                          <td className="p-4 font-mono text-amber-500">{l.overtimeHours || 0} hrs</td>
                          <td className="p-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            {Number(l.cost || 0).toLocaleString()} ETB
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Supplier Payables */}
          {activeTab === "payables" && (
            <div className={`rounded-xl border overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-semibold ${
                      isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      <th className="p-4">Supplier</th>
                      <th className="p-4">Total Invoiced</th>
                      <th className="p-4">Settled / Paid</th>
                      <th className="p-4">Outstanding Payables</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {(reportData.supplierPayables || []).length === 0 ? (
                      <tr><td colSpan={4} className="p-6 text-center text-slate-500">No supplier payables records.</td></tr>
                    ) : (
                      (reportData.supplierPayables || []).map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{s.supplierName}</td>
                          <td className="p-4 font-mono">{Number(s.totalInvoiced).toLocaleString()} ETB</td>
                          <td className="p-4 font-mono text-emerald-500">{Number(s.totalPaid).toLocaleString()} ETB</td>
                          <td className="p-4 font-mono font-bold text-rose-500">
                            {Number(s.outstandingBalance).toLocaleString()} ETB
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 5: Detailed Journal */}
          {activeTab === "ledger" && (
            <div className={`rounded-xl border overflow-hidden ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-semibold ${
                      isDark ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      <th className="p-4">Ref</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {(reportData.expenseItems || []).length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-500">No transactions recorded.</td></tr>
                    ) : (
                      (reportData.expenseItems || []).map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-mono text-xs text-indigo-500">{e.expenseRef || e.id.slice(0, 8)}</td>
                          <td className="p-4 text-xs">{e.transactionDate ? new Date(e.transactionDate).toLocaleDateString() : "—"}</td>
                          <td className="p-4 text-xs font-semibold">{e.category}</td>
                          <td className="p-4 text-xs text-slate-500">{e.description?.slice(0, 40)}</td>
                          <td className="p-4 font-mono font-bold">{Number(e.amount).toLocaleString()} ETB</td>
                          <td className="p-4 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
                              {e.approvalStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
