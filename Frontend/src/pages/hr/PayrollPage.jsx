import { useState, useEffect } from "react";
import { hrApi } from "../../services/hrApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function PayrollPage() {
  const { isDark } = useTheme();

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [projectId, setProjectId] = useState("all");
  const [projects, setProjects] = useState([]);

  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [month, year, projectId]);

  const fetchProjects = async () => {
    try {
      const res = await hrApi.getProjects();
      if (res.success) {
        setProjects(res.data?.projects || []);
      }
    } catch {
      console.warn("Could not load projects");
    }
  };

  const fetchPayroll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrApi.getPayroll({ month, year, projectId });
      if (res.success) {
        setPayrollData(res.data);
      } else {
        setError(res.error);
      }
    } catch {
      setError("Failed to generate payroll calculation");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Labor Wage & Payroll Sheet</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Automated computation based on logged daily site attendance, daily rates, and overtime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-2 ${
              isDark ? "border-slate-700 bg-slate-800 hover:bg-slate-700" : "border-slate-200 bg-white hover:bg-slate-50 shadow-xs"
            }`}
          >
            <span>🖨️</span> Print Voucher Sheet
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchPayroll} className="font-semibold text-xs ml-4">Retry</button>
        </div>
      )}

      {/* Control Filters */}
      <div className={`p-4 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Select Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Select Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Filter Project Site</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            >
              <option value="all">All Sites & Workers</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.projectName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Net Payroll Payout</span>
          <div className="text-3xl font-extrabold text-emerald-500 mt-2">
            {payrollData?.totalGrossPayout?.toLocaleString() || "0"} <span className="text-sm font-normal text-slate-400">ETB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Computed for {months.find(m => m.value === month)?.label} {year}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overtime Disbursements</span>
          <div className="text-3xl font-extrabold text-blue-500 mt-2">
            {payrollData?.totalOvertimePayout?.toLocaleString() || "0"} <span className="text-sm font-normal text-slate-400">ETB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Extra compensation calculated at 1.5x</p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workforce on Sheet</span>
          <div className="text-3xl font-extrabold mt-2">
            {payrollData?.totalWorkers || 0} <span className="text-sm font-normal text-slate-400">workers</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Staff & daily wage labor</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className={`text-xs uppercase tracking-wider border-b ${
              isDark ? "bg-slate-800/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
            }`}>
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Worker Name</th>
                <th className="px-5 py-3.5">Trade & Project</th>
                <th className="px-5 py-3.5">Rate / Salary</th>
                <th className="px-5 py-3.5 text-center">Days Worked</th>
                <th className="px-5 py-3.5 text-center">OT Hours</th>
                <th className="px-5 py-3.5 text-right">Base Pay</th>
                <th className="px-5 py-3.5 text-right">OT Pay</th>
                <th className="px-5 py-3.5 text-right">Gross Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-sans">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Computing timesheets and wages...
                  </td>
                </tr>
              ) : !payrollData?.items || payrollData.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-sans">
                    No active employees recorded for this period.
                  </td>
                </tr>
              ) : (
                payrollData.items.map((row) => (
                  <tr key={row.employeeId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {row.employeeCode}
                    </td>
                    <td className="px-5 py-3.5 font-sans font-semibold text-slate-900 dark:text-slate-100">
                      {row.fullName}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-xs">
                      <div className="capitalize">{row.trade.replace(/_/g, " ").toLowerCase()}</div>
                      <div className="text-slate-400 text-[11px]">{row.assignedProject}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {row.dailyRate > 0 ? `${row.dailyRate} /day` : `${row.monthlySalary} /mo`}
                    </td>
                    <td className="px-5 py-3.5 text-center font-sans font-medium">
                      {row.effectiveDays}
                    </td>
                    <td className="px-5 py-3.5 text-center font-sans font-medium">
                      {row.totalOvertimeHours}h
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {row.basePay.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right text-blue-500">
                      +{row.overtimePay.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {row.grossPay.toLocaleString()} {row.currency}
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
