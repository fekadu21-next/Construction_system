export const SYSTEM_USER_ROLES = [
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "SITE_ENGINEER", label: "Site Engineer" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "PROCUREMENT_OFFICER", label: "Procurement Officer" },
  { value: "SUPERVISOR", label: "Supervisor" },
];

export const WORKER_TRADES = [
  { value: "FOREMAN", label: "Foreman" },
  { value: "SURVEYOR", label: "Surveyor" },
  { value: "SAFETY_OFFICER", label: "Safety Officer" },
  { value: "CARPENTER", label: "Carpenter" },
  { value: "MASON", label: "Mason" },
  { value: "ELECTRICIAN", label: "Electrician" },
  { value: "PLUMBER", label: "Plumber" },
  { value: "WELDER", label: "Welder" },
  { value: "HEAVY_EQUIPMENT_OPERATOR", label: "Heavy Equipment Operator" },
  { value: "SITE_LABORER", label: "Site Laborer" },
  { value: "STEEL_FIXER", label: "Steel Fixer" },
  { value: "PAINTER", label: "Painter" },
  { value: "SCAFFOLDER", label: "Scaffolder" },
  { value: "PLASTERER", label: "Plasterer" },
  { value: "TILER", label: "Tiler" },
  { value: "GLAZIER", label: "Glazier" },
  { value: "ROOFER", label: "Roofer" },
  { value: "DRIVER", label: "Driver" },
];

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time Staff" },
  { value: "CONTRACT", label: "Contract Worker" },
  { value: "DAILY_LABORER", label: "Daily Wage Laborer" },
  { value: "INTERN", label: "Intern / Apprentice" },
];

export const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", icon: "🟢", color: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { value: "ABSENT", label: "Absent", icon: "🔴", color: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
  { value: "HALF_DAY", label: "Half Day", icon: "🟡", color: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  { value: "LATE", label: "Late", icon: "🟠", color: "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" },
  { value: "ON_LEAVE", label: "On Leave", icon: "🔵", color: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
  { value: "HOLIDAY", label: "Holiday", icon: "🟣", color: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" },
  { value: "REST_DAY", label: "Rest Day", icon: "⚪", color: "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700" },
];

export const ATTENDANCE_APPROVAL_STATUSES = {
  DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700" },
  SUBMITTED: { label: "Pending Approval", badge: "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800" },
  APPROVED: { label: "Verified & Approved", badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" },
  REJECTED: { label: "Returned for Correction", badge: "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300 dark:border-rose-800" },
};

export const LEAVE_STATUSES = {
  PENDING: { label: "Pending", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: "Approved", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  REJECTED: { label: "Rejected", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  CANCELLED: { label: "Cancelled", badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
};

export const EMPLOYEE_STATUSES = {
  ACTIVE: { label: "Active", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" },
  PENDING_APPROVAL: { label: "Pending HR Approval", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700" },
  REJECTED: { label: "Rejected by HR", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700" },
  INACTIVE: { label: "Inactive", badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
  ON_LEAVE: { label: "On Leave", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  TERMINATED: { label: "Terminated", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};
