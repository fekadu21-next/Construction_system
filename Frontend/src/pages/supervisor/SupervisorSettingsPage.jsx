import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorSettingsPage() {
  const { isDark } = useTheme();

  const [settings, setSettings] = useState({
    shiftStartTime: "07:30",
    shiftEndTime: "17:30",
    dailyAttendanceCutoff: "18:00",
    requireIncidentSupervisorSignoff: true,
    autoFlagOverdueTasks: true,
    lowMaterialAlertThreshold: 20,
    notifyOnSafetyHazard: true,
    emergencySiteContact: "+251 911 234 567",
    siteSafetyBriefingFrequency: "DAILY",
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Operations Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure site shift hours, daily attendance submission limits, safety protocols, and operational thresholds.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-sm font-semibold flex items-center gap-2">
          <span>✓</span> Site operational configurations saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Working Shifts & Attendance Timelines */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⏱️</span>
            <h2 className="text-base font-bold">Shift Hours & Attendance Cutoffs</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Set site operating hours and attendance submission deadlines</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Shift Start Time
              </label>
              <input
                type="time"
                value={settings.shiftStartTime}
                onChange={(e) => setSettings({ ...settings, shiftStartTime: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Shift End Time
              </label>
              <input
                type="time"
                value={settings.shiftEndTime}
                onChange={(e) => setSettings({ ...settings, shiftEndTime: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Attendance Cutoff Time
              </label>
              <input
                type="time"
                value={settings.dailyAttendanceCutoff}
                onChange={(e) => setSettings({ ...settings, dailyAttendanceCutoff: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Safety, Incidents & Compliance */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🛡️</span>
            <h2 className="text-base font-bold">Safety & Incident Controls</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Enforce safety briefings and escalation contacts for field incidents</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Safety Briefing Frequency
              </label>
              <select
                value={settings.siteSafetyBriefingFrequency}
                onChange={(e) => setSettings({ ...settings, siteSafetyBriefingFrequency: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="DAILY">Every Morning Before Shift (Daily)</option>
                <option value="WEEKLY">Weekly Toolbox Talk</option>
                <option value="BIWEEKLY">Bi-weekly Safety Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Site Emergency Hotline
              </label>
              <input
                type="text"
                value={settings.emergencySiteContact}
                onChange={(e) => setSettings({ ...settings, emergencySiteContact: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireIncidentSupervisorSignoff}
                onChange={(e) => setSettings({ ...settings, requireIncidentSupervisorSignoff: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <div>
                <p className="text-xs font-semibold">Mandatory Supervisor Sign-off on All Incident Reports</p>
                <p className="text-[11px] text-slate-400">Requires supervisor digital verification before tickets can be resolved</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnSafetyHazard}
                onChange={(e) => setSettings({ ...settings, notifyOnSafetyHazard: e.target.checked })}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
              />
              <div>
                <p className="text-xs font-semibold">Instant Alert on High-Severity Safety Hazards</p>
                <p className="text-[11px] text-slate-400">Trigger immediate header notification when high-risk hazards are logged</p>
              </div>
            </label>
          </div>
        </div>

        {/* Material & Task Automation */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧱</span>
            <h2 className="text-base font-bold">Materials & Task Thresholds</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Automated flags for depleted site inventory and overdue milestone activities</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Low Material Alert Threshold (%)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={settings.lowMaterialAlertThreshold}
                onChange={(e) => setSettings({ ...settings, lowMaterialAlertThreshold: Number(e.target.value) })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Highlight supplies when inventory drops below this level.</span>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={settings.autoFlagOverdueTasks}
                  onChange={(e) => setSettings({ ...settings, autoFlagOverdueTasks: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <p className="text-xs font-semibold">Auto-flag Tasks Exceeding Due Dates</p>
                  <p className="text-[11px] text-slate-400">Mark tasks overdue automatically at end-of-day cutoff</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-sm transition-colors"
          >
            Save Site Settings
          </button>
        </div>
      </form>
    </div>
  );
}
