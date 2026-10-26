export const USER_ROLES = {
  GENERAL_MANAGER: "GENERAL_MANAGER",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  HR_MANAGER: "HR_MANAGER",
  SITE_ENGINEER: "SITE_ENGINEER",
  PROCUREMENT_OFFICER: "PROCUREMENT_OFFICER",
  ACCOUNTANT: "ACCOUNTANT",
  SUPERVISOR: "SUPERVISOR",
  SUPERVISER: "SUPERVISOR",
};

export const ROLE_LABELS = {
  [USER_ROLES.GENERAL_MANAGER]: "General Manager",
  [USER_ROLES.PROJECT_MANAGER]: "Project Manager",
  [USER_ROLES.HR_MANAGER]: "HR Manager",
  [USER_ROLES.SITE_ENGINEER]: "Site Engineer",
  [USER_ROLES.PROCUREMENT_OFFICER]: "Procurement Officer",
  [USER_ROLES.ACCOUNTANT]: "Accountant",
  [USER_ROLES.SUPERVISOR]: "Supervisor",
  SUPERVISER: "Supervisor",
};

export const ROLE_DASHBOARD_ROUTES = {
  [USER_ROLES.GENERAL_MANAGER]: "/general-manager/dashboard",
  [USER_ROLES.PROJECT_MANAGER]: "/project-manager/dashboard",
  [USER_ROLES.HR_MANAGER]: "/hr/dashboard",
  [USER_ROLES.SITE_ENGINEER]: "/site-engineer/dashboard",
  [USER_ROLES.PROCUREMENT_OFFICER]: "/procurement/dashboard",
  [USER_ROLES.ACCOUNTANT]: "/accountant/dashboard",
  [USER_ROLES.SUPERVISOR]: "/supervisor/dashboard",
  SUPERVISER: "/supervisor/dashboard",
};

export const getDashboardRoute = (role) => {
  return ROLE_DASHBOARD_ROUTES[role] || null;
};

export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role;
};
