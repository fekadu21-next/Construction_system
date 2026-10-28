import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function HRSettingsPage() {
  const { isDark } = useTheme();

  const [settings, setSettings] = useState({
    standardWorkHours: 8,
    overtimeMultiplier: 1.5,
    defaultCurrency: "ETB",
    autoApproveLeaves: false,
    dailyAttendanceCutoff: "18:00",
    notifyOnOvertimeThreshold: true,
    overtimeAlertHours: 4,
    emailDailySummary: true,
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
        <h1 className="text-2xl font-bold tracking-tight">HR & Workforce Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure work shifts, overtime rate multipliers, attendance policies, and alerts.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
          ✓ HR preferences and policy settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Working Hours & Overtime Policy */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <h2 className="text-base font-bold mb-1">Work Shift & Overtime Policy</h2>
          <p className="text-xs text-slate-400 mb-4">Define standard labor duration and compensation rules</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Standard Work Day (Hours)
              </label>
              <input
                type="number"
                min="4"
                max="12"
                value={settings.standardWorkHours}
                onChange={(e) => setSettings({ ...settings, standardWorkHours: Number(e.target.value) })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Used as base divisor for daily rate to hourly calculation.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Overtime Multiplier Rate
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="3.0"
                value={settings.overtimeMultiplier}
                onChange={(e) => setSettings({ ...settings, overtimeMultiplier: Number(e.target.value) })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">e.g. 1.5x gives 150% hourly wage for overtime hours.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Daily Attendance Cutoff Time
              </label>
              <input
                type="time"
                value={settings.dailyAttendanceCutoff}
                onChange={(e) => setSettings({ ...settings, dailyAttendanceCutoff: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Notifications & Automation */}
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
          <h2 className="text-base font-bold mb-1">Alerts & System Automation</h2>
          <p className="text-xs text-slate-400 mb-4">Automate workforce supervision alerts</p>

          <div className="space-y-3.5 text-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnOvertimeThreshold}
                onChange={(e) => setSettings({ ...settings, notifyOnOvertimeThreshold: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-semibold text-xs">Overtime Threshold Alerts</p>
                <p className="text-[11px] text-slate-400">Trigger notification when a worker exceeds 4 hours overtime in a single shift.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailDailySummary}
                onChange={(e) => setSettings({ ...settings, emailDailySummary: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-semibold text-xs">Daily Attendance Email Digest</p>
                <p className="text-[11px] text-slate-400">Receive daily summary of on-site workers and absences at closing time.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
          >
            Save HR Settings
          </button>
        </div>
      </form>
    </div>
  );
}
