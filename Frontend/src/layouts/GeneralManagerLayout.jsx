import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bell,
  FolderKanban,
  CheckSquare,
  Users,
  HardHat,
  Package,
  ShoppingCart,
  Coins,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function GeneralManagerLayout() {
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

  // Sidebar navigation list
  const navItems = [
    { label: t("overview") || "Dashboard", path: "/general-manager/dashboard", icon: LayoutDashboard },
    { label: t("notifications") || "Notifications", path: "/general-manager/notifications", icon: Bell },
    { label: t("projects") || "Projects", path: "/general-manager/projects", icon: FolderKanban },
    { label: t("tasks") || "Tasks & Progress", path: "/general-manager/tasks", icon: CheckSquare },
    { label: t("users") || "User Management", path: "/general-manager/users", icon: Users },
    { label: t("workforce") || "Workforce", path: "/general-manager/workforce", icon: HardHat },
    { label: t("inventory") || "Materials & Inventory", path: "/general-manager/inventory", icon: Package },
    { label: t("procurement") || "Procurement & Suppliers", path: "/general-manager/procurement", icon: ShoppingCart },
    { label: t("finance") || "Finance & Expenses", path: "/general-manager/finance", icon: Coins },
    { label: t("aiInsights") || "AI Insights", path: "/general-manager/ai-insights", icon: Sparkles },
    { label: t("reports") || "Reports & Analytics", path: "/general-manager/reports", icon: TrendingUp },
    { label: t("auditLogs") || "Audit Logs", path: "/general-manager/audit-logs", icon: ShieldCheck },
    { label: t("settings") || "Settings", path: "/general-manager/settings", icon: Settings },
    { label: t("profile") || "My Profile", path: "/general-manager/profile", icon: User },
  ];

  return (
    <div className={`h-screen overflow-hidden flex ${isDark ? "bg-[#0b1329] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Non-scrolling Compact Modern Fixed Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full min-h-0 shrink-0 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isDark
            ? "bg-[#08182e] border-slate-800/80 text-slate-200"
            : "bg-[#062444] border-slate-700/50 text-white shadow-xl"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Branding Header */}
        <div className="px-4 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                BuildManage
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30">
                  GM
                </span>
              </h1>
              <p className="text-[10px] text-blue-200/70 truncate leading-none mt-0.5">
                Construction System
              </p>
            </div>
          </div>
        </div>

        {/* Clean, Scrollable Sidebar Nav List with Increased Font Size and Comfortable Gaps */}
        <nav className="flex-1 min-h-0 px-3 py-3 overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== "/general-manager/dashboard" && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/30 font-bold"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-cyan-300 shadow-xs shadow-cyan-300 shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Pinned Bottom Logout without any padding bottom */}
        <div className="shrink-0 border-t border-white/10 p-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-all duration-150 text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">{t("logout") || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navigation Bar: Clean, Minimalist (Workspace Title, Language, Theme removed) */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-200 ${
            isDark
              ? "bg-[#0b172d]/90 border-slate-800 text-slate-100"
              : "bg-white/95 border-slate-200/80 text-slate-900 shadow-xs"
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center justify-between">
              {/* Left: Mobile hamburger only */}
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
              </div>

              {/* Right: GM Name & Profile Avatar with 3-item dropdown only */}
              <div className="flex items-center gap-3">
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
                          alt={user.fullName || "General Manager"}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/40"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-blue-500/40">
                          {user?.fullName?.charAt(0).toUpperCase() || "G"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {user?.fullName || "General Manager"}
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

                  {/* Dropdown Menu - EXACTLY 3 LIST ITEMS ONLY: Profile, Settings, Logout */}
                  {profileMenuOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                        isDark
                          ? "bg-[#0b172d] border-slate-800 text-slate-200"
                          : "bg-white border-slate-200 text-slate-800 shadow-xl"
                      }`}
                    >
                      <div className="px-1 space-y-0.5">
                        {/* 1. Profile */}
                        <NavLink
                          to="/general-manager/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            location.pathname === "/general-manager/profile"
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <User className="w-4 h-4 shrink-0" />
                          <span>{t("profile") || "My Profile"}</span>
                        </NavLink>

                        {/* 2. Settings */}
                        <NavLink
                          to="/general-manager/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            location.pathname === "/general-manager/settings"
                              ? "bg-blue-600 text-white"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          <Settings className="w-4 h-4 shrink-0" />
                          <span>{t("settings") || "Settings"}</span>
                        </NavLink>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                        {/* 3. Logout */}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>{t("logout") || "Logout"}</span>
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
