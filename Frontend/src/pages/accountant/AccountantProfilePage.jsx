import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { authService } from "../../services/authService.js";

export default function AccountantProfilePage() {
  const { user, checkAuth } = useAuth();
  const { isDark } = useTheme();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState("details"); // "details" | "security" | "clearances"
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  // Profile Details Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await authService.updateProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone?.trim() || null,
      });

      if (res.success) {
        setStatusMsg({ text: "✓ Profile details updated successfully!", type: "success" });
        if (checkAuth) await checkAuth();
      } else {
        setStatusMsg({ text: res.error || "Failed to update profile", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to save profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMsg({ text: "New password and confirm password do not match", type: "error" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setStatusMsg({ text: "New password must be at least 6 characters", type: "error" });
      return;
    }

    setSaving(true);
    setStatusMsg({ text: "", type: "" });
    try {
      const res = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (res.success) {
        setStatusMsg({ text: "✓ Password updated successfully!", type: "success" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setStatusMsg({ text: res.error || "Failed to change password", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || "Failed to update password", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Accountant Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            My Profile & Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage your personal contact info, authentication credentials, and financial controller authorization.
          </p>
        </div>

        <Link
          to="/accountant/settings"
          className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
            isDark
              ? "border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
          }`}
        >
          <span>⚙️</span>
          <span>Theme & Settings →</span>
        </Link>
      </div>

      {statusMsg.text && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-2xs ${
            statusMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ text: "", type: "" })} className="underline font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Profile Overview Card */}
      <div
        className={`p-6 rounded-2xl border ${
          isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user?.fullName || "Accountant"}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user?.role || "ACCOUNTANT"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Financial Controller Clearance Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "details", label: "Account Details", icon: "👤" },
          { id: "security", label: "Password & Security", icon: "🔒" },
          { id: "clearances", label: "Fiscal Clearances", icon: "🛡️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Account Details */}
      {activeTab === "details" && (
        <form
          onSubmit={handleProfileSubmit}
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <h3 className="text-base font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
            Personal & Identity Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profileForm.email}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border opacity-70 cursor-not-allowed ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700 text-slate-300"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Account identity username managed by System Admin.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+251 911 000 000"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Financial Role & Scope</label>
              <input
                type="text"
                disabled
                value="Corporate Accounting & Cost Control"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border opacity-70 cursor-not-allowed ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700 text-slate-300"
                    : "bg-slate-100 border-slate-200 text-slate-600"
                }`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Password & Security */}
      {activeTab === "security" && (
        <form
          onSubmit={handlePasswordSubmit}
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <h3 className="text-base font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
            Change Account Password
          </h3>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Password *</label>
              <input
                type="password"
                required
                placeholder="Enter existing password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">New Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Fiscal Clearances */}
      {activeTab === "clearances" && (
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isDark ? "bg-[#0b1328] border-slate-800" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <h3 className="text-base font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
            Authorized Financial Clearances & Permissions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="font-bold text-emerald-400 block mb-1">✓ Expense Approval & Disbursement</span>
              <p className="text-slate-400 text-[11px]">Authorized to approve site operational vouchers and disburse payments.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="font-bold text-emerald-400 block mb-1">✓ Budget Revision & Allocation</span>
              <p className="text-slate-400 text-[11px]">Authorized to configure and revise project allocated capital limits.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="font-bold text-emerald-400 block mb-1">✓ Labor Payroll Calculation</span>
              <p className="text-slate-400 text-[11px]">Authorized to process site attendance sheets and execute worker wages.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="font-bold text-emerald-400 block mb-1">✓ Supplier Invoice Settlement</span>
              <p className="text-slate-400 text-[11px]">Authorized to record vendor payments and issue settlement receipts.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
