import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowLeft, ClipboardList, HardHat, Calendar, Users, Package, AlertTriangle, X, Building2, ShieldCheck, Sun, FileEdit } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { siteEngineerService } from "../../services/siteEngineerService.js";

export default function DailyActivitiesPage() {
  const { isDark } = useTheme();
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formProject, setFormProject] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formWorkCompleted, setFormWorkCompleted] = useState("");
  const [formLaborCount, setFormLaborCount] = useState("");
  const [formMaterials, setFormMaterials] = useState("");
  const [formWeather, setFormWeather] = useState("Sunny, 24°C");
  const [formSafety, setFormSafety] = useState("");
  const [formIssues, setFormIssues] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [filterProjectId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [projRes, actRes] = await Promise.all([
        siteEngineerService.getProjects(),
        siteEngineerService.getActivities({
          projectId: filterProjectId === "ALL" ? "" : filterProjectId,
        }),
      ]);

      if (projRes.success) {
        setProjects(projRes.data.projects || []);
        if (!formProject && projRes.data.projects?.length > 0) {
          setFormProject(projRes.data.projects[0].id);
        }
      }

      if (actRes.success) {
        setActivities(actRes.data.activities || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!formProject || !formDescription || !formWorkCompleted) {
      alert("Please fill in the project, activity description, and work completed.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await siteEngineerService.createActivity({
        projectId: formProject,
        activityDate: formDate,
        activityDescription: formDescription,
        workCompleted: formWorkCompleted,
        laborCount: formLaborCount ? parseInt(formLaborCount, 10) : null,
        materialsUsed: formMaterials,
        weatherConditions: formWeather,
        safetyObservations: formSafety,
        issues: formIssues,
      });

      if (res.success) {
        setIsModalOpen(false);
        // Reset form
        setFormDescription("");
        setFormWorkCompleted("");
        setFormLaborCount("");
        setFormMaterials("");
        setFormSafety("");
        setFormIssues("");
        await loadInitialData();
      } else {
        alert(res.error || "Failed to record activity");
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
              Daily Site Activities
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              Site Execution Journal
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Log daily construction operations, labor deployment, materials consumed, and site safety observations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Daily Activity</span>
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
          <span className="text-xs font-bold text-slate-400 uppercase">Project:</span>
          <button
            onClick={() => setFilterProjectId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterProjectId === "ALL"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Assigned Sites
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProjectId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterProjectId === p.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {p.projectName}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline / Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading daily site logs...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white dark:bg-[#0d1c33] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <ClipboardList className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">No site activities recorded</p>
          <p className="text-xs text-slate-500 mt-0.5">Click "Record Daily Activity" above to log today's construction work.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => (
            <div
              key={act.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {act.project?.projectName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">{act.project?.projectCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 inline" /> {act.activityDate ? new Date(act.activityDate).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : ""}
                  </span>
                  <span className="text-[10px] text-slate-400">• Recorded by {act.siteEngineer?.fullName}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{act.activityDescription}</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Work Completed:</span>
                    {act.workCompleted}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {act.laborCount && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Labor Active</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500" /> {act.laborCount} Workers
                      </p>
                    </div>
                  )}

                  {act.materialsUsed && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Materials Used</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-500" /> {act.materialsUsed}
                      </p>
                    </div>
                  )}

                  {act.weatherConditions && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Weather</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" /> {act.weatherConditions}
                      </p>
                    </div>
                  )}
                </div>

                {act.safetyObservations && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Safety Observations: </span>
                      {act.safetyObservations}
                    </div>
                  </div>
                )}

                {act.issues && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Site Delay / Issue: </span>
                      {act.issues}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-blue-500" /> Record Daily Site Activity
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Project */}
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

                {/* Date */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Activity Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Activity Headline / Description *</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., Level 10 Slab Casting & Quality Inspection"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              {/* Work Completed */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Detailed Work Completed *</label>
                <textarea
                  rows="3"
                  value={formWorkCompleted}
                  onChange={(e) => setFormWorkCompleted(e.target.value)}
                  placeholder="Detail grids completed, tests conducted, inspections performed..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Labor Count */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Workers On Site</label>
                  <input
                    type="number"
                    min="0"
                    value={formLaborCount}
                    onChange={(e) => setFormLaborCount(e.target.value)}
                    placeholder="e.g., 35"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Materials Used */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Materials Used</label>
                  <input
                    type="text"
                    value={formMaterials}
                    onChange={(e) => setFormMaterials(e.target.value)}
                    placeholder="e.g., 100 bags cement"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Weather */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Weather</label>
                  <input
                    type="text"
                    value={formWeather}
                    onChange={(e) => setFormWeather(e.target.value)}
                    placeholder="e.g., Sunny (24°C)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Safety Observations */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Safety Observations / PPE Compliance</label>
                <input
                  type="text"
                  value={formSafety}
                  onChange={(e) => setFormSafety(e.target.value)}
                  placeholder="e.g., All personnel wearing hard hats & safety harness clipped on perimeter."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Delays / Issues */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Delays / Issues Encountered</label>
                <input
                  type="text"
                  value={formIssues}
                  onChange={(e) => setFormIssues(e.target.value)}
                  placeholder="e.g., Concrete mixer pump pressure dip delayed pouring by 45 mins."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
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
                  {submitting ? "Saving Log..." : "Submit Field Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
