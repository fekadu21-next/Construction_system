import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { accountantApi } from "../../services/accountantApi.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantDashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [metrics, setMetrics] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFinancialData();
  }, [selectedProjectId]);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await accountantApi.getDashboard(selectedProjectId);
      if (res.success) {
        setMetrics(res.data);
      } else {
        setError(res.error || "Failed to load financial overview");
      }
    } catch {
      setError("Failed to load financial dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Banner - Clean & Focused */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isDark
            ? "bg-gradient-to-r from-slate-900 via-[#0d1f33] to-slate-900 border-slate-800"
            : "bg-gradient-to-r from-indigo-50 via-cyan-50/40 to-white border-indigo-100 shadow-xs"
          }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Finance & Ledger Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Financial Overview & Cost Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time project capital allocations, expenditure burn, worker wages, and supplier accounts payable.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">

        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-sm flex items-center justify-between shadow-xs">
          <span>⚠️ {error}</span>
          <button onClick={fetchFinancialData} className="underline font-bold text-xs hover:opacity-80 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Filter by Site Dropdown */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter By Site:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-hidden cursor-pointer ${isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 shadow-2xs text-slate-800"
              }`}
          >
            <option value="all">All Active Construction Projects</option>
            {metrics?.projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName} ({p.projectCode})
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Reporting Currency: <strong className="text-indigo-400">ETB</strong>
        </span>
      </div>

      {/* 4 Clean Primary Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1: Total Allocated Budget */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Allocated Budget</span>
            <span className="text-base">💼</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {metrics?.totalBudget?.toLocaleString() || "0"}{" "}
            <span className="text-xs font-medium text-slate-400">ETB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Approved total allocations</div>
        </div>

        {/* 2: Actual Recorded Costs */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#1f0e15] border-rose-900/40" : "bg-rose-50/60 border-rose-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Actual Spend</span>
            <span className="text-base">📉</span>
          </div>
          <div className="text-2xl font-black text-rose-500 mt-2">
            {metrics?.actualExpenses?.toLocaleString() || "0"}{" "}
            <span className="text-xs font-medium text-slate-400">ETB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Posted project disbursements</div>
        </div>

        {/* 3: Remaining Budget Variance */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#081e18] border-emerald-900/40" : "bg-emerald-50/60 border-emerald-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>Remaining Variance</span>
            <span className="text-base">🛡️</span>
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-2">
            {metrics?.remainingBudget?.toLocaleString() || "0"}{" "}
            <span className="text-xs font-medium text-slate-400">ETB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Available spending balance</div>
        </div>

        {/* 4: Budget Burn Rate % */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${isDark ? "bg-[#09152b] border-blue-900/40" : "bg-blue-50/60 border-blue-200 shadow-2xs"
            }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
            <span>Budget Burn Rate</span>
            <span className="text-base">📊</span>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-2">
            {metrics?.budgetUtilization || 0}%
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800/40 dark:bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${(metrics?.budgetUtilization || 0) >= 90
                  ? "bg-rose-500"
                  : (metrics?.budgetUtilization || 0) >= 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              style={{ width: `${Math.min(100, metrics?.budgetUtilization || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Performance Table & Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Project Budget Table & Category Spending */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site Budget Performance Summary */}
          <div
            className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Site Budget Performance Summary
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allocated budget vs. verified actual costs by construction project
                </p>
              </div>
              <Link
                to="/accountant/budgets"
                className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
              >
                Manage Budgets →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-bold uppercase tracking-wider text-slate-400 ${isDark ? "border-slate-800" : "border-slate-100"
                      }`}
                  >
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Allocated Budget</th>
                    <th className="py-2.5 px-3">Actual Spent</th>
                    <th className="py-2.5 px-3">Remaining</th>
                    <th className="py-2.5 px-3">Utilization</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {metrics?.projects?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active project records found.
                      </td>
                    </tr>
                  ) : (
                    metrics?.projects?.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold block text-slate-900 dark:text-slate-100">{p.projectName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.projectCode}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {p.budget?.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 font-bold text-rose-500">
                          {p.spent?.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-500">
                          {p.remaining?.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                          {p.utilization}%
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.isHighRisk
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              }`}
                          >
                            {p.isHighRisk ? "Risk (≥85%)" : "On Track"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Core Category Expenditure Breakdown */}
          <div
            className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
              }`}
          >
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Core Category Cost Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time expenditure split across primary construction activities
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">👷 Labor</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {metrics?.categoryTotals?.labor?.toLocaleString() || "0"} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">🧱 Materials</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {metrics?.categoryTotals?.materials?.toLocaleString() || "0"} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">🚜 Equipment</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {metrics?.categoryTotals?.equipment?.toLocaleString() || "0"} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">⛽ Transport & Fuel</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {(
                    (metrics?.categoryTotals?.transportation || 0) +
                    (metrics?.categoryTotals?.fuel || 0)
                  ).toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-slate-400">ETB</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Operations & Payables */}
        <div className="space-y-6">
          {/* Accounts Payable Alert Card */}
          <div
            className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Accounts Payable
              </span>
              <span className="text-xl">🧾</span>
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {metrics?.outstandingSupplierPayables?.toLocaleString() || "0"}{" "}
              <span className="text-xs text-slate-400">ETB</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Outstanding balance due on approved supplier invoices
            </p>
            <Link
              to="/accountant/invoices"
              className="inline-block mt-3 text-xs font-bold text-amber-400 hover:underline"
            >
              Review Supplier Invoices →
            </Link>
          </div>

          {/* Direct Accounting Navigation Shortcuts */}
          <div
            className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-[#0b1329] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
              }`}
          >
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Accounting Modules
            </h3>
            <p className="text-xs text-slate-400 mb-4">Quick navigation across financial tasks</p>

            <div className="space-y-2.5">
              <Link
                to="/accountant/budgets"
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isDark
                    ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                    : "bg-slate-50/70 border-slate-100 hover:bg-slate-100/70"
                  }`}
              >
                <span className="text-xl">💼</span>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Project Budgets</div>
                  <div className="text-[11px] text-slate-400 truncate">Allocated capital & revisions</div>
                </div>
              </Link>

              <Link
                to="/accountant/expenses"
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isDark
                    ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                    : "bg-slate-50/70 border-slate-100 hover:bg-slate-100/70"
                  }`}
              >
                <span className="text-xl">💳</span>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Expenses & Ledger</div>
                  <div className="text-[11px] text-slate-400 truncate">Post and audit disbursements</div>
                </div>
              </Link>

              <Link
                to="/accountant/labor-costs"
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isDark
                    ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                    : "bg-slate-50/70 border-slate-100 hover:bg-slate-100/70"
                  }`}
              >
                <span className="text-xl">👷‍♂️</span>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Payroll & Labor Costs</div>
                  <div className="text-[11px] text-slate-400 truncate">Timesheet wage reconciliation</div>
                </div>
              </Link>

              <Link
                to="/accountant/material-costs"
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isDark
                    ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                    : "bg-slate-50/70 border-slate-100 hover:bg-slate-100/70"
                  }`}
              >
                <span className="text-xl">🧱</span>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Material Costs</div>
                  <div className="text-[11px] text-slate-400 truncate">Requisitions & receipt burn</div>
                </div>
              </Link>

              <Link
                to="/accountant/reports"
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${isDark
                    ? "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60"
                    : "bg-slate-50/70 border-slate-100 hover:bg-slate-100/70"
                  }`}
              >
                <span className="text-xl">📑</span>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Financial Reports</div>
                  <div className="text-[11px] text-slate-400 truncate">Cost variance and balance exports</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
