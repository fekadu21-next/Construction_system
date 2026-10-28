import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { Link } from "react-router-dom";
import { ArrowLeft, User, ShieldCheck, CheckCircle2, ShieldAlert } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Site Engineer Profile
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              Field Technical Officer
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Account credentials, assigned technical responsibilities, and system authority boundaries.
          </p>
        </div>

        <Link
          to="/site-engineer/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/25">
            {user?.fullName?.charAt(0) || "Y"}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{user?.fullName || "Site Engineer"}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-300/40">
                SITE ENGINEER
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE ACCOUNT
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Full Name</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{user?.fullName}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Email Address</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Role</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">Site Operations Engineer</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Phone / Mobile</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{user?.phone || "+251 911 345678"}</span>
          </div>
        </div>
      </div>

      {/* Role Authority & Permissions Guide */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0d1c33] border-slate-800" : "bg-white border-slate-200/80 shadow-xs"}`}>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <span>Role Permissions & System Boundaries</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          According to the system architecture and organizational governance, your account is configured with the following rights:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Permitted */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-900">
            <p className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Authorized Responsibilities</span>
            </p>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>• View assigned projects, schedules, and milestones</li>
              <li>• Execute and update assigned task progress (0–100%)</li>
              <li>• Log daily site construction activities & field observations</li>
              <li>• Record daily attendance for eligible project workers</li>
              <li>• Submit weekly progress reports to Project Managers</li>
              <li>• File material requisitions for site needs</li>
            </ul>
          </div>

          {/* Restricted */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900">
            <p className="font-extrabold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>System Restrictions & Safeguards</span>
            </p>
            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>• Cannot create or archive organization projects (GM only)</li>
              <li>• Cannot approve own material requests or reports (PM only)</li>
              <li>• Cannot directly adjust inventory stock levels (Procurement only)</li>
              <li>• Cannot register workers or change pay rates (HR only)</li>
              <li>• Cannot view financial ledgers or accounts (Accountant only)</li>
              <li>• Cannot access unassigned projects or other engineers' records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
