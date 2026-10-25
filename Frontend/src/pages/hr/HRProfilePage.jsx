import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { authService } from "../../services/authService.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function HRProfilePage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (res.success) {
        setSuccess("Password updated successfully");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(res.error || "Failed to update password");
      }
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">HR Manager Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your account credentials and personal information.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Account Info Card */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <h2 className="text-base font-bold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Full Name</span>
            <p className="font-semibold text-base mt-0.5">{user?.fullName || "HR Manager"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Email Address</span>
            <p className="font-semibold text-base mt-0.5">{user?.email || "N/A"}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Assigned System Role</span>
            <p className="mt-0.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                {user?.role || "HR_MANAGER"}
              </span>
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400">Account Status</span>
            <p className="mt-0.5">
              <span className="text-emerald-500 font-semibold text-xs">● Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className={`p-6 rounded-2xl border ${isDark ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200 shadow-xs"}`}>
        <h2 className="text-base font-bold mb-1">Security & Password</h2>
        <p className="text-xs text-slate-400 mb-4">Ensure your account is using a strong password</p>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">New Password</label>
            <input
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-emerald-500 ${
                isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
