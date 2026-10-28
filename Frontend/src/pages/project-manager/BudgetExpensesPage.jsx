import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, DollarSign, PieChart, Building2, TrendingUp, Wallet, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function BudgetExpensesPage() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return `ETB ${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Mock Category Distribution
  const categories = [
    { name: "Structural Materials (Cement, Rebar, Ready-Mix)", percent: 45, spent: 49108500, color: "bg-blue-600" },
    { name: "Direct Site Labor & Skilled Trades", percent: 25, spent: 27282500, color: "bg-indigo-600" },
    { name: "Heavy Machinery & Equipment Rental", percent: 15, spent: 16369500, color: "bg-purple-600" },
    { name: "Specialized Subcontractors (MEP, Glazing)", percent: 10, spent: 10913000, color: "bg-cyan-500" },
    { name: "Municipal Permits, Testing & Safety Overhead", percent: 5, spent: 5456500, color: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Budget & Expense Control
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
              {data?.budgetOverview?.utilizationPercentage}% Utilized
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of planned allocations against verified site expenditures across all active projects.
          </p>
        </div>

        <Link
          to="/project-manager/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Loading budget metrics...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Planned Portfolio Budget
              </span>
              <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">
                {formatCurrency(data?.budgetOverview?.totalPlannedBudget)}
              </p>
              <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1">Across 7 assigned projects</p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Actual Portfolio Expenditure
              </span>
              <p className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 mt-2">
                {formatCurrency(data?.budgetOverview?.actualExpenditure)}
              </p>
              <p className="text-[11px] text-purple-600/70 dark:text-purple-400/70 mt-1">Disbursed and invoiced</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Remaining Unspent Capital
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
                {formatCurrency(data?.budgetOverview?.remainingBudget)}
              </p>
              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Available liquidity</p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Overall Burn Rate
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mt-2">
                {data?.budgetOverview?.utilizationPercentage}%
              </p>
              <div className="w-full h-1.5 rounded-full bg-amber-200 dark:bg-amber-950 mt-2 overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full"
                  style={{ width: `${Math.min(100, data?.budgetOverview?.utilizationPercentage || 0)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category Cost Breakdown */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border ${
              isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <span>Cost Category Breakdown</span>
            </h2>

            {/* Stacked Bar */}
            <div className="w-full h-4 rounded-xl overflow-hidden flex mb-6">
              {categories.map((c, i) => (
                <div
                  key={i}
                  className={`${c.color} h-full`}
                  style={{ width: `${c.percent}%` }}
                  title={`${c.name}: ${c.percent}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${c.color}`} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                      {formatCurrency(c.spent)}
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-cyan-400">
                      {c.percent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Comparison Table */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span>Project-by-Project Ledger</span>
            </h2>

            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "bg-slate-900/60 text-slate-400" : "bg-slate-50 text-slate-500"
                  } border-y border-slate-200 dark:border-slate-800`}
                >
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Planned Allocation</th>
                    <th className="px-4 py-3">Verified Spent</th>
                    <th className="px-4 py-3">Variance / Remaining</th>
                    <th className="px-4 py-3">Burn Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.budgetOverview?.projectComparisons || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{p.code}</td>
                      <td className="px-4 py-3.5 font-medium">{formatCurrency(p.plannedBudget)}</td>
                      <td className="px-4 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(p.actualExpenditure)}</td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.remaining)}</td>
                      <td className="px-4 py-3.5 font-bold">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          p.utilization > 90 ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {p.utilization}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
