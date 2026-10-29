import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // Password strength checks
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token.trim(), newPassword);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Password reset failed. Please request a new link.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/40 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-sky-200/40 blur-[100px]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_25px_80px_rgba(15,43,79,0.13)] lg:min-h-[650px] lg:grid-cols-2">
          {/* ==================================================
              LEFT PANEL — BRANDING & ARCHITECTURE
          =================================================== */}
          <section className="relative hidden overflow-hidden bg-[#071d36] lg:flex lg:flex-col lg:justify-between">
            <img
              src="/con_hero.jpg"
              alt="Construction site and building development"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            {/* Overlays */}
            <div className="absolute inset-0 bg-[#061a32]/65" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#061a32]/95 via-[#082c50]/65 to-[#061a32]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#031326]/95 via-transparent to-transparent" />

            {/* Decorative ambient light */}
            <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />

            <div className="relative z-10 flex h-full flex-col p-8 xl:p-12">
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-4">
                <div className="flex h-[60px] w-[66px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md">
                  <BuildManageLogo className="h-12 w-14" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white xl:text-[28px]">
                    BuildManage
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-blue-100/80 xl:text-[13px]">
                    Construction Project &amp; Resource Management System
                  </p>
                </div>
              </div>

              {/* Main Left Content */}
              <div className="my-auto py-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-3.5 py-2 backdrop-blur-md">
                  <ShieldCheckIcon className="h-4 w-4 text-sky-300" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
                    Account Security
                  </span>
                </div>

                <h1 className="max-w-lg text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[53px]">
                  Set a new, secure
                  <span className="mt-2 block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    password for your account.
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-sm leading-7 text-slate-200 xl:text-[15px]">
                  Choose a strong password to protect your projects, workforce, procurement records, and project assets.
                </p>

                {/* Security features */}
                <div className="mt-8 max-w-md space-y-4">
                  <SecurityFeature
                    icon={<LockIcon />}
                    title="Encrypted & Protected"
                    description="Your credentials are cryptographically hashed and never stored in plain text."
                  />
                  <SecurityFeature
                    icon={<ShieldCheckIcon />}
                    title="Session Invalidation"
                    description="Resetting your password securely revokes old sessions across all devices."
                  />
                  <SecurityFeature
                    icon={<PeopleIcon />}
                    title="Role-Based Workspace"
                    description="Once updated, you can immediately sign in to your dashboard."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-blue-100/75">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
                <span>Secure</span>
                <span className="text-blue-300/60">•</span>
                <span>Encrypted</span>
                <span className="text-blue-300/60">•</span>
                <span>Built for construction teams</span>
              </div>
            </div>
          </section>

          {/* ==================================================
              RIGHT PANEL — RESET PASSWORD FORM
          =================================================== */}
          <section className="relative flex items-center justify-center bg-gradient-to-br from-white via-white to-[#f2f7ff] px-5 py-9 sm:px-10 lg:px-9 xl:px-14">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#9ab4d3_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

            <div className="relative w-full max-w-[420px]">
              {/* Mobile brand header */}
              <div className="mb-8 flex flex-col items-center text-center lg:hidden">
                <div className="mb-3 flex h-[70px] w-[76px] items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-sm">
                  <BuildManageLogo className="h-14 w-16" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0b2b50]">
                  BuildManage
                </h2>
                <p className="mt-1 text-xs text-[#70839d]">
                  Construction Project &amp; Resource Management System
                </p>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <div className="mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100 text-[#0875e1] shadow-sm">
                  <LockIcon className="h-7 w-7" />
                </div>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1475d4]">
                  Account Security
                </p>

                <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[#102b4e] sm:text-[32px]">
                  Reset Password
                </h1>

                <p className="mt-2 text-sm leading-6 text-[#657b97]">
                  Enter your new password below to regain full access to your account.
                </p>
              </div>

              {/* Check if token is missing */}
              {!token.trim() && !success ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900">
                    <div className="mb-2 flex items-center gap-2.5 font-bold">
                      <ErrorIcon className="h-5 w-5 text-amber-600" />
                      <span>Missing Reset Token</span>
                    </div>
                    <p className="text-sm leading-6 text-amber-800">
                      This password reset link is invalid or incomplete. Please request a new password reset link from the recovery page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0759bd] to-[#087ef0] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,100,220,0.20)] transition hover:-translate-y-0.5 hover:from-[#064a9e] hover:to-[#0667ca] focus:outline-none"
                  >
                    Request New Reset Link
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-xs font-semibold text-[#0875e1] hover:underline"
                    >
                      Return to Login
                    </button>
                  </div>
                </div>
              ) : success ? (
                /* Success state */
                <div className="space-y-6">
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <SuccessIcon className="h-7 w-7" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-emerald-950">
                          Password Reset Complete
                        </h3>
                        <p className="text-xs text-emerald-700">
                          Your account credentials have been updated
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-emerald-900/90">
                      You can now log in securely with your new password. All old active sessions have been safely terminated.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="group flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0759bd] to-[#087ef0] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,100,220,0.20)] transition duration-200 hover:-translate-y-0.5 hover:from-[#064a9e] hover:to-[#0667ca] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
                  >
                    <span>Sign In Now</span>
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ) : (
                /* Form state */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-5 text-red-700"
                    >
                      <ErrorIcon className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="font-semibold">{error}</p>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="mb-2 block text-[13px] font-bold text-[#294361]"
                    >
                      New Password
                    </label>

                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-[#8195ae] transition-colors group-focus-within:text-[#0878e8]">
                        <LockIcon className="h-5 w-5" />
                      </span>

                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        disabled={loading}
                        className="h-[52px] w-full rounded-xl border border-[#d6e2f0] bg-white pl-12 pr-12 text-sm font-medium text-[#102b4e] shadow-sm transition placeholder:text-[#9bb0c9] focus:border-[#0878e8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8195ae] hover:text-[#294361] focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>

                    {/* Requirements checklist */}
                    {newPassword && (
                      <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${newPassword.length >= 6 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {newPassword.length >= 6 ? "✓" : "•"} 6+ chars
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${hasLetter ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {hasLetter ? "✓" : "•"} Letters
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${hasNumber ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {hasNumber ? "✓" : "•"} Numbers
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-[13px] font-bold text-[#294361]"
                    >
                      Confirm New Password
                    </label>

                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-[#8195ae] transition-colors group-focus-within:text-[#0878e8]">
                        <LockIcon className="h-5 w-5" />
                      </span>

                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Re-enter your new password"
                        disabled={loading}
                        className="h-[52px] w-full rounded-xl border border-[#d6e2f0] bg-white pl-12 pr-12 text-sm font-medium text-[#102b4e] shadow-sm transition placeholder:text-[#9bb0c9] focus:border-[#0878e8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8195ae] hover:text-[#294361] focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>

                    {confirmPassword && (
                      <p className={`mt-1.5 text-xs font-semibold ${passwordsMatch ? "text-emerald-600" : "text-rose-500"}`}>
                        {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0759bd] to-[#087ef0] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,100,220,0.20)] transition duration-200 hover:-translate-y-0.5 hover:from-[#064a9e] hover:to-[#0667ca] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon className="h-5 w-5 animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="group inline-flex items-center gap-2 text-xs font-bold text-[#637a97] transition-colors hover:text-[#0b2b50]"
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                      <span>Back to Login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ==================================================
// SUBCOMPONENTS & ICONS
// ==================================================

function SecurityFeature({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:bg-white/10">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-sky-300">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="mt-0.5 text-xs leading-5 text-blue-100/75">{description}</p>
      </div>
    </div>
  );
}

function BuildManageLogo({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M8 48L32 12L56 48H8Z" fill="#38bdf8" fillOpacity="0.2" />
      <path d="M16 48L32 24L48 48H16Z" fill="#38bdf8" fillOpacity="0.5" />
      <path d="M24 48L32 36L40 48H24Z" fill="#38bdf8" />
      <line x1="8" y1="52" x2="56" y2="52" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="7" r="3.2" />
      <circle cx="5" cy="9" r="2.4" />
      <circle cx="19" cy="9" r="2.4" />
      <path d="M5.5 20v-2.3a6.5 6.5 0 0113 0V20z" />
      <path d="M1.3 18.5v-1.3a4 4 0 014-4c.8 0 1.5.2 2.1.6A7.5 7.5 0 004.8 19H2.5a1.2 1.2 0 01-1.2-.5zM22.7 18.5v-1.3a4 4 0 00-4-4c-.8 0-1.5.2-2.1.6a7.5 7.5 0 012.6 5.2h2.3a1.2 1.2 0 001.2-.5z" />
    </svg>
  );
}

function SuccessIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function EyeIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function SpinnerIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
