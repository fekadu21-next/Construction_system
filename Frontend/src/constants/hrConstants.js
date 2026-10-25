export const WORKER_TRADES = [
  { value: "SITE_ENGINEER", label: "Site Engineer" },
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
  { value: "PAINTER", label: "Painter" },
  { value: "SCAFFOLDER", label: "Scaffolder" },
];

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time Staff" },
  { value: "CONTRACT", label: "Contract Worker" },
  { value: "DAILY_LABORER", label: "Daily Wage Laborer" },
  { value: "INTERN", label: "Intern / Apprentice" },
];

export const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", color: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" },
  { value: "ABSENT", label: "Absent", color: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" },
  { value: "HALF_DAY", label: "Half Day", color: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" },
  { value: "LATE", label: "Late", color: "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800" },
  { value: "ON_LEAVE", label: "On Leave", color: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" },
];

export const LEAVE_STATUSES = {
  PENDING: { label: "Pending", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: "Approved", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  REJECTED: { label: "Rejected", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  CANCELLED: { label: "Cancelled", badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
};

export const EMPLOYEE_STATUSES = {
  ACTIVE: { label: "Active", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  INACTIVE: { label: "Inactive", badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
  ON_LEAVE: { label: "On Leave", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  TERMINATED: { label: "Terminated", badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};
