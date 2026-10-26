import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function ProgressReportsPage() {
  const { isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setReports(res.data.recentProgressReports || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleReview = async (id) => {
    try {
      const res = await projectManagerService.reviewProgressReport(id, "Reviewed by Project Manager");
      if (res.success) {
        showToast(res.message);
        setSelectedReport(null);
        await loadReports();
      }
    } catch {
      showToast("Error reviewing report.");
    }
  };

  const filtered = reports.filter((r) => {
    return (
      !search ||
      r.reportTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      r.siteEngineer.toLowerCase().includes(search.toLowerCase())
    );
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
              Site Progress Reports
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
              {reports.length} Reports Filed
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time field updates from Site Engineers detailing daily labor, concrete pours, weather, and risks.
          </p>
        </div>

        <Link
          to="/project-manager/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>

      {/* Search Input */}
      <div
        className={`p-4 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search report title, engineer, project..."
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

      {/* Reports Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Loading progress reports...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-white dark:bg-[#0d1c33] border-slate-200 dark:border-slate-800 text-slate-500">
          <span className="text-4xl">📑</span>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">No progress reports found</p>
          <p className="text-xs text-slate-400 mt-1">Check back later or adjust your search filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((r) => {
            const badgeClass =
              r.reviewStatus === "Reviewed"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : r.reviewStatus === "Flagged"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";

            return (
              <div
                key={r.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-all hover:border-blue-500/40 ${
                  isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                        {r.projectName}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {r.reportTitle}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${badgeClass}`}>
                      {r.reviewStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    By <strong className="text-slate-700 dark:text-slate-200">{r.siteEngineer}</strong> • Submitted: {r.submissionDate}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      📈 {r.reportedProgress}
                    </p>
                    {r.issuesOrDelays && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        ⚠️ <span className="font-semibold">Issues:</span> {r.issuesOrDelays}
                      </p>
                    )}
                  </div>

                  {/* Conditions & Labor */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Weather</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{r.weatherConditions || "Clear"}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Site Crew</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{r.laborCount || "—"} Workers</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Photos</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">📸 {r.photosAttached || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    View Full Report
                  </button>
                  {r.reviewStatus !== "Reviewed" && (
                    <button
                      onClick={() => handleReview(r.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                    >
                      ✓ Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-xl rounded-2xl shadow-2xl border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#0b172d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold">{selectedReport.reportTitle}</h3>
                <p className="text-xs text-blue-600 dark:text-cyan-400 mt-0.5">
                  {selectedReport.projectName} • Submitted by {selectedReport.siteEngineer}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-600 uppercase">Reported Progress</span>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                  {selectedReport.reportedProgress}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold uppercase text-slate-400">Issues & Impediments</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {selectedReport.issuesOrDelays || "No issues reported."}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold uppercase text-slate-400">Equipment Active</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">
                  {selectedReport.equipmentActive || "Standard tools and equipment in operation."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400">Date: {selectedReport.submissionDate}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
                >
                  Close
                </button>
                {selectedReport.reviewStatus !== "Reviewed" && (
                  <button
                    onClick={() => handleReview(selectedReport.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                  >
                    ✓ Acknowledge & Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
