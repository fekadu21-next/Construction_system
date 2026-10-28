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
        setError(res.error);
      }
    } catch {
      setError("Failed to load financial dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading project financials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border ${
        isDark
          ? "bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-slate-800"
          : "bg-gradient-to-r from-indigo-50 via-cyan-50/40 to-white border-indigo-100 shadow-xs"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Project Accounting & Cost Control</h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Ledger Live
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Integrated project cost control, approved budget burn, labor timesheet entries, and supplier accounts payable.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/accountant/expenses"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2 transition-colors"
            >
              <span>➕</span> Record Expense
            </Link>
            <Link
              to="/accountant/labor-costs"
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                isDark ? "border-slate-700 bg-slate-800 hover:bg-slate-700" : "border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
              }`}
            >
              <span>👷‍♂️</span> Review Labor Costs
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchFinancialData} className="underline font-medium ml-4">Retry</button>
        </div>
      )}

      {/* Project Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Filter By Project:</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm font-semibold outline-hidden ${
            isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
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

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Budget */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Budget</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              💼
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {metrics?.totalBudget?.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Approved total allocations</p>
        </div>

        {/* Actual Recorded Expenses */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Actual Recorded Cost</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              📉
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-500">
            {metrics?.actualExpenses?.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Approved & posted expenses</p>
        </div>

        {/* Remaining Budget */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining Budget</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              🛡️
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-500">
            {metrics?.remainingBudget?.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {metrics?.budgetUtilization}% Budget Utilized
          </p>
        </div>

        {/* Outstanding Supplier Payables */}
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accounts Payable</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              🧾
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-500">
            {metrics?.outstandingSupplierPayables?.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            <Link to="/accountant/invoices" className="text-amber-400 hover:underline">
              Unpaid supplier invoices →
            </Link>
          </p>
        </div>
      </div>

      {/* Main Grid: Category Spending, Monthly Trends, and Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Category Spending Breakdown & Monthly Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expenditure By Category */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <h2 className="text-base font-bold mb-1">Expenditure Breakdown by Cost Category</h2>
            <p className="text-xs text-slate-400 mb-4">Actual posted costs across core construction operational areas</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">👷 Labor</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {metrics?.categoryTotals?.labor?.toLocaleString() || 0} ETB
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">🧱 Materials</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {metrics?.categoryTotals?.materials?.toLocaleString() || 0} ETB
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">🚜 Equipment</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {metrics?.categoryTotals?.equipment?.toLocaleString() || 0} ETB
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">⛽ Transport & Fuel</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {((metrics?.categoryTotals?.transportation || 0) + (metrics?.categoryTotals?.fuel || 0)).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Spending Trends */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <h2 className="text-base font-bold mb-1">Monthly Expenditure Velocity</h2>
            <p className="text-xs text-slate-400 mb-4">6-Month historical cash flow disbursements</p>

            <div className="space-y-3">
              {metrics?.monthlyTrends?.map((m) => (
                <div key={m.monthName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">{m.monthName}</span>
                    <span>{m.total?.toLocaleString()} ETB</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (m.total / (metrics.actualExpenses || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Cost Table */}
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <h2 className="text-base font-bold mb-1">Site Budget Performance Summary</h2>
            <p className="text-xs text-slate-400 mb-4">Comparison of allocated budget against recorded actuals</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold">
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Approved Budget</th>
                    <th className="py-2.5 px-3">Actual Spent</th>
                    <th className="py-2.5 px-3">Remaining</th>
                    <th className="py-2.5 px-3">Burn Rate</th>
                    <th className="py-2.5 px-3 text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics?.projects?.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-3">
                        <span className="font-bold block text-slate-900 dark:text-slate-100">{p.projectName}</span>
                        <span className="font-mono text-slate-400">{p.projectCode}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold">{p.budget?.toLocaleString()} ETB</td>
                      <td className="py-3 px-3 font-bold text-rose-500">{p.spent?.toLocaleString()} ETB</td>
                      <td className="py-3 px-3 font-bold text-emerald-500">{p.remaining?.toLocaleString()} ETB</td>
                      <td className="py-3 px-3 font-semibold">{p.utilization}%</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                          p.isHighRisk
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {p.isHighRisk ? "Overrun Risk" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Financial Quick Actions & Operations */}
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
            <h2 className="text-base font-bold mb-1">Financial Operations</h2>
            <p className="text-xs text-slate-400 mb-4">Direct shortcuts for accounting & cost control</p>

            <div className="space-y-3">
              <Link
                to="/accountant/expenses"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                }`}
              >
                <span className="text-2xl">💵</span>
                <div>
                  <p className="text-sm font-semibold">Record Site Expense</p>
                  <p className="text-xs text-slate-400">Post verified site disbursements & receipts</p>
                </div>
              </Link>

              <Link
                to="/accountant/budgets"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                }`}
              >
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-sm font-semibold">Project Budgets</p>
                  <p className="text-xs text-slate-400">Configure cost baselines and category limits</p>
                </div>
              </Link>

              <Link
                to="/accountant/labor-costs"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                }`}
              >
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-sm font-semibold">Labor Ledger & Wages</p>
                  <p className="text-xs text-slate-400">Reconcile worker daily wages & payroll totals</p>
                </div>
              </Link>

              <Link
                to="/accountant/invoices"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                }`}
              >
                <span className="text-2xl">🧾</span>
                <div>
                  <p className="text-sm font-semibold">Supplier Invoices</p>
                  <p className="text-xs text-slate-400">Review billings and release payables</p>
                </div>
              </Link>

              <Link
                to="/accountant/reports"
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
                  isDark ? "bg-slate-800/40 border-slate-800 hover:bg-slate-800" : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                }`}
              >
                <span className="text-2xl">📑</span>
                <div>
                  <p className="text-sm font-semibold">Financial Reports</p>
                  <p className="text-xs text-slate-400">Export budget ledger & cost breakdown CSVs</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
