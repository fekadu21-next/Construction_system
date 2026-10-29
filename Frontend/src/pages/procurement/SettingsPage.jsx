import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { preferencesApi } from "../../services/preferencesApi.js";

export default function ProcurementSettingsPage() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [preferences, setPreferences] = useState({
    theme: isDark ? "dark" : "light",
    language: language || "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12-hour",
    timeZone: "Africa/Addis_Ababa",
    currency: "ETB",
    defaultPage: "/procurement/dashboard",
    reorderThresholdBuffer: "15",
    notifications: {
      email: true,
      inAppAlerts: true,
      lowStockMaterials: true,
      outOfStockMaterials: true,
      newApprovedMaterialRequests: true,
      purchaseOrderApprovalsRejections: true,
      upcomingOrOverdueDeliveries: true,
      damagedOrMissingDeliveryItems: true,
      deliveryReceivedOrPartiallyReceived: true,
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
        setSuccess("Procurement & storekeeper settings saved successfully!");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(result.error || "Failed to save preferences");
      }
    } catch (err) {
      setError("Failed to save preferences. Please check your network.");
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
      currency: "ETB",
      defaultPage: "/procurement/dashboard",
      reorderThresholdBuffer: "15",
      notifications: {
        email: true,
        inAppAlerts: true,
        lowStockMaterials: true,
        outOfStockMaterials: true,
        newApprovedMaterialRequests: true,
        purchaseOrderApprovalsRejections: true,
        upcomingOrOverdueDeliveries: true,
        damagedOrMissingDeliveryItems: true,
        deliveryReceivedOrPartiallyReceived: true,
      },
    };
    setPreferences(defaults);
    setSuccess("Preferences reset to default values. Click 'Save Changes' to apply.");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleThemeChange = (newTheme) => {
    setPreferences((prev) => ({ ...prev, theme: newTheme }));
    if ((newTheme === "dark" && !isDark) || (newTheme === "light" && isDark)) {
      toggleTheme();
    }
  };

  const handleLanguageChange = (newLang) => {
    setPreferences((prev) => ({ ...prev, language: newLang }));
    setLanguage(newLang);
  };

  const toggleNotification = (key) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
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

  const notificationOptions = [
    {
      key: "lowStockMaterials",
      title: "Low-stock materials",
      icon: "⚠️",
      badge: "Stock Level",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description: "Trigger alerts whenever warehouse material inventory drops below safety reorder thresholds.",
    },
    {
      key: "outOfStockMaterials",
      title: "Out-of-stock materials",
      icon: "🚫",
      badge: "Critical",
      badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description: "High-priority alert when material quantity reaches zero to prevent active site construction delays.",
    },
    {
      key: "newApprovedMaterialRequests",
      title: "New approved material requests",
      icon: "📋",
      badge: "Requisitions",
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description: "Notify immediately when Project Managers or General Managers approve site material requests.",
    },
    {
      key: "purchaseOrderApprovalsRejections",
      title: "Purchase-order approvals or rejections",
      icon: "📑",
      badge: "Purchase Orders",
      badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
      description: "Get real-time updates when purchase orders are approved, requested for amendment, or rejected by GM.",
    },
    {
      key: "upcomingOrOverdueDeliveries",
      title: "Upcoming or overdue deliveries",
      icon: "⏰",
      badge: "Logistics",
      badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      description: "Reminders for expected supplier delivery dates, customs clearances, and overdue shipment tracking.",
    },
    {
      key: "damagedOrMissingDeliveryItems",
      title: "Damaged or missing delivery items",
      icon: "🔍",
      badge: "Quality Inspection",
      badgeColor: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
      description: "Alert when discrepancy or damaged cargo reports are logged during warehouse receiving inspection.",
    },
    {
      key: "deliveryReceivedOrPartiallyReceived",
      title: "Delivery received or partially received",
      icon: "🚚",
      badge: "Goods Receiving",
      badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
      description: "Notify storekeeper and procurement when goods arrive at central stores or partial fulfillment is logged.",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Loading procurement settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
        >
          Reset Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      {/* Feedback Messages */}
      {success && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <span>✓</span> {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2 shadow-xs animate-in fade-in">
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
              <h2 className="text-base font-black">Appearance & Theme</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the visual interface theme for the procurement workspace.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                isDark
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🌙</span>
                <div>
                  <p className="text-xs font-bold">Dark Mode (Night Shift)</p>
                  <p className="text-[11px] text-slate-400">Deep obsidian & sapphire contrast theme</p>
                </div>
              </div>
              <input
                type="radio"
                name="theme"
                checked={isDark}
                onChange={() => handleThemeChange("dark")}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label
              onClick={() => handleThemeChange("light")}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                !isDark
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">☀️</span>
                <div>
                  <p className="text-xs font-bold">Light Mode (Daylight)</p>
                  <p className="text-[11px] text-slate-400">Bright and crisp warehouse daytime theme</p>
                </div>
              </div>
              <input
                type="radio"
                name="theme"
                checked={!isDark}
                onChange={() => handleThemeChange("light")}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
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
              <h2 className="text-base font-black">Language & Regional Locale</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure interface language, time zones, and currency.
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
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="en">🇺🇸 English (US)</option>
                <option value="am">🇪🇹 አማርኛ (Amharic)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Time Zone
                </label>
                <select
                  value={preferences.timeZone}
                  onChange={(e) => setPreferences({ ...preferences, timeZone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TIME_ZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Currency Symbol
                </label>
                <select
                  value={preferences.currency || "ETB"}
                  onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
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
                Display formats for shipment schedules and delivery receipts.
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
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 26/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/26/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-26)</option>
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
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
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
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  24-Hour (Military)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse & Inventory Controls */}
        <div
          className={`p-6 rounded-2xl border transition-all duration-200 shadow-sm ${
            isDark
              ? "bg-[#0c1830] border-slate-800 text-slate-100"
              : "bg-white border-slate-200/80 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xl">📦</span>
            <div>
              <h2 className="text-base font-black">Warehouse & Store Parameters</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operational defaults for material reorder thresholds.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Safety Stock Reorder Buffer (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={preferences.reorderThresholdBuffer || "15"}
                  onChange={(e) => setPreferences({ ...preferences, reorderThresholdBuffer: e.target.value })}
                  className="w-32 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Buffer margin above minimum reorder level before alerting
                </span>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Dispatch Notification Channels
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.email}
                    onChange={() => toggleNotification("email")}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-200">Email Digest</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.inAppAlerts}
                    onChange={() => toggleNotification("inAppAlerts")}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-200">In-App Floating</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Procurement & Storekeeper Notification Alert Triggers (Full Width Card) */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 shadow-sm ${
          isDark
            ? "bg-[#0c1830] border-slate-800 text-slate-100"
            : "bg-white border-slate-200/80 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-600 dark:text-cyan-400">
              🔔
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                Storekeeper & Procurement Notification Alerts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose precisely which warehouse, supply-chain, and requisition events trigger notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const allTrue = {};
                notificationOptions.forEach((opt) => {
                  allTrue[opt.key] = true;
                });
                setPreferences((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, ...allTrue },
                }));
              }}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1"
            >
              Enable All
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={() => {
                const allFalse = {};
                notificationOptions.forEach((opt) => {
                  allFalse[opt.key] = false;
                });
                setPreferences((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, ...allFalse },
                }));
              }}
              className="text-[11px] font-bold text-slate-500 hover:underline px-2 py-1"
            >
              Disable All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {notificationOptions.map((opt) => {
            const isChecked = !!preferences.notifications[opt.key];
            return (
              <label
                key={opt.key}
                onClick={() => toggleNotification(opt.key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 select-none ${
                  isChecked
                    ? isDark
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : "bg-emerald-50/70 border-emerald-200"
                    : isDark
                    ? "bg-[#09152a] border-slate-800/80 hover:border-slate-700 opacity-75"
                    : "bg-slate-50/50 border-slate-200/80 hover:border-slate-300 opacity-75"
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by label click
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm shrink-0">{opt.icon}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.title}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full border ${opt.badgeColor}`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
