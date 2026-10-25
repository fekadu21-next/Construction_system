import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await forgotPassword(email.trim());

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Email is not registered");
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
              LEFT PANEL — CONSTRUCTION BRANDING
          =================================================== */}
          <section className="relative hidden overflow-hidden bg-[#071d36] lg:flex lg:flex-col lg:justify-between">
            <img
              src="/con_hero.jpg"
              alt="Construction site and building development"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            {/* Image overlays */}
            <div className="absolute inset-0 bg-[#061a32]/65" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#061a32]/95 via-[#082c50]/65 to-[#061a32]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#031326]/95 via-transparent to-transparent" />

            {/* Decorative light */}
            <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />

            <div className="relative z-10 flex h-full flex-col p-8 xl:p-12">
              {/* Logo and brand */}
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

              {/* Main content */}
              <div className="my-auto py-12">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-3.5 py-2 backdrop-blur-md">
                  <ShieldCheckIcon className="h-4 w-4 text-sky-300" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">
                    Account Security
                  </span>
                </div>

                <h1 className="max-w-lg text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[53px]">
                  Secure your account.
                  <span className="mt-2 block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Get back to work.
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-sm leading-7 text-slate-200 xl:text-[15px]">
                  Recover access to your BuildManage account and get back to
                  coordinating projects, managing resources, and working with
                  your construction team.
                </p>

                {/* Security features */}
                <div className="mt-8 max-w-md space-y-4">
                  <SecurityFeature
                    icon={<MailIcon />}
                    title="Simple account recovery"
                    description="Request password reset instructions using your email."
                  />

                  <SecurityFeature
                    icon={<LockIcon />}
                    title="Account protection"
                    description="Help keep your account and project information secure."
                  />

                  <SecurityFeature
                    icon={<PeopleIcon />}
                    title="Your work stays connected"
                    description="Return to your role-based project workspace."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-blue-100/75">
                <ShieldCheckIcon className="h-4 w-4 text-emerald-300" />
                <span>Secure</span>
                <span className="text-blue-300/60">•</span>
                <span>Reliable</span>
                <span className="text-blue-300/60">•</span>
                <span>Built for construction teams</span>
              </div>
            </div>
          </section>

          {/* ==================================================
              RIGHT PANEL — FORGOT PASSWORD FORM ONLY
          =================================================== */}
          <section className="relative flex items-center justify-center bg-gradient-to-br from-white via-white to-[#f2f7ff] px-5 py-9 sm:px-10 lg:px-9 xl:px-14">
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#9ab4d3_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

            <div className="relative w-full max-w-[410px]">
              {/* Compact brand for smaller screens */}
              <div className="mb-9 flex flex-col items-center text-center lg:hidden">
                <div className="mb-3 flex h-[70px] w-[76px] items-center justify-center rounded-2xl border border-blue-100 bg-white shadow-[0_8px_28px_rgba(15,65,120,0.10)]">
                  <BuildManageLogo className="h-14 w-16" />
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-[#0b2b50]">
                  BuildManage
                </h2>

                <p className="mt-1 text-xs text-[#70839d]">
                  Construction Project &amp; Resource Management System
                </p>
              </div>

              {/* Form heading */}
              <div className="mb-8">
                <div className="mb-5 flex h-[54px] w-[54px] items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-100 text-[#0875e1] shadow-sm">
                  <ResetMailIcon className="h-7 w-7" />
                </div>

                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1475d4]">
                  Account Recovery
                </p>

                <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#102b4e] sm:text-[34px]">
                  Forgot Password?
                </h1>

                <p className="mt-3 text-sm leading-6 text-[#657b97]">
                  Don&apos;t worry. Enter the email address associated with
                  your account and we&apos;ll help you reset your password.
                </p>
              </div>

              {/* Success state */}
              {success ? (
                <div className="space-y-6">
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <SuccessIcon className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-emerald-900">
                          Email Sent
                        </h3>
                        <p className="mt-1 text-xs text-emerald-700">
                          Check your email inbox
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-emerald-800">
                      If an account exists with this email, a password reset
                      link has been sent. Check your email for instructions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="group flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0759bd] to-[#087ef0] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,100,220,0.20)] transition duration-200 hover:-translate-y-0.5 hover:from-[#064a9e] hover:to-[#0667ca] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200"
                  >
                    <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Error message */}
                  {error && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-5 text-red-700"
                    >
                      <ErrorIcon className="mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-semibold">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Email input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-[13px] font-bold text-[#294361]"
                    >
                      Email Address
                    </label>

                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-[#8195ae] transition-colors group-focus-within:text-[#0878e8]">
                        <MailIcon className="h-5 w-5" />
                      </span>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="you@example.com"
                        className="h-[55px] w-full rounded-xl border border-[#d9e4f1] bg-[#fbfdff] pl-12 pr-4 text-sm font-medium text-[#173453] outline-none transition duration-200 placeholder:font-normal placeholder:text-[#a0afc1] hover:border-[#b7cce4] focus:border-[#1682f5] focus:bg-white focus:ring-4 focus:ring-blue-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>

                    <p className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-[#8192a9]">
                      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      Enter the email address linked to your account.
                    </p>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex h-[55px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#0759bd] via-[#0878e8] to-[#168af7] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(0,100,220,0.20)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,100,220,0.27)] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <SpinnerIcon className="h-5 w-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRightIcon className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  {/* Navigation link only; no login form */}
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#53708f] transition hover:text-[#0875e1] focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      Back to Login
                    </button>
                  </div>
                </form>
              )}

              {/* Security notice */}
              <div className="mt-8 border-t border-[#e7eef6] pt-5">
                <div className="flex items-start gap-3 rounded-xl bg-[#f6f9fd] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-white text-[#0875e1] shadow-sm">
                    <LockIcon className="h-[17px] w-[17px]" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#294361]">
                      Your security matters
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-[#778ba4]">
                      Your account recovery request is handled through the
                      existing BuildManage authentication service.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-[#8192a9]">
                <ShieldCheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Secure Access</span>
                <span className="text-[#c2cedc]">•</span>
                <span>BuildManage Account Recovery</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   SECURITY FEATURE
============================================================ */

function SecurityFeature({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sky-200 backdrop-blur-sm">
        {icon}
      </div>

      <div className="pt-0.5">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-blue-100/70">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   BUILD MANAGE LOGO
============================================================ */

function BuildManageLogo({ className = "" }) {
  return (
    <svg
      viewBox="0 0 100 82"
      fill="none"
      className={className}
      role="img"
      aria-label="BuildManage"
    >
      <path d="M7 69V39L20 31V65L7 69Z" fill="#A6C8F4" />
      <path d="M25 64V16L39 5V60L25 64Z" fill="#EAF3FF" />
      <path d="M44 60V24L58 32V65L44 60Z" fill="#1985F7" />
      <path d="M63 65V35L77 43V70L63 65Z" fill="#0961C7" />
      <path d="M4 72L83 72L89 68V74L4 77V72Z" fill="#BBD8FF" />
    </svg>
  );
}

/* ============================================================
   ICONS
============================================================ */

function ResetMailIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
      <path d="M16 3h4v4M20 3l-4 4" />
    </svg>
  );
}

function MailIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
      <path d="M12 14v3" />
    </svg>
  );
}

function PeopleIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "h-5 w-5"}
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="3.2" />
      <circle cx="5" cy="9" r="2.4" />
      <circle cx="19" cy="9" r="2.4" />
      <path d="M5.5 20v-2.3a6.5 6.5 0 0113 0V20z" />
      <path d="M1.3 18.5v-1.3a4 4 0 014-4c.8 0 1.5.2 2.1.6A7.5 7.5 0 004.8 19H2.5a1.2 1.2 0 01-1.2-.5zM22.7 18.5v-1.3a4 4 0 00-4-4c-.8 0-1.5.2-2.1.6a7.5 7.5 0 012.6 5.2h2.3a1.2 1.2 0 001.2-.5z" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        d="m9 12 2 2 4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14m-7-7 7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity=".3"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}