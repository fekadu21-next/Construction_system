import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useNotifications } from "../contexts/NotificationContext.jsx";

export default function SupervisorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const { user, logout } = useAuth();
  const { t } = useLanguage();
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
    { label: "Overview", path: "/supervisor/dashboard", icon: "📊" },
    { label: "Worker Management", path: "/supervisor/workers", icon: "👥" },
    { label: "Attendance", path: "/supervisor/attendance", icon: "⏱️" },
    { label: "Settings", path: "/supervisor/settings", icon: "⚙️" },
    { label: "Profile", path: "/supervisor/profile", icon: "👤" },
  ];

  return (
    <div className={`h-screen overflow-hidden flex ${isDark ? "bg-[#0a0f1d] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
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
            ? "bg-[#0d1527] border-slate-800 text-slate-200"
            : "bg-white border-slate-200 text-slate-700 shadow-sm"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header */}
        <div className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🦺
            </div>
            <div>
              <div className="text-base font-bold tracking-tight flex items-center gap-1.5">
                BuildManage
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Supervisor
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Field Operations Hub</span>
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
            Site Management
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
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-950/40"
                      : "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/20"
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
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0">
                {user?.fullName?.charAt(0) || "S"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{user?.fullName || "Site Supervisor"}</p>
                <p className="text-[11px] text-amber-500 font-medium truncate">Authorized Supervisor</p>
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
          isDark ? "bg-[#0d1527]/95 border-slate-800 shadow-sm" : "bg-white/95 border-slate-200 shadow-xs"
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ☰
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Site Supervisor Module</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Daily Operations</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border text-sm transition-colors ${
                isDark
                  ? "border-slate-700 bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-xs"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Notifications Menu */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className={`relative p-2 rounded-xl border text-sm transition-colors ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-xs"
                }`}
                title="Notifications"
                aria-label="Site Notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl p-3 z-50 ${
                    isDark ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Site Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs font-semibold text-amber-500 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 py-1">
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id);
                            if (n.link) {
                              setNotifMenuOpen(false);
                              navigate(n.link);
                            }
                          }}
                          className={`p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer rounded-xl transition-colors flex items-start gap-2.5 ${
                            !n.isRead ? (isDark ? "bg-slate-800/30" : "bg-amber-50/40") : ""
                          }`}
                        >
                          <span className="text-base mt-0.5">
                            {n.category === "INCIDENT"
                              ? "⚠️"
                              : n.category === "ATTENDANCE"
                              ? "⏱️"
                              : n.category === "MATERIAL"
                              ? "🧱"
                              : "🔔"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${!n.isRead ? "text-amber-500" : "text-slate-800 dark:text-slate-200"}`}>
                              {n.title}
                            </p>
                            <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                            {n.createdAt && (
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center gap-2.5 py-1.5 px-3 rounded-xl border transition-all duration-150 ${
                  isDark
                    ? "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-100"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 shadow-xs"
                } focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
                aria-label="User profile menu"
              >
                <div className="relative">
                  {user?.profilePhotoUrl ? (
                    <img
                      src={user.profilePhotoUrl}
                      alt={user.fullName || "Supervisor"}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-amber-500/30">
                      {user?.fullName?.charAt(0).toUpperCase() || "S"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
                    {user?.fullName || "Site Supervisor"}
                  </span>
                  <span className="text-[10px] text-amber-500 font-semibold leading-none mt-0.5">
                    Supervisor
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

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl py-2 z-50 ${
                    isDark
                      ? "bg-slate-900 border-slate-800 text-slate-200 divide-slate-800"
                      : "bg-white border-slate-100 text-slate-800 divide-slate-100"
                  } divide-y animate-in fade-in slide-in-from-top-2 duration-150`}
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-xs">
                        {user?.fullName?.charAt(0).toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">
                          {user?.fullName || "Site Supervisor"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user?.email || "supervisor@construction.com"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                        {user?.role || "SUPERVISOR"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Navigation / Actions */}
                  <div className="py-1">
                    <NavLink
                      to="/supervisor/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="text-base">👤</span>
                      <span>My Profile</span>
                    </NavLink>
                    <NavLink
                      to="/supervisor/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="text-base">⚙️</span>
                      <span>Site Settings</span>
                    </NavLink>
                  </div>

                  {/* Sign Out */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <span className="text-base">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 min-h-0 p-4 sm:p-6 lg:px-8 lg:py-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
