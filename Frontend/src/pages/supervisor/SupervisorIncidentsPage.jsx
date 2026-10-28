import { useState, useEffect } from "react";
import { supervisorApi } from "../../services/supervisorApi.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorIncidentsPage() {
  const { isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Report Modal
  const [reportModal, setReportModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("SAFETY");
  const [severity, setSeverity] = useState("MEDIUM");
  const [location, setLocation] = useState("");

  // Resolve Modal
  const [resolveModal, setResolveModal] = useState({ open: false, incident: null });
  const [resolutionText, setResolutionText] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadIncidents();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const res = await supervisorApi.getProjects();
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        setSelectedProjectId(res.data[0].id);
      }
    } catch {
      setStatusMsg({ text: "Failed to load projects", type: "error" });
    }
  };

  const loadIncidents = async () => {
    setLoading(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await supervisorApi.getIncidents(selectedProjectId);
      if (res.success) {
        setIncidents(res.data || []);
      }
    } catch {
      setStatusMsg({ text: "Failed to load incidents", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await supervisorApi.reportIncident({
        projectId: selectedProjectId,
        title,
        description,
        incidentType,
        severity,
        location,
        incidentDate: new Date().toISOString().split("T")[0],
      });
      if (res.success) {
        setStatusMsg({ text: "✓ Site incident officially filed and broadcast to Project Manager!", type: "success" });
        setReportModal(false);
        setTitle("");
        setDescription("");
        setLocation("");
        loadIncidents();
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to file incident", type: "error" });
    }
  };

  const handleResolveIncident = async (e) => {
    e.preventDefault();
    if (!resolveModal.incident || !resolutionText.trim()) return;

    try {
      const res = await supervisorApi.resolveIncident(resolveModal.incident.id, {
        resolution: resolutionText.trim(),
        status: "RESOLVED",
      });
      if (res.success) {
        setStatusMsg({ text: "✓ Incident marked as resolved with official closure notes", type: "success" });
        setResolveModal({ open: false, incident: null });
        setResolutionText("");
        loadIncidents();
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to resolve incident", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Incidents & Hazard Reporting</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log safety near-misses, work blockers, weather delays, and equipment breakdowns.
          </p>
        </div>

        <button
          onClick={() => setReportModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-colors"
        >
          <span>⚠️</span> File Incident Report
        </button>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          statusMsg.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ text: "", type: "" })} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Project Selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Project:</label>
        {projects.length === 1 ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm font-bold text-amber-600 dark:text-amber-400">
            <span>🔒</span>
            <span>{projects[0].projectName}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono">
              {projects[0].projectCode}
            </span>
          </div>
        ) : projects.length > 1 ? (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm font-semibold outline-hidden ${
              isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"
            }`}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName} ({p.projectCode})
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-semibold text-rose-500">No project assigned</span>
        )}
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading incident records...</div>
        ) : incidents.length === 0 ? (
          <div className={`p-12 rounded-2xl border text-center text-slate-400 ${
            isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}>
            🎉 No active incidents or safety violations reported on this construction site.
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                    inc.severity === "CRITICAL"
                      ? "bg-rose-500 text-white"
                      : inc.severity === "HIGH"
                      ? "bg-orange-500 text-white"
                      : inc.severity === "MEDIUM"
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {inc.severity} Severity
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {inc.incidentType}
                  </span>

                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    inc.status === "RESOLVED" || inc.status === "CLOSED"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {inc.status}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  {new Date(inc.incidentDate).toLocaleDateString()} • Reported by {inc.reporter?.fullName || "Supervisor"}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">{inc.title}</h3>
                <p className="text-xs text-slate-400 whitespace-pre-line mb-3">{inc.description}</p>
                {inc.location && (
                  <p className="text-xs text-slate-500 mb-3">📍 Site Location: {inc.location}</p>
                )}

                {inc.resolution && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    <span className="font-bold">Closure Resolution:</span> {inc.resolution}
                  </div>
                )}
              </div>

              {inc.status === "OPEN" && (
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      setResolveModal({ open: true, incident: inc });
                      setResolutionText("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Resolve & Close Ticket
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleReportIncident}
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <h3 className="text-base font-bold mb-1">File Site Incident / Hazard</h3>
            <p className="text-xs text-slate-400 mb-4">Official report submitted to Project Management & Safety.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Incident Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaffolding clamp slippage on Grid 4"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Category</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="SAFETY">SAFETY</option>
                    <option value="DELAY">DELAY / BLOCKER</option>
                    <option value="MATERIAL_SHORTAGE">MATERIAL SHORTAGE</option>
                    <option value="EQUIPMENT_BREAKDOWN">EQUIPMENT BREAKDOWN</option>
                    <option value="WEATHER">WEATHER DISRUPTION</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border outline-hidden ${
                      isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Site Location / Grid</label>
                <input
                  type="text"
                  placeholder="e.g. Block B, 2nd floor elevator core"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Incident Description & Root Cause</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe exact sequence of events, personnel involved, and immediate corrective steps taken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                File Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleResolveIncident}
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl ${
              isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <h3 className="text-base font-bold mb-1">Resolve Incident Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">{resolveModal.incident?.title}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-400 mb-1">Resolution Actions Taken</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail corrective actions, safety inspections passed, and preventative measures implemented..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border outline-hidden ${
                    isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-300"
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setResolveModal({ open: false, incident: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
