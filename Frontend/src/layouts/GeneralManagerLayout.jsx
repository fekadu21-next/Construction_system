import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function GeneralManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  // Unified navigation list without cluttering category headers
  const navItems = [
    { label: t("overview"), path: "/general-manager/dashboard", icon: "📊" },
    { label: t("projects"), path: "/general-manager/projects", icon: "🏗️" },
    { label: t("users"), path: "/general-manager/users", icon: "👥" },
    { label: t("tasks"), path: "/general-manager/tasks", icon: "✅" },
    { label: t("workforce"), path: "/general-manager/workforce", icon: "👷" },
    { label: t("inventory"), path: "/general-manager/inventory", icon: "📦" },
    { label: t("procurement"), path: "/general-manager/procurement", icon: "🛒" },
    { label: t("finance"), path: "/general-manager/finance", icon: "💰" },
    { label: t("aiInsights"), path: "/general-manager/ai-insights", icon: "🤖" },
    { label: t("reports"), path: "/general-manager/reports", icon: "📈" },
    { label: t("auditLogs"), path: "/general-manager/audit-logs", icon: "📋" },
    { label: t("notifications"), path: "/general-manager/notifications", icon: "🔔" },
    { label: t("settings"), path: "/general-manager/settings", icon: "⚙️" },
    { label: t("profile"), path: "/general-manager/profile", icon: "👤" },
  ];

  return (
    <div className={`min-h-screen flex ${isDark ? "bg-[#0b1329] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isDark
            ? "bg-[#08182e] border-slate-800/80 text-slate-200"
            : "bg-[#062444] border-slate-700/50 text-white shadow-xl"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Branding (Profile box removed as requested) */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                BuildManage
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  GM
                </span>
              </h1>
              <p className="text-[11px] text-blue-200/70 truncate">
                {t("systemSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Clean, Non-Grouped Sidebar List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/general-manager/dashboard" && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/30 translate-x-1"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm shadow-cyan-300" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Logout Area */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-500/15 hover:text-rose-100 transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-200 ${
            isDark
              ? "bg-[#0b172d]/90 border-slate-800 text-slate-100"
              : "bg-white/95 border-slate-200/80 text-slate-900 shadow-xs"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Mobile hamburger & Workspace Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Stylish Title with Glowing Gradient Text Effect */}
                <div className="flex items-center gap-2.5">
                  <span className="hidden sm:inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                    {t("workspaceTitle")}
                  </h2>
                </div>
              </div>

              {/* Right: Language Switcher, Dark/Light Mode, User Profile in right corner */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Language Switcher (English / Amharic) */}
                <div className="flex items-center rounded-xl p-1 border transition-colors bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      language === "en"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
                    }`}
                    title="Switch to English"
                  >
                    🇺🇸 EN
                  </button>
                  <button
                    onClick={() => setLanguage("am")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      language === "am"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-blue-600"
                    }`}
                    title="ወደ አማርኛ ቀይር"
                  >
                    🇪🇹 አማ
                  </button>
                </div>

                {/* Night / Light Mode Toggle Button */}
                <button
                  onClick={toggleTheme}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className="p-2.5 rounded-xl border transition-all duration-200 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-amber-300 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  title={isDark ? t("themeLight") : t("themeDark")}
                >
                  {isDark ? (
                    <span className="text-base leading-none">☀️</span>
                  ) : (
                    <span className="text-base leading-none">🌙</span>
                  )}
                </button>

                {/* Profile Avatar and Name in Right Corner */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-xl border transition-all duration-150 bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    aria-label="User profile menu"
                  >
                    <div className="relative">
                      {user?.profilePhotoUrl ? (
                        <img
                          src={user.profilePhotoUrl}
                          alt={user.fullName}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/40"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-blue-500/40">
                          G
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                        {user?.fullName?.split(" ")[0] || "General"}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 leading-none mt-0.5">
                        General Manager
                      </span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {profileMenuOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                        isDark
                          ? "bg-[#0b172d] border-slate-800 text-slate-200 divide-slate-800"
                          : "bg-white border-slate-200 text-slate-800 divide-slate-100"
                      } divide-y`}
                    >
                      {/* User Header */}
                      <div className="p-3.5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                          G
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.fullName || "General Manager"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.email || "admin@gmail.com"}
                          </p>
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                            General Manager
                          </span>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <NavLink
                          to="/general-manager/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <span className="text-base">👤</span>
                          <span>{t("profile")}</span>
                        </NavLink>
                        <NavLink
                          to="/general-manager/users"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <span className="text-base">👥</span>
                          <span>{t("users")}</span>
                        </NavLink>
                        <NavLink
                          to="/general-manager/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <span className="text-base">⚙️</span>
                          <span>{t("settings")}</span>
                        </NavLink>
                      </div>

                      {/* Sign Out */}
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <span className="text-base">🚪</span>
                          <span>{t("logout")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
