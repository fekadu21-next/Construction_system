import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function HRManagerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, connected } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
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
    { label: "Overview", path: "/hr/dashboard", icon: "📊" },
    { label: "Workforce Roster", path: "/hr/employees", icon: "👷" },
    { label: "Daily Attendance", path: "/hr/attendance", icon: "⏱️" },
    { label: "Leave Requests", path: "/hr/leaves", icon: "🏖️" },
    { label: "Labor & Payroll", path: "/hr/payroll", icon: "💵" },
    { label: "Notifications", path: "/hr/notifications", icon: "🔔", badge: unreadCount },
    { label: "Settings", path: "/hr/settings", icon: "⚙️" },
    { label: "My Profile", path: "/hr/profile", icon: "👤" },
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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-all duration-300 transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDark
            ? "bg-[#0f172a] border-r border-slate-800 text-slate-200"
            : "bg-white border-r border-slate-200 text-slate-700 shadow-sm"
        }`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between px-6 border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🏗️
            </div>
            <div>
              <div className="text-base font-bold tracking-tight flex items-center gap-1.5">
                BuildManage
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                  HR Suite
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Workforce & HR</span>
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
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-2">
            Workforce Management
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? isDark
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                      : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Card Footer */}
        <div className={`p-4 border-t ${isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.fullName?.charAt(0).toUpperCase() || "H"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName || "HR Manager"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || "hr@company.com"}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header
          className={`sticky top-0 z-30 h-16 px-4 lg:px-8 flex items-center justify-between border-b transition-colors duration-200 ${
            isDark
              ? "bg-[#0b1329]/80 border-slate-800 backdrop-blur-md"
              : "bg-white/80 border-slate-200 backdrop-blur-md shadow-xs"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ☰
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Human Resources Portal</span>
              {connected && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Real-time Active
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Notifications Bell Dropdown */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                title="Real-time Notifications"
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-base">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white min-w-4 text-center leading-none animate-pulse shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl py-2 z-50 ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-200"
                      : "bg-white border-slate-100 text-slate-800"
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-emerald-500 hover:text-emerald-600 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id);
                            if (n.link) {
                              setNotifMenuOpen(false);
                              navigate(n.link);
                            }
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 ${
                            !n.isRead ? (isDark ? "bg-slate-800/40" : "bg-emerald-50/40") : ""
                          }`}
                        >
                          <span className="text-base mt-0.5">
                            {n.category === "LEAVE"
                              ? "🏖️"
                              : n.category === "ATTENDANCE"
                              ? "⏱️"
                              : n.category === "WORKFORCE"
                              ? "👷"
                              : "🔔"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${!n.isRead ? "text-emerald-500 dark:text-emerald-400" : ""}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <NavLink
                      to="/hr/notifications"
                      onClick={() => setNotifMenuOpen(false)}
                      className="text-xs text-emerald-500 hover:text-emerald-600 font-semibold block py-1"
                    >
                      View all notifications →
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0).toUpperCase() || "H"}
                </div>
                <span className="text-xs font-medium hidden md:inline">{user?.fullName?.split(" ")[0]}</span>
                <span className="text-xs text-slate-400">▾</span>
              </button>

              {profileMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg py-1.5 z-50 ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-200"
                      : "bg-white border-slate-100 text-slate-700"
                  }`}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold">{user?.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/hr/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    👤 My Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
