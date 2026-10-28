import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function AccountantProfilePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accountant Profile & Financial Credentials</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Authorized Financial Controller identity, cost-center clearances, and dual-control authorization permissions.
        </p>
      </div>

      <div className={`p-6 rounded-2xl border ${
        isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"
      }`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center">
            {user?.fullName?.charAt(0) || "A"}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.fullName || "Accountant"}</h2>
            <p className="text-xs text-indigo-500 font-semibold">{user?.role || "ACCOUNTANT"} Role</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Financial Division</span>
            <span className="text-sm font-semibold">Corporate Finance, Cost Auditing & Accounts Payable</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</span>
            <span className="text-sm font-semibold">{user?.phone || "+251 922 000 000"}</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Audit Clearance</span>
            <span className="text-sm font-semibold text-emerald-500">Budget Revisions, Labor Postings, Invoice Settlements</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Segregation of Duties</span>
            <span className="text-sm font-semibold text-indigo-500">Self-approval strictly forbidden on self-created expenses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
