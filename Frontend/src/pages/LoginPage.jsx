import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getDashboardRoute } from "../constants/roles.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // Authentication and role-based navigation are unchanged.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      if (!result?.success) {
        setError(result?.error || "Invalid credentials");
        return;
      }

      const dashboardRoute = getDashboardRoute(result.user?.role);

      if (!dashboardRoute) {
        setError(
          "Your account has an invalid role configuration. Please contact your administrator."
        );
        return;
      }

      navigate(dashboardRoute, { replace: true });
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white">
      <div className="relative h-full w-full">
        {/* FULL WIDTH HERO IMAGE BACKGROUND */}
        <section className="relative h-full w-full hidden lg:block z-10">
          <img
            src="/con_her.jpg"
            alt="Construction site with cranes and a construction professional"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Dark overlays keep all hero text readable */}
          <div className="absolute inset-0 bg-[#062747]/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062746]/90 via-[#062746]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#03162d]/90 via-transparent to-[#08294a]/15" />

          <div className="relative z-10 flex h-full w-full flex-col px-8 py-7 xl:px-[54px] xl:py-9">
            {/* Brand */}
            <div className="flex shrink-0 items-center gap-4">
              <BuildManageLogo className="h-[62px] w-[78px] shrink-0" />
              <div className="min-w-0">
                <h2 className="text-[25px] font-bold leading-tight tracking-tight text-white xl:text-[29px]">
                  BuildManage
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-[#dceaff] xl:text-[15px]">
                  Construction Project &amp; Resource Management System
                </p>
              </div>
            </div>

            {/* Main hero content */}
            <div className="my-auto flex min-h-0 flex-col justify-center py-7">
              <div className="max-w-[560px]">
                <h1 className="text-[46px] font-extrabold leading-[1.12] tracking-tight text-white xl:text-[64px]">
                  Build Smarter.
                  <span className="mt-1 block text-[#168cff]">
                    Manage Better.
                  </span>
                </h1>
                <p className="mt-6 max-w-[450px] text-[15px] leading-[1.65] text-[#e4edf9] xl:text-[17px]">
                  A comprehensive construction project and resource management
                  system designed to streamline operations, improve
                  collaboration, and deliver projects on time and within budget.
                </p>
              </div>

              {/* Three feature highlights */}
              <div className="mt-8 grid max-w-[500px] grid-cols-3 gap-5 xl:mt-10 xl:gap-7">
                <FeatureItem icon={<BriefcaseIcon />} lines={["Project", "Management"]} />
                <FeatureItem icon={<PeopleIcon />} lines={["Resource", "Management"]} />
                <FeatureItem icon={<PerformanceIcon />} lines={["Track Progress", "& Performance"]} />
              </div>

              {/* Six supported roles */}
              <div className="mt-7 xl:mt-8">
                <h3 className="mb-3 text-[14px] font-semibold text-white xl:text-[15px]">
                  Our System Supports 6 Roles
                </h3>
                <div className="grid max-w-[560px] grid-cols-3 gap-2.5 xl:gap-3">
                  <RoleCard icon={<RolePersonIcon />} label="General Manager" color="#168bff" />
                  <RoleCard icon={<RolePersonIcon />} label="Project Manager" color="#5bd995" />
                  <RoleCard icon={<RolePersonIcon />} label="HR" color="#a477ff" />
                  <RoleCard icon={<RolePersonIcon />} label="Accountant" color="#ffb347" />
                  <RoleCard icon={<RolePersonIcon />} label="Procurement Officer" color="#20d1de" />
                  <RoleCard icon={<RolePersonIcon />} label="Site Engineer" color="#ff606b" />
                </div>
              </div>
            </div>

            {/* Trust footer */}
            <div className="flex shrink-0 items-center gap-2.5 pb-1 text-[12px] text-[#c4d7f0] xl:text-[14px]">
              <ShieldCheckIcon className="h-5 w-5 text-[#a9d0ff]" />
              <span>Secure</span>
              <span className="text-[#5da7f6]">•</span>
              <span>Efficient</span>
              <span className="text-[#5da7f6]">•</span>
              <span>Collaborative</span>
            </div>
          </div>
        </section>

        {/* LOGIN FORM OVERLAY - 32% WIDTH ON RIGHT SIDE WITH PADDING */}
        <section className="absolute top-0 right-0 h-full w-full flex items-center justify-center lg:justify-end  pt-2 pb-36 pr-8 lg:w-[32%] lg:pr-8 z-20">
          <div className="relative w-full max-w-[500px] rounded-2xl bg-white px-1 py-3 sm:px-5 lg:rounded-xl lg:px-3 lg:py-5 xl:px-6 shadow-2xl z-30">
            {/* Branding */}
            <div className="mb-8 flex flex-col items-center text-center xl:mb-10">
              <BuildManageLogo className="h-[65px] w-[80px] xl:h-[74px] xl:w-[91px]" />
              <h2 className="mt-1 text-[27px] font-extrabold leading-tight tracking-tight text-[#073568] xl:text-[30px]">
                BuildManage
              </h2>
              <p className="mt-1 text-[12px] text-[#617b9d] sm:text-[13px]">
                Construction Project &amp; Resource Management System
              </p>
            </div>

            {/* Welcome */}
            <div className="mb-7">
              <h2 className="text-[25px] font-bold leading-tight tracking-tight text-[#071d3b] xl:text-[27px]">
                Welcome Back
              </h2>
              <p className="mt-2 text-[14px] text-[#607a9e] xl:text-[15px]">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 xl:space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] leading-5 text-red-700"
                >
                  <ErrorCircleIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>

                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b7699]">
                  <UserOutlineIcon className="h-[19px] w-[19px]" />
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Username or Email"
                  required
                  disabled={loading}
                  className="h-[47px] w-full rounded-lg border border-[#dce4ee] bg-white pl-11 pr-3 text-[13px] text-[#183553] outline-none transition placeholder:text-[#9aacc4] hover:border-[#bdcde0] focus:border-[#1478ed] focus:ring-2 focus:ring-[#dbeafe] disabled:cursor-not-allowed disabled:bg-[#f8fafc] xl:h-[49px] xl:text-[14px]"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>

                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b7699]">
                  <LockIcon className="h-[18px] w-[18px]" />
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  required
                  disabled={loading}
                  className="h-[47px] w-full rounded-lg border border-[#dce4ee] bg-white pl-11 pr-12 text-[13px] text-[#183553] outline-none transition placeholder:text-[#9aacc4] hover:border-[#bdcde0] focus:border-[#1478ed] focus:ring-2 focus:ring-[#dbeafe] disabled:cursor-not-allowed disabled:bg-[#f8fafc] xl:h-[49px] xl:text-[14px]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5b7699] transition hover:text-[#0875ed] focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-[18px] w-[18px]" />
                  ) : (
                    <EyeIcon className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>

              {/* Forgot password directly above Sign In */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[12px] font-medium text-[#1769bb] transition hover:text-[#084b99] hover:underline focus:outline-none focus:underline xl:text-[13px]"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-[47px] w-full items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 text-[14px] font-semibold text-white shadow-lg transition-all duration-300 hover:bg-gray-400 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-sm xl:h-[49px] xl:text-[15px]"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="h-5 w-1 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="my-5 flex items-center gap-4 xl:my-6">
              <div className="h-px flex-1 bg-[#e0e7ef]" />
              <span className="text-[11px] text-[#7890ad] xl:text-[12px]">
                Or
              </span>
              <div className="h-px flex-1 bg-[#e0e7ef]" />
            </div>

            {/* Security message */}
            <div className="flex items-center justify-center gap-1.5 text-center text-[10px] text-[#6d85a5] xl:text-[11px]">
              <SmallLockIcon className="h-[13px] w-[13px] shrink-0" />
              <span>Secure Access</span>
              <span className="text-[#a5b6ca]">•</span>
              <span>Your Data is Protected</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ============================================================
   FEATURE COMPONENTS
============================================================ */

function FeatureItem({ icon, lines }) {
  return (
    <div className="flex min-w-0 flex-col items-start">
      <div className="mb-2 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#7eb4ee]/65 bg-[#0c2c4b]/50 text-[#e6f2ff] xl:h-[56px] xl:w-[56px]">
        {icon}
      </div>
      <p className="text-[13px] leading-[1.6] text-[#e1ebf8] xl:text-[14px]">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

function RoleCard({ icon, label, color }) {
  return (
    <div className="flex min-h-[55px] min-w-0 items-center gap-2.5 rounded-[10px] border border-[#527aa1]/30 bg-[#0b2a49]/80 px-2.5 py-2 transition-colors hover:border-[#6ea8e7]/60 hover:bg-[#12395e]/90 xl:min-h-[60px] xl:gap-3 xl:px-3">
      <span className="shrink-0" style={{ color }}>
        {icon}
      </span>
      <span className="min-w-0 text-[11px] font-medium leading-[1.35] text-[#e1ebf8] xl:text-[12px]">
        {label}
      </span>
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
   FEATURE ICONS
============================================================ */

function BriefcaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path
        d="M8 7.5V5.8A1.8 1.8 0 019.8 4h4.4A1.8 1.8 0 0116 5.8v1.7M3.5 12h17M10 12v2h4v-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
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

function PerformanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M3 20h18M5 16l5-5 3 2 6-7M14 6h5v5" />
      <path d="M6 20v-3M11 20v-5M16 20v-3M21 20v-7" />
    </svg>
  );
}

/* ============================================================
   ROLE ICON
============================================================ */

function RolePersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[25px] w-[25px] xl:h-[27px] xl:w-[27px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2a8 8 0 0116 0v2z" />
    </svg>
  );
}

/* ============================================================
   FORM ICONS
============================================================ */

function UserOutlineIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.4" />
      <path
        d="M5 20v-1.5a7 7 0 0114 0V20z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
      <path d="M12 14v3" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M9.88 9.88 2 2l12 12" />
      <path d="M6.61 6.61A12.06 12.06 0 0 1 12 5c5.4 0 10 2.9 10 7s-4.6 7-10 7c-1.8 0-3.5-.5-5-1.4M2 12s2.3-3.4 5.5-5.5" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ErrorCircleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function SmallLockIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
