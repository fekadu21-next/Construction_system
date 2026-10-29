import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { authService } from "../../services/authService.js";
import { getRoleLabel } from "../../constants/roles.js";

export default function ProfilePage() {
  const { user, updateUserData } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhotoUrl || null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setPhotoPreview(user.profilePhotoUrl || null);
    }
  }, [user]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Photo size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Photo = reader.result;
      setPhotoPreview(base64Photo);
      setProfileSaving(true);
      setProfileError("");
      setProfileSuccess("");

      try {
        const res = await authService.updateProfile({ profilePhotoUrl: base64Photo });
        if (res.success) {
          updateUserData({
            profilePhotoUrl: res.data?.profilePhotoUrl || base64Photo,
            fullName: res.data?.fullName,
            phone: res.data?.phone,
          });
          setProfileSuccess("Profile photo updated successfully!");
          setTimeout(() => setProfileSuccess(""), 4000);
        } else {
          setProfileError(res.error || "Failed to update profile photo");
        }
      } catch (err) {
        setProfileError("Error saving photo");
      } finally {
        setProfileSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await authService.updateProfile({ profilePhotoUrl: null });
      if (res.success) {
        setPhotoPreview(res.data?.profilePhotoUrl || null);
        updateUserData({
          profilePhotoUrl: res.data?.profilePhotoUrl || null,
          fullName: res.data?.fullName,
          phone: res.data?.phone,
        });
        setProfileSuccess("Profile photo removed.");
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        setProfileError(res.error || "Failed to remove photo");
      }
    } catch {
      setProfileError("Error removing photo");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    if (!fullName.trim()) {
      setProfileError("Full name is required");
      setProfileSaving(false);
      return;
    }

    try {
      const res = await authService.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });

      if (res.success) {
        updateUserData({
          fullName: res.data?.fullName || fullName.trim(),
          phone: res.data?.phone || phone.trim(),
          profilePhotoUrl: res.data?.profilePhotoUrl,
        });
        setProfileSuccess("Personal information updated successfully!");
        setTimeout(() => setProfileSuccess(""), 4000);
      } else {
        setProfileError(res.error || "Failed to update profile");
      }
    } catch (err) {
      setProfileError("Error saving profile changes");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(""), 4000);
      } else {
        setPasswordError(res.error || "Failed to change password");
      }
    } catch (err) {
      setPasswordError("Error updating password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">

      <div
        className={`p-6 sm:p-8 rounded-2xl border transition-all duration-200 shadow-sm ${
          isDark
            ? "bg-[#0c1830] border-slate-800 text-slate-100"
            : "bg-white border-slate-200/80 text-slate-900"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white font-black flex items-center justify-center text-3xl shadow-lg ring-4 ring-emerald-500/20 overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={user?.fullName || "Procurement Officer"}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.fullName?.charAt(0).toUpperCase() || "P"
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0c1830]" />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                {user?.fullName || "Procurement Officer"}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-cyan-300 border border-emerald-200 dark:border-emerald-800 self-center sm:self-auto">
                {getRoleLabel(user?.role) || "Procurement Officer"}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
              {user?.email || "procurement@example.com"}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Account
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                {user?.emailVerifiedAt ? "Email Verified" : "Verified"}
              </span>
              {user?.phone && (
                <>
                  <span>•</span>
                  <span>📞 {user.phone}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <input
              type="file"
              id="profile-photo-input"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById("profile-photo-input").click()}
              disabled={profileSaving}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
            >
              {profileSaving ? "Uploading..." : "Change Photo"}
            </button>
            {photoPreview && (
              <button
                onClick={handleRemovePhoto}
                disabled={profileSaving}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Remove photo"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 shadow-sm ${
              isDark
                ? "bg-[#0c1830] border-slate-800 text-slate-100"
                : "bg-white border-slate-200/80 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <span className="text-xl">👤</span>
              <div>
                <h3 className="text-lg font-black tracking-tight">Personal Information</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your contact details and display name.
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <span>✓</span> {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
                <span>✕</span> {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "procurement@example.com"}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Primary login address is managed by system administrator security policies.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+251 911 000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  System Role
                </label>
                <input
                  type="text"
                  disabled
                  value={getRoleLabel(user?.role) || "Procurement Officer"}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {profileSaving ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div
            className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 shadow-sm ${
              isDark
                ? "bg-[#0c1830] border-slate-800 text-slate-100"
                : "bg-white border-slate-200/80 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <span className="text-xl">🔐</span>
              <div>
                <h3 className="text-lg font-black tracking-tight">Security & Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your authentication credentials.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                <span>✓</span> {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
                <span>✕</span> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Current Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="toggle-show-pass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="toggle-show-pass" className="text-xs text-slate-600 dark:text-slate-400 select-none">
                  Show passwords
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving || !currentPassword || !newPassword}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {passwordSaving ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
