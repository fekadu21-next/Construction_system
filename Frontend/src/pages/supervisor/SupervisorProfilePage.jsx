import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function SupervisorProfilePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Supervisor Profile & Site Credentials</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Authorized Field Operations Supervisor identity, contact details, and role permissions.
        </p>
      </div>

      <div className={`p-6 rounded-2xl border ${
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-2xl flex items-center justify-center">
            {user?.fullName?.charAt(0) || "S"}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.fullName || "Site Supervisor"}</h2>
            <p className="text-xs text-amber-500 font-semibold">{user?.role || "SUPERVISOR"} Role</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Department</span>
            <span className="text-sm font-semibold">Construction Site Operations & Field Workforce</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</span>
            <span className="text-sm font-semibold">{user?.phone || "+251 911 000 000"}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Operational Authority</span>
            <span className="text-sm font-semibold text-emerald-500">Daily Attendance, Task Tracking, Material Requests</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Financial Restrictions</span>
            <span className="text-sm font-semibold text-slate-400">Least-privilege: Read-only site budgets, no payment release</span>
          </div>
        </div>
      </div>
    </div>
  );
}
