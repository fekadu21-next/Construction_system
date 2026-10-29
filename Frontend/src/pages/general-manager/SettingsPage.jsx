import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { preferencesApi } from "../../services/preferencesApi.js";

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [preferences, setPreferences] = useState({
    theme: isDark ? "dark" : "light",
    language: language || "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour",
    timeZone: "Africa/Addis_Ababa",
    defaultPage: "/general-manager/dashboard",
    notifications: {
      email: true,
      projectUpdates: true,
      procurementUpdates: true,
      financeAlerts: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const result = await preferencesApi.getPreferences();
      if (result.success && result.data) {
        setPreferences((prev) => ({
          ...prev,
          ...result.data,
          notifications: {
            ...prev.notifications,
            ...(result.data.notifications || {}),
          },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch preferences", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await preferencesApi.updatePreferences(preferences);
      if (result.success) {
        setSuccess("Settings and preferences saved successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(result.error || "Failed to save preferences");
      }
    } catch (err) {
      setError("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = {
      theme: "dark",
      language: "en",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12-hour",
      timeZone: "Africa/Addis_Ababa",
      defaultPage: "/general-manager/dashboard",
      notifications: {
        email: true,
        projectUpdates: true,
        procurementUpdates: true,
        financeAlerts: true,
      },
    };
    setPreferences(defaults);
    setSuccess("Preferences reset to default values. Click Save to apply.");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleThemeChange = (newTheme) => {
    setPreferences({ ...preferences, theme: newTheme });
    if ((newTheme === "dark" && !isDark) || (newTheme === "light" && isDark)) {
      toggleTheme();
    }
  };

  const handleLanguageChange = (newLang) => {
    setPreferences({ ...preferences, language: newLang });
    setLanguage(newLang);
  };

  const TIME_ZONES = [
    "Africa/Addis_Ababa",
    "Africa/Nairobi",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Asia/Dubai",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Settings & Preferences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalize your workspace experience, regional formats, and notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
          <span>✕</span> {error}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance & Theme Card */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
            isDark
              ? "bg-[#0c1830] border-slate-800 text-slate-100"
              : "bg-white border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xl">🎨</span>
            <div>
              <h2 className="text-base font-black">Appearance</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the visual interface theme for the system.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                isDark
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-400 font-bold"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🌙</span>
                <div>
                  <p className="text-xs font-bold">Dark Mode</p>
                  <p className="text-[11px] text-slate-400">High-contrast sleek dark theme</p>
                </div>
              </div>
              <input
                type="radio"
                name="theme"
                checked={isDark}
                onChange={() => handleThemeChange("dark")}
                className="w-4 h-4 text-blue-600"
              />
            </label>

            <label
              onClick={() => handleThemeChange("light")}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                !isDark
                  ? "bg-blue-50 border-blue-300 text-blue-600 font-bold"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">☀️</span>
                <div>
                  <p className="text-xs font-bold">Light Mode</p>
                  <p className="text-[11px] text-slate-400">Bright and clean daylight theme</p>
                </div>
              </div>
              <input
                type="radio"
                name="theme"
                checked={!isDark}
                onChange={() => handleThemeChange("light")}
                className="w-4 h-4 text-blue-600"
              />
            </label>
          </div>
        </div>

        {/* Language & Regional Settings */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
            isDark
              ? "bg-[#0c1830] border-slate-800 text-slate-100"
              : "bg-white border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xl">🌐</span>
            <div>
              <h2 className="text-base font-black">Language & Locale</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure default language and regional time zones.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                System Language
              </label>
              <select
                value={preferences.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">🇺🇸 English (US)</option>
                <option value="am">🇪🇹 አማርኛ (Amharic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Time Zone
              </label>
              <select
                value={preferences.timeZone}
                onChange={(e) => setPreferences({ ...preferences, timeZone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_ZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date & Time Formats */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
            isDark
              ? "bg-[#0c1830] border-slate-800 text-slate-100"
              : "bg-white border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xl">📅</span>
            <div>
              <h2 className="text-base font-black">Date & Time Format</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Display formats for project timelines and deadlines.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Date Format
              </label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 25/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/25/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-25)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Time Format
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, timeFormat: "12-hour" })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    preferences.timeFormat === "12-hour"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  12-Hour (AM/PM)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, timeFormat: "24-hour" })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    preferences.timeFormat === "24-hour"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  24-Hour (Military)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
            isDark
              ? "bg-[#0c1830] border-slate-800 text-slate-100"
              : "bg-white border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xl">🔔</span>
            <div>
              <h2 className="text-base font-black">Notification Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose which system events trigger notifications.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Email Notifications
              </span>
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, email: e.target.checked },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Construction Project Updates
              </span>
              <input
                type="checkbox"
                checked={preferences.notifications.projectUpdates}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, projectUpdates: e.target.checked },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Financial & Budget Alerts
              </span>
              <input
                type="checkbox"
                checked={preferences.notifications.financeAlerts}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, financeAlerts: e.target.checked },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
