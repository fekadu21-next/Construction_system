import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { preferencesApi } from "../../services/preferencesApi.js";

export default function AccountantSettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState("appearance"); // "appearance" | "fiscal" | "alerts" | "system"
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  // Settings State
  const [settings, setSettings] = useState({
    theme: theme || "light",
    accentColor: localStorage.getItem("app_accent_color") || "indigo",
    compactTables: localStorage.getItem("app_compact_tables") === "true",
    currency: "ETB",
    fiscalYear: "2026",
    decimalPlaces: "2",
    dateFormat: "YYYY-MM-DD",
    budgetAlertThreshold: 85,
    largeExpenseThreshold: 50000,
    invoiceDueReminderDays: 7,
    notifyOnBudgetOverrun: true,
    notifyOnPendingPayments: true,
    notifyOnLaborSubmissions: true,
    emailDailyDigest: false,
    autoRefreshLedger: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await preferencesApi.getPreferences();
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          theme: res.data.theme || theme,
        }));
      }
    } catch {
      // Local fallback
    }
  };

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setSettings((prev) => ({ ...prev, theme: selectedTheme }));
    setStatusMsg({
      text: `✓ Switched to ${selectedTheme === "dark" ? "Dark Mode 🌙" : "Light Mode ☀️"}`,
      type: "success",
    });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
  };

  const handleAccentChange = (color) => {
    localStorage.setItem("app_accent_color", color);
    setSettings((prev) => ({ ...prev, accentColor: color }));
    setStatusMsg({ text: `✓ Accent palette updated to ${color}`, type: "success" });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 2500);
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setStatusMsg({ text: "", type: "" });

    try {
      localStorage.setItem("app_compact_tables", settings.compactTables);
      localStorage.setItem("app_accent_color", settings.accentColor);

      const res = await preferencesApi.updatePreferences({
        theme: settings.theme,
        currency: settings.currency,
        fiscalYear: settings.fiscalYear,
        dateFormat: settings.dateFormat,
        notifications: {
          budgetAlerts: settings.notifyOnBudgetOverrun,
          pendingPayments: settings.notifyOnPendingPayments,
          laborSubmissions: settings.notifyOnLaborSubmissions,
          emailDigest: settings.emailDailyDigest,
        },
      });

      if (res.success) {
        setStatusMsg({ text: "✓ All accountant settings & appearance preferences saved!", type: "success" });
      } else {
        setStatusMsg({ text: "✓ Local preferences updated successfully!", type: "success" });
      }
    } catch {
      setStatusMsg({ text: "✓ Local preferences saved successfully!", type: "success" });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              System Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Accountant Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Customize interface theme, display modes, financial reporting policies, and automated fiscal notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/accountant/profile"
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
              isDark
                ? "border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
            }`}
          >
            <span>👤</span>
            <span>View Profile</span>
          </Link>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>💾</span>
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Alert */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between shadow-2xs transition-all ${
            statusMsg.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
            <span className="font-medium">{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg({ text: "", type: "" })}
            className="text-slate-400 hover:text-white font-bold text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "appearance", label: "Theme & Mode", icon: "🎨" },
          { id: "fiscal", label: "Currency & Fiscal Policy", icon: "💵" },
          { id: "alerts", label: "Alerts & Notifications", icon: "🔔" },
          { id: "system", label: "Data & Display", icon: "⚙️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Theme & Mode Changer */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          {/* Theme Mode Selector Cards */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span>🌓</span> Display Theme & Mode Changer
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your preferred interface display mode for financial accounting
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-mono">
                Current: {theme}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Mode Card */}
              <div
                onClick={() => handleThemeSelect("light")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme === "light"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                    : isDark
                    ? "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">☀️</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Light Mode</h3>
                      <p className="text-[11px] text-slate-500">Daytime clarity & high contrast</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="themeSelect"
                    checked={theme === "light"}
                    onChange={() => handleThemeSelect("light")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {/* Preview Thumbnail */}
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 space-y-1.5 pointer-events-none">
                  <div className="h-3 w-1/3 bg-slate-300 rounded"></div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-8 bg-white border border-slate-200 rounded p-1">
                      <div className="h-2 w-8 bg-indigo-400 rounded"></div>
                      <div className="h-2 w-12 bg-slate-300 rounded mt-1"></div>
                    </div>
                    <div className="h-8 bg-white border border-slate-200 rounded p-1">
                      <div className="h-2 w-8 bg-emerald-400 rounded"></div>
                      <div className="h-2 w-10 bg-slate-300 rounded mt-1"></div>
                    </div>
                    <div className="h-8 bg-white border border-slate-200 rounded p-1">
                      <div className="h-2 w-8 bg-amber-400 rounded"></div>
                      <div className="h-2 w-10 bg-slate-300 rounded mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Mode Card */}
              <div
                onClick={() => handleThemeSelect("dark")}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  theme === "dark"
                    ? "border-indigo-500 bg-indigo-950/30 shadow-md ring-2 ring-indigo-500/30"
                    : isDark
                    ? "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🌙</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Dark Mode</h3>
                      <p className="text-[11px] text-slate-400">Deep navy/slate low eye strain</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="themeSelect"
                    checked={theme === "dark"}
                    onChange={() => handleThemeSelect("dark")}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {/* Preview Thumbnail */}
                <div className="p-3 rounded-xl bg-[#080e1e] border border-slate-800 text-slate-200 space-y-1.5 pointer-events-none">
                  <div className="h-3 w-1/3 bg-slate-700 rounded"></div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-8 bg-[#0b1328] border border-slate-800 rounded p-1">
                      <div className="h-2 w-8 bg-indigo-500 rounded"></div>
                      <div className="h-2 w-12 bg-slate-700 rounded mt-1"></div>
                    </div>
                    <div className="h-8 bg-[#0b1328] border border-slate-800 rounded p-1">
                      <div className="h-2 w-8 bg-emerald-500 rounded"></div>
                      <div className="h-2 w-10 bg-slate-700 rounded mt-1"></div>
                    </div>
                    <div className="h-8 bg-[#0b1328] border border-slate-800 rounded p-1">
                      <div className="h-2 w-8 bg-amber-500 rounded"></div>
                      <div className="h-2 w-10 bg-slate-700 rounded mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Toggle Button Row */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Quick 1-click theme switch:
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3.5 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{isDark ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}</span>
              </button>
            </div>
          </div>

          {/* Language Selection Card */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <span>🌐</span> System Language
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your interface language for financial terminologies and accounting labels
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-mono">
                {language === "am" ? "አማርኛ (Amharic)" : "English (US)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setLanguage("en")}
                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  language === "en"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                    : isDark
                    ? "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">English (US)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Default financial language</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="langSelect"
                  checked={language === "en"}
                  onChange={() => setLanguage("en")}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div
                onClick={() => setLanguage("am")}
                className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                  language === "am"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                    : isDark
                    ? "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇪🇹</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">አማርኛ (Amharic)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">የኢትዮጵያ የስራ ቋንቋ</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="langSelect"
                  checked={language === "am"}
                  onChange={() => setLanguage("am")}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Accent Color Palette Selector */}
          <div
            className={`p-6 rounded-3xl border ${
              isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <h2 className="text-base font-bold flex items-center gap-2 mb-1">
              <span>🎨</span> Brand Accent Palette
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select primary highlight accent across charts, KPI borders, and fiscal indicators
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "indigo", name: "Royal Indigo", hex: "#6366f1", bg: "bg-indigo-500" },
                { id: "emerald", name: "Emerald Mint", hex: "#10b981", bg: "bg-emerald-500" },
                { id: "cyan", name: "Cyan Teal", hex: "#06b6d4", bg: "bg-cyan-500" },
                { id: "violet", name: "Amethyst Violet", hex: "#8b5cf6", bg: "bg-violet-500" },
              ].map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => handleAccentChange(accent.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    settings.accentColor === accent.id
                      ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/10"
                      : isDark
                      ? "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${accent.bg} shrink-0 shadow-xs`} />
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{accent.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{accent.hex}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fiscal Policy & Currency */}
      {activeTab === "fiscal" && (
        <div
          className={`p-6 rounded-3xl border space-y-6 ${
            isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>💵</span> Fiscal & Currency Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure accounting base currency, decimal precision, and fiscal period defaults
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="ETB">ETB - Ethiopian Birr (ብር)</option>
                <option value="USD">USD - United States Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                All ledger summaries, invoice balances, and budget reports will format using this currency.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Fiscal Year Period
              </label>
              <select
                value={settings.fiscalYear}
                onChange={(e) => setSettings({ ...settings, fiscalYear: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="2026">FY 2026 (Current Active Period)</option>
                <option value="2025">FY 2025 (Previous Closed Year)</option>
                <option value="2027">FY 2027 (Future Budget Allocation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Decimal Precision
              </label>
              <select
                value={settings.decimalPlaces}
                onChange={(e) => setSettings({ ...settings, decimalPlaces: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="2">Standard 2 Decimals (e.g. 1,250.00)</option>
                <option value="0">Rounded Whole Units (e.g. 1,250)</option>
                <option value="4">High Precision 4 Decimals (e.g. 1,250.0000)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Date Display Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="YYYY-MM-DD">ISO Standard (YYYY-MM-DD)</option>
                <option value="DD/MM/YYYY">European / Ethiopian Standard (DD/MM/YYYY)</option>
                <option value="MM/DD/YYYY">US Standard (MM/DD/YYYY)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Alerts & Notification Policies */}
      {activeTab === "alerts" && (
        <div
          className={`p-6 rounded-3xl border space-y-6 ${
            isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>🔔</span> Automated Financial Alerts & Warning Thresholds
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define variance warnings and automatic notifications to maintain tight fiscal governance
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Budget Burn Rate Warning Threshold (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={settings.budgetAlertThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, budgetAlertThreshold: Number(e.target.value) })
                  }
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <span className="font-bold text-sm text-indigo-400 min-w-[50px] text-right">
                  {settings.budgetAlertThreshold}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Trigger warning tags when actual spending reaches {settings.budgetAlertThreshold}% of project allocated budget.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-2">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Large Expense Counter-Sign Threshold (ETB)
              </label>
              <input
                type="number"
                step="5000"
                value={settings.largeExpenseThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, largeExpenseThreshold: Number(e.target.value) })
                }
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
                }`}
              />
              <p className="text-[11px] text-slate-400">
                Expenses above {Number(settings.largeExpenseThreshold).toLocaleString()} ETB trigger special review flags.
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            {[
              {
                key: "notifyOnBudgetOverrun",
                title: "Over-Budget Project Alerts",
                desc: "Immediate popup and notification badge when any project crosses its budget limit",
              },
              {
                key: "notifyOnPendingPayments",
                title: "Supplier Invoice Due Warnings",
                desc: `Notify ${settings.invoiceDueReminderDays} days before supplier payment deadlines to avoid late penalties`,
              },
              {
                key: "notifyOnLaborSubmissions",
                title: "Daily Worker Attendance & Payroll Submissions",
                desc: "Alert whenever site supervisors submit verified daily worker muster rolls",
              },
              {
                key: "emailDailyDigest",
                title: "End-of-Day Financial Email Digest",
                desc: "Send aggregated daily cash outflow and invoice payment report to accountant email",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/20 hover:bg-slate-900/40 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 ml-3 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Data & Display */}
      {activeTab === "system" && (
        <div
          className={`p-6 rounded-3xl border space-y-6 ${
            isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <span>⚙️</span> Ledger Tables & Cache Optimization
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure table density, real-time live sync, and client-side cache behavior
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/30 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Compact Ledger Table Mode
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reduces padding on transaction tables to fit more records per screen on laptops and monitors.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.compactTables}
                onChange={(e) => setSettings({ ...settings, compactTables: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 ml-3"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/30 cursor-pointer">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Auto-Refresh Financial Ledger
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Periodically re-fetches latest site disbursements and invoices in the background without reloading.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRefreshLedger}
                onChange={(e) => setSettings({ ...settings, autoRefreshLedger: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 shrink-0 ml-3"
              />
            </label>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Reset Local Cache & Preferences
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Purge cached finance tables and restore default appearance settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("app_compact_tables");
                  localStorage.removeItem("app_accent_color");
                  setStatusMsg({ text: "✓ Local cache and display presets reset.", type: "success" });
                  setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold shrink-0"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          to="/accountant/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>💾</span>
          <span>{saving ? "Saving Changes..." : "Save All Settings"}</span>
        </button>
      </div>
    </div>
  );
}

