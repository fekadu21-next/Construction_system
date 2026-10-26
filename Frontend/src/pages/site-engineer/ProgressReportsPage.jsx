import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowLeft, FileText, CheckCircle2, AlertTriangle, MessageSquare, Sun, Users, Wrench, Camera, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

const REVIEW_BADGES = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
  REVIEWED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
  FLAGGED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
};

export default function ProgressReportsPage() {
  const { isDark } = useTheme();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterReview, setFilterReview] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formProject, setFormProject] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formWork, setFormWork] = useState("");
  const [formProgress, setFormProgress] = useState("");
  const [formIssues, setFormIssues] = useState("");
  const [formWeather, setFormWeather] = useState("Dry (24°C)");
  const [formLabor, setFormLabor] = useState("");
  const [formEquipment, setFormEquipment] = useState("Tower Crane #1, Concrete Pump, Mobile Mixer");
  const [formPhotos, setFormPhotos] = useState(2);

  useEffect(() => {
    loadData();
  }, [filterReview]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, repRes] = await Promise.all([
        siteEngineerService.getProjects(),
        siteEngineerService.getProgressReports({
          reviewStatus: filterReview === "ALL" ? "" : filterReview,
        }),
      ]);

      if (projRes.success) {
        setProjects(projRes.data.projects || []);
        if (!formProject && projRes.data.projects?.length > 0) {
          setFormProject(projRes.data.projects[0].id);
        }
      }

      if (repRes.success) {
        setReports(repRes.data.reports || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!formProject || !formTitle || !formWork || !formProgress) {
      alert("Please fill in the project, report title, work completed, and progress details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await siteEngineerService.submitProgressReport({
        projectId: formProject,
        reportTitle: formTitle,
        workCompleted: formWork,
        reportedProgress: formProgress,
        issuesOrDelays: formIssues,
        weatherConditions: formWeather,
        laborCount: formLabor ? parseInt(formLabor, 10) : null,
        equipmentActive: formEquipment,
        photosAttached: formPhotos ? parseInt(formPhotos, 10) : 0,
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormTitle("");
        setFormWork("");
        setFormProgress("");
        setFormIssues("");
        await loadData();
      } else {
        alert(res.error || "Failed to submit progress report");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Field Progress Reports
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              {reports.length} Reports Filed
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Submit weekly/daily milestone reports, progress percentages, and structural inspection notes to Project Managers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Progress Report</span>
          </button>
          <Link
            to="/site-engineer/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "PENDING_REVIEW", "REVIEWED", "FLAGGED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterReview(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterReview === st
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Feed */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading progress reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-[#0d1c33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No progress reports found</p>
          <p className="text-xs text-slate-500 mt-0.5">Click "Submit Progress Report" above to file your first field report.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${REVIEW_BADGES[report.reviewStatus] || "bg-slate-100"}`}>
                      {report.reviewStatus.replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {report.project?.projectName} ({report.project?.projectCode})
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {report.reportTitle}
                  </h3>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[11px] text-slate-400 block">
                    Submitted: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ""}
                  </span>
                  <span className="font-extrabold text-blue-600 dark:text-cyan-400">
                    {report.reportedProgress}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-[10px] mb-1">Completed Execution</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {report.workCompleted}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Labor Force</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" /> {report.laborCount || "—"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Weather</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> {report.weatherConditions || "Clear"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Equipment Active</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center justify-center gap-1 mt-0.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-500" /> {report.equipmentActive || "Active"}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Photos Attached</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-500" /> {report.photosAttached}
                    </span>
                  </div>
                </div>

                {report.issuesOrDelays && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Site Delays / Issues: </span>
                      {report.issuesOrDelays}
                    </div>
                  </div>
                )}

                {/* Project Manager Feedback Box */}
                {report.reviewerNotes && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold flex items-center gap-1.5 text-[11px]">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        <span>Project Manager Review Feedback ({report.reviewedBy?.fullName || "Dawit"})</span>
                      </span>
                      {report.reviewedAt && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-300 font-semibold">
                          {new Date(report.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium leading-relaxed">{report.reviewerNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>📑</span> Prepare Field Progress Report
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Project Site *</label>
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.projectName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Reported Progress Metric *</label>
                  <input
                    type="text"
                    value={formProgress}
                    onChange={(e) => setFormProgress(e.target.value)}
                    placeholder="e.g. +7.5% Slab 10 Cast & Cured"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Report Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Weekly Structural Concrete & Rebar Inspection Report"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Detailed Work Completed *</label>
                <textarea
                  rows="3"
                  value={formWork}
                  onChange={(e) => setFormWork(e.target.value)}
                  placeholder="Detail activities completed, concrete batch numbers, test compression breaks..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Site Issues / Delays (If Any)</label>
                <input
                  type="text"
                  value={formIssues}
                  onChange={(e) => setFormIssues(e.target.value)}
                  placeholder="e.g. Minor delay due to rain; pumps cleared runoff."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Labor Force</label>
                  <input
                    type="number"
                    min="0"
                    value={formLabor}
                    onChange={(e) => setFormLabor(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Weather</label>
                  <input
                    type="text"
                    value={formWeather}
                    onChange={(e) => setFormWeather(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Photos Count</label>
                  <input
                    type="number"
                    min="0"
                    value={formPhotos}
                    onChange={(e) => setFormPhotos(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to Project Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
