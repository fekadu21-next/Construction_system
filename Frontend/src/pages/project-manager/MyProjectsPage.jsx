import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, MapPin, Eye, X, CheckCircle2, Clock, Calendar, ArrowRight } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { projectManagerService } from "../../services/projectManagerService.js";

export default function MyProjectsPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectManagerService.getDashboardOverview();
      if (res.success) {
        setProjects(res.data.projects || []);
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

  const filtered = projects.filter((p) => {
    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "DELAYED"
        ? p.status === "DELAYED" || p.scheduleStatus === "Delayed"
        : p.status === statusFilter;
    const matchSearch =
      !search ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.siteEngineer?.fullName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Assigned Projects
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
              {filtered.length} Projects
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comprehensive portfolio of construction projects under your supervisory control.
          </p>
        </div>

        <Link
          to="/project-manager/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50"
        >
          <span>← Back to Overview</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "IN_PROGRESS", "PLANNED", "DELAYED", "ON_HOLD", "COMPLETED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  statusFilter === tab
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Filter by project or site engineer..."
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

      {/* Projects Grid Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold">Loading projects...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border bg-white dark:bg-[#0d1c33] border-slate-200 dark:border-slate-800 text-slate-500">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust filters or search keywords</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const scheduleBadge =
              p.scheduleStatus === "Ahead"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300"
                : p.scheduleStatus === "Delayed"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {p.projectCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {p.projectName}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${scheduleBadge}`}>
                      {p.scheduleStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{p.location}</span>
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Site Engineer:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{p.siteEngineer?.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Timeline:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(p.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} - {new Date(p.expectedEndDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Overall Progress</span>
                      <span className="text-blue-600 dark:text-cyan-400">{p.completionPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: `${p.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Planned Budget</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(p.plannedBudget)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Actual Spent</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(p.actualExpenditure)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setSelectedProject(p)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl border p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 ${
              isDark ? "bg-[#0b172d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold">{selectedProject.projectName}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 font-bold">
                    {selectedProject.projectCode}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {selectedProject.location}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <p className="font-bold uppercase text-slate-400 mb-1">Project Scope</p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedProject.scope}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-bold uppercase text-slate-400 mb-1">Assigned Lead Site Engineer</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedProject.siteEngineer?.fullName}</p>
                <p className="text-slate-500">{selectedProject.siteEngineer?.email} • {selectedProject.siteEngineer?.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-600 font-bold uppercase">Planned Budget</span>
                  <p className="font-black text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {formatCurrency(selectedProject.plannedBudget)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-purple-600 font-bold uppercase">Actual Spent</span>
                  <p className="font-black text-sm text-purple-700 dark:text-purple-300 mt-1">
                    {formatCurrency(selectedProject.actualExpenditure)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs"
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
