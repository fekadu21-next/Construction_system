import { useState } from "react";
import { Sun, Moon, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [success, setSuccess] = useState("");

  const handleSave = () => {
    setSuccess("Settings updated successfully!");
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Project Manager Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your dashboard preferences, theme modes, and notification triggers.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div
        className={`p-6 sm:p-8 rounded-2xl border ${
          isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
        } space-y-6`}
      >
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Theme & Visuals</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isDark) toggleTheme();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                !isDark ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light Theme</span>
            </button>
            <button
              onClick={() => {
                if (!isDark) toggleTheme();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                isDark ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark Theme</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Language Selection</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="en">English (US)</option>
            <option value="am">አማርኛ (Amharic)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
