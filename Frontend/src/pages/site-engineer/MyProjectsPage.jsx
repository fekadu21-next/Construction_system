import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Eye, X, CheckCircle2, Clock, Calendar, Search } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

const STATUS_BADGES = {
  PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300 border-blue-200 dark:border-blue-800",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  COMPLETED: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
};

export default function MyProjectsPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [filterStatus]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await siteEngineerService.getProjects({
        status: filterStatus === "ALL" ? "" : filterStatus,
        search: searchQuery,
      });
      if (res.success) {
        setProjects(res.data.projects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProjects();
  };

  const handleOpenDetails = async (projectId) => {
    setDetailsLoading(true);
    setSelectedProject({ id: projectId });
    try {
      const res = await siteEngineerService.getProjectById(projectId);
      if (res.success) {
        setSelectedProject(res.data);
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              My Assigned Projects
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              {projects.length} Active Sites
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Construction sites and structures where you are assigned as technical execution engineer.
          </p>
        </div>

        <Link
          to="/site-engineer/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "IN_PROGRESS", "PLANNED", "ON_HOLD", "COMPLETED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === status
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site, code, location..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading assigned sites...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-[#0d1c33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No projects found</p>
          <p className="text-xs text-slate-500 mt-0.5">You currently have no projects matching this filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const milestones = proj.milestones || [];
            const avgProgress = milestones.length > 0
              ? Math.round(milestones.reduce((acc, m) => acc + (m.progressPercent || 0), 0) / milestones.length)
              : 0;

            return (
              <div
                key={proj.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${
                  isDark ? "bg-[#0d1c33] border-slate-800 hover:border-blue-500/40" : "bg-white border-slate-200/80 shadow-xs hover:border-blue-500/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                      {proj.projectCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[proj.status] || "bg-slate-100"}`}>
                      {proj.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {proj.projectName}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{proj.location}</span>
                  </p>

                  {/* Project Manager Card */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Project Manager</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {proj.projectManager?.fullName || "Unassigned"}
                    </p>
                    {proj.projectManager?.phone && (
                      <p className="text-[11px] text-slate-500">{proj.projectManager.phone}</p>
                    )}
                  </div>

                  {/* Operational Counts */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold mb-4">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-slate-900 dark:text-white">{proj._count?.tasks || 0}</span>
                      <p className="text-[10px] text-slate-400 font-medium">Tasks</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-slate-900 dark:text-white">{proj._count?.employees || 0}</span>
                      <p className="text-[10px] text-slate-400 font-medium">Workers</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                      <span className="text-slate-900 dark:text-white">{proj._count?.dailyActivities || 0}</span>
                      <p className="text-[10px] text-slate-400 font-medium">Logs</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-500">Milestone Progress</span>
                      <span className="text-blue-600 dark:text-cyan-400">{avgProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : ""}
                  </span>
                  <button
                    onClick={() => handleOpenDetails(proj.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{selectedProject.projectCode}</span>
                <h2 className="text-xl font-extrabold">{selectedProject.projectName}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{selectedProject.location}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-semibold">Loading project specification...</span>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {selectedProject.description && (
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase text-[10px] mb-1">Project Scope & Scope</h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedProject.description}</p>
                  </div>
                )}

                {/* Milestones Road Map */}
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-[10px] mb-2">Project Milestones</h4>
                  {selectedProject.milestones?.length === 0 ? (
                    <p className="text-slate-400 italic">No milestones defined.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProject.milestones?.map((m) => (
                        <div key={m.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{m.milestoneName}</p>
                            <p className="text-[10px] text-slate-500">
                              Target: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-blue-600 dark:text-cyan-400">{m.progressPercent}%</span>
                            <p className="text-[10px] text-slate-400 font-semibold">{m.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assigned Workforce */}
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-[10px] mb-2">Assigned Project Workers</h4>
                  {selectedProject.employees?.length === 0 ? (
                    <p className="text-slate-400 italic">No active workers assigned to this site yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProject.employees?.map((emp) => (
                        <div key={emp.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{emp.fullName}</p>
                            <p className="text-[10px] text-slate-500">{emp.employeeCode} • {emp.phone}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {emp.trade}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
