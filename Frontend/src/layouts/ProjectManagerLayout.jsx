import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function ProjectManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
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

  // Project Manager Sidebar navigation items as required
  const navItems = [
    { label: "Overview", path: "/project-manager/dashboard", icon: "📊" },
    { label: "Notifications", path: "/project-manager/notifications", icon: "🔔" },
    { label: "My Projects", path: "/project-manager/projects", icon: "🏗️" },
    { label: "Project Schedule", path: "/project-manager/schedule", icon: "📅" },
    { label: "Milestones & Tasks", path: "/project-manager/milestones-tasks", icon: "🎯" },
    { label: "Progress Reports", path: "/project-manager/progress-reports", icon: "📑" },
    { label: "Material Requests", path: "/project-manager/material-requests", icon: "📦" },
    { label: "Budget & Expenses", path: "/project-manager/budget-expenses", icon: "💰" },
    { label: "Reports & Analytics", path: "/project-manager/reports", icon: "📈" },
  ];

  return (
    <div
      className={`h-screen overflow-hidden flex ${
        isDark ? "bg-[#0b1329] text-slate-100" : "bg-slate-50 text-slate-900"
      } transition-colors duration-200`}
    >
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Non-scrolling Compact Modern Fixed Sidebar (Identical to GM visual identity) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full min-h-0 shrink-0 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isDark
            ? "bg-[#08182e] border-slate-800/80 text-slate-200"
            : "bg-[#062444] border-slate-700/50 text-white shadow-xl"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Branding Header with PM badge */}
        <div className="px-4 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                BuildManage
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  PM
                </span>
              </h1>
              <p className="text-[10px] text-blue-200/70 truncate leading-none mt-0.5">
                Construction System
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Sidebar Nav List */}
        <nav className="flex-1 min-h-0 px-3 py-2.5 overflow-y-auto space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/project-manager/dashboard" && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/30 font-bold"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-cyan-300 shadow-xs shadow-cyan-300 shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Pinned Bottom Logout */}
        <div className="shrink-0 border-t border-white/10 p-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-all duration-150 text-left"
          >
            <span className="text-base shrink-0">🚪</span>
            <span className="truncate">{t("logout") || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-200 ${
            isDark
              ? "bg-[#0b172d]/90 border-slate-800 text-slate-100"
              : "bg-white/95 border-slate-200/80 text-slate-900 shadow-xs"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center justify-between">
              {/* Left: Mobile hamburger */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Project Operations Active</span>
                </div>
              </div>

              {/* Right: PM Notifications & User Profile */}
              <div className="flex items-center gap-3">
                {/* Notifications Quick Link */}
                <NavLink
                  to="/project-manager/notifications"
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                  title="Notifications"
                >
                  <span className="text-lg">🔔</span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                </NavLink>

                {/* PM Profile Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border transition-all duration-150 bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    aria-label="User profile menu"
                  >
                    <div className="relative shrink-0">
                      {user?.profilePhotoUrl ? (
                        <img
                          src={user.profilePhotoUrl}
                          alt={user.fullName || "Project Manager"}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/40"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-blue-500/40">
                          {user?.fullName?.charAt(0).toUpperCase() || "P"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {user?.fullName || "Dawit T. (Project Manager)"}
                      </span>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-cyan-400 leading-none mt-0.5">
                        Project Manager
                      </span>
                    </div>

                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        profileMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu: Profile, Settings, Logout */}
                  {profileMenuOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                        isDark
                          ? "bg-[#0b172d] border-slate-800 text-slate-200"
                          : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                    >
                      <div className="px-1 space-y-0.5">
                        <NavLink
                          to="/project-manager/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            location.pathname === "/project-manager/profile"
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <span className="text-sm">👤</span>
                          <span>My Profile</span>
                        </NavLink>

                        <NavLink
                          to="/project-manager/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            location.pathname === "/project-manager/settings"
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <span className="text-sm">⚙️</span>
                          <span>Settings</span>
                        </NavLink>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                        >
                          <span className="text-sm">🚪</span>
                          <span>Logout</span>
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
