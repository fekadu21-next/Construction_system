import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function ReportsAnalyticsPage() {
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

  const kpis = [
    { title: "Schedule Performance Index (SPI)", value: "1.04", status: "On Track / Optimal", icon: "⏱️", color: "text-emerald-600" },
    { title: "Cost Performance Index (CPI)", value: "0.98", status: "Within Tolerance", icon: "📊", color: "text-blue-600" },
    { title: "Lost Time Injury Frequency", value: "0.0", status: "Perfect Safety Record", icon: "🛡️", color: "text-emerald-600" },
    { title: "Avg Material Approval Time", value: "3.4 hrs", status: "High Agility", icon: "⚡", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Reports & Performance Analytics
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
              Q4 Portfolio Review
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quantitative analysis of construction velocity, quality compliance, and resource productivity.
          </p>
        </div>

        <Link
          to="/project-manager/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Generating analytics...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border ${
                  isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{kpi.icon}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">KPI</span>
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-3">{kpi.title}</p>
                <p className={`text-3xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">{kpi.status}</p>
              </div>
            ))}
          </div>

          {/* Project Health Scorecard */}
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
            }`}
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🩺</span> Portfolio Health Assessment
            </h2>

            <div className="space-y-3">
              {(data?.projects || []).map((p) => {
                const isHealthy = p.scheduleStatus !== "Delayed";
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200/60"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.projectName}</h4>
                      <p className="text-xs text-slate-500">
                        Assigned Engineer: {p.siteEngineer?.fullName} • Status: {p.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {p.completionPercent}% Complete
                        </span>
                        <p className="text-[11px] text-slate-400">Schedule: {p.scheduleStatus}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isHealthy
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {p.health || (isHealthy ? "Good Condition" : "Action Required")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
