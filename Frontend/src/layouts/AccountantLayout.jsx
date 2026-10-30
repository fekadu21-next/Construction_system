import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function AccountantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, connected } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifMenuOpen(false);
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

  const navItems = [
    { label: "Overview", path: "/accountant/dashboard", icon: "📊" },
    { label: "Project Budgets", path: "/accountant/budgets", icon: "💼" },
    { label: "Expenses & Transactions", path: "/accountant/expenses", icon: "💳" },
    { label: "Payroll & Labor Costs", path: "/accountant/labor-costs", icon: "👷‍♂️" },
    { label: "Supplier Payments", path: "/accountant/invoices", icon: "🧾" },
    { label: "Material Costs", path: "/accountant/material-costs", icon: "🧱" },
    { label: "Financial Reports", path: "/accountant/reports", icon: "📑" },
    { label: "Profile", path: "/accountant/profile", icon: "👤" },
    { label: "Settings", path: "/accountant/settings", icon: "⚙️" },
  ];

  return (
    <div className={`h-screen overflow-hidden flex ${isDark ? "bg-[#080e1e] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Static / Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 h-full min-h-0 shrink-0 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isDark
            ? "bg-[#0b1328] border-slate-800 text-slate-200"
            : "bg-white border-slate-200 text-slate-700 shadow-sm"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              💰
            </div>
            <div>
              <div className="text-base font-bold tracking-tight flex items-center gap-1.5">
                BuildManage
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Accountant
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Finance & Cost Control</span>
                {connected && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-2">
            Project Accounting
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? isDark
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-950/40"
                      : "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div className={`p-4 border-t shrink-0 ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{user?.fullName || "Accountant"}</p>
                <p className="text-[11px] text-indigo-400 font-medium truncate">Authorized Finance Officer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar (Sticky Static Header) */}
        <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 border-b shrink-0 transition-colors backdrop-blur-md ${
          isDark ? "bg-[#0b1328]/95 border-slate-800 shadow-sm" : "bg-white/95 border-slate-200 shadow-xs"
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ☰
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Accountant Module</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Fiscal & Cost Control</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Settings Quick Icon */}
            <NavLink
              to="/accountant/settings"
              className={({ isActive }) =>
                `p-2 rounded-xl border text-sm sm:text-base transition-colors cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/30"
                    : isDark
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`
              }
              title="Settings & System Preferences"
            >
              ⚙️
            </NavLink>

            {/* Notifications Menu */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className={`relative p-2 rounded-xl border text-sm transition-colors cursor-pointer ${
                  isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-xl p-3 z-50 ${
                  isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Finance Alerts</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-400 hover:underline cursor-pointer">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-1">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} className="p-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer rounded-lg">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">No new finance notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Header Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center gap-2 p-1.5 pl-2 rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? "border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs"
                }`}
                title="Accountant Profile Menu"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {user?.fullName?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold">{user?.fullName?.split(" ")[0] || "Accountant"}</span>
                  <span className="text-[10px] text-indigo-400 font-medium">Finance</span>
                </div>
                <span className="text-xs text-slate-400">▾</span>
              </button>

              {profileMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-in fade-in duration-150 ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-200 shadow-slate-950/80"
                      : "bg-white border-slate-100 text-slate-700 shadow-slate-200/80"
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.fullName || "Accountant"}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email || "accountant@company.com"}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Authorized Finance Officer
                    </span>
                  </div>

                  <div className="p-1">
                    <NavLink
                      to="/accountant/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : isDark
                            ? "hover:bg-slate-800 text-slate-300 hover:text-white"
                            : "hover:bg-slate-100 text-slate-700"
                        }`
                      }
                    >
                      <span className="text-sm">👤</span>
                      <span>My Profile</span>
                    </NavLink>

                    <NavLink
                      to="/accountant/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : isDark
                            ? "hover:bg-slate-800 text-slate-300 hover:text-white"
                            : "hover:bg-slate-100 text-slate-700"
                        }`
                      }
                    >
                      <span className="text-sm">⚙️</span>
                      <span>Settings</span>
                    </NavLink>

                    <NavLink
                      to="/accountant/dashboard"
                      onClick={() => setProfileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                        isDark ? "hover:bg-slate-800 text-slate-300 hover:text-white" : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="text-sm">📊</span>
                      <span>Fiscal Overview</span>
                    </NavLink>
                  </div>

                  <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <span className="text-sm">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
