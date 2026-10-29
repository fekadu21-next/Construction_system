import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Bell,
  Package,
  Truck,
  Building2,
  ClipboardList,
  ShoppingCart,
  PackageCheck,
  PackageMinus,
  TrendingUp,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function ProcurementLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, logout, loading } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Navigation items for Procurement & Storekeeper
  const navItems = [
    {
      label: t("overview") || "Overview",
      path: "/procurement/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Notifications",
      path: "/procurement/notifications",
      icon: Bell,
    },
    {
      label: t("inventory") || "Inventory & Materials",
      path: "/procurement/inventory",
      icon: Package,
    },
    {
      label: t("equipment") || "Equipment & Machinery",
      path: "/procurement/equipment",
      icon: Truck,
    },
    {
      label: t("suppliers") || "Suppliers",
      path: "/procurement/suppliers",
      icon: Building2,
    },
    {
      label: t("materialRequests") || "Material Requests",
      path: "/procurement/material-requests",
      icon: ClipboardList,
    },
    {
      label: t("purchaseOrders") || "Purchase Orders",
      path: "/procurement/procurement",
      icon: ShoppingCart,
    },
    {
      label: t("goodsReceiving") || "Deliveries & Receiving",
      path: "/procurement/goods-receiving",
      icon: PackageCheck,
    },
    {
      label: t("materialIssuance") || "Material Issuance & Usage",
      path: "/procurement/material-issuance",
      icon: PackageMinus,
    },
    {
      label: t("reports") || "Reports",
      path: "/procurement/reports",
      icon: TrendingUp,
    },
    {
      label: t("settings") || "Settings",
      path: "/procurement/settings",
      icon: Settings,
    },
    {
      label: t("profile") || "My Profile",
      path: "/procurement/profile",
      icon: User,
    },
  ];

  return (
    <div className={`h-screen overflow-hidden flex ${isDark ? "bg-[#0b1329] text-slate-100" : "bg-slate-50 text-slate-900"} transition-colors duration-200`}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Compact Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-full min-h-0 shrink-0 flex flex-col border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isDark
          ? "bg-[#08182e] border-slate-800/80 text-slate-200"
          : "bg-[#062444] border-slate-700/50 text-white shadow-xl"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Header Branding */}
        <div className="px-4 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                BuildManage
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-cyan-300 border border-emerald-400/30">
                  PO & Store
                </span>
              </h1>
              <p className="text-[10px] text-emerald-200/70 truncate leading-none mt-0.5">
                Procurement & Storekeeper
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="flex-1 min-h-0 px-3 py-3 overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/procurement/dashboard" && location.pathname.startsWith(item.path + "/"));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 group ${isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-600/30 font-bold"
                  : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
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

        {/* Sidebar Footer Logout */}
        <div className="shrink-0 border-t border-white/10 p-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition-all duration-150 text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">{t("logout") || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Sticky Header */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-200 ${isDark
            ? "bg-[#0b172d]/90 border-slate-800 text-slate-100"
            : "bg-white/95 border-slate-200/80 text-slate-900 shadow-xs"
            }`}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="flex items-center justify-between">
              {/* Left Mobile Menu Toggle & Title */}
              <div className="flex items-center gap-3">
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
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Procurement & Storekeeper Operations</span>
                </div>
              </div>

              {/* Right Quick Shortcuts & Profile Menu */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications Shortcut */}
                <Link
                  to="/procurement/notifications"
                  title="Notifications & Alerts"
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-xs" />
                </Link>

                {/* Settings Shortcut */}
                <Link
                  to="/procurement/settings"
                  title="Settings & Preferences"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border transition-all duration-150 bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    aria-label="User profile menu"
                  >
                    <div className="relative shrink-0">
                      {user?.profilePhotoUrl ? (
                        <img
                          src={user.profilePhotoUrl}
                          alt={user.fullName || "Procurement Officer"}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-emerald-500/40"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white font-black flex items-center justify-center text-sm shadow-sm ring-2 ring-emerald-500/40">
                          {user?.fullName?.charAt(0).toUpperCase() || "P"}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {user?.fullName || "Procurement Officer"}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-cyan-400 leading-none mt-0.5">
                        Procurement & Store
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

                  {profileMenuOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${isDark
                        ? "bg-[#0b172d] border-slate-800 text-slate-200"
                        : "bg-white border-slate-200 text-slate-800 shadow-xl"
                        }`}
                    >
                      <div className="px-1 space-y-0.5">
                        <NavLink
                          to="/procurement/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${location.pathname === "/procurement/profile"
                            ? "bg-emerald-600 text-white"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            }`}
                        >
                          <User className="w-4 h-4 shrink-0" />
                          <span>{t("profile") || "My Profile"}</span>
                        </NavLink>

                        <NavLink
                          to="/procurement/settings"
                          onClick={() => setProfileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${location.pathname === "/procurement/settings"
                            ? "bg-emerald-600 text-white"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            }`}
                        >
                          <Settings className="w-4 h-4 shrink-0" />
                          <span>{t("settings") || "Settings & Preferences"}</span>
                        </NavLink>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

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

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
