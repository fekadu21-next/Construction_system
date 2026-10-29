import express from "express";
import { hrController } from "../controllers/hr/hrController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { USER_ROLES } from "../constants/roles.js";
import {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateRecordAttendance,
  validateSubmitAttendance,
  validateReviewAttendance,
  validateUpdateSingleAttendance,
  validateCreateLeave,
  validateReviewLeave,
} from "../validations/hrValidator.js";

const router = express.Router();

// Authentication required for all HR routes
router.use(authenticate);

// Permitted role groups
const HR_AND_GM = [USER_ROLES.HR_MANAGER, USER_ROLES.GENERAL_MANAGER, "ADMIN"];
const ATTENDANCE_VIEWERS = [
  USER_ROLES.HR_MANAGER,
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.SITE_ENGINEER,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.SUPERVISOR,
  "SUPERVISER",
];
const ATTENDANCE_RECORDERS = [
  USER_ROLES.HR_MANAGER,
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.SITE_ENGINEER,
  USER_ROLES.SUPERVISOR,
  "SUPERVISER",
];
const ATTENDANCE_REVIEWERS = [
  USER_ROLES.HR_MANAGER,
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.PROJECT_MANAGER,
];
const PAYROLL_VIEWERS = [
  USER_ROLES.HR_MANAGER,
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.ACCOUNTANT,
];

// Overview & metrics
router.get("/metrics", authorize(...HR_AND_GM), hrController.getHRMetrics);
router.get("/next-code", authorize(...HR_AND_GM), hrController.getNextEmployeeCode);

// Projects for site attendance & worker assignment
router.get("/projects", authorize(...ATTENDANCE_VIEWERS), hrController.getProjects);

// Available & unassigned workers
router.get("/available-workers", authorize(...HR_AND_GM), hrController.getAvailableWorkers);

// Project Assignments & Transfers (HR & GM)
router.post("/assignments", authorize(...HR_AND_GM), hrController.assignWorker);
router.post("/assignments/transfer", authorize(...HR_AND_GM), hrController.transferWorker);
router.get("/employees/:id/assignments", authorize(...ATTENDANCE_VIEWERS), hrController.getWorkerAssignments);

// System Users & Workforce Import (HR & GM)
router.get("/system-users", authorize(...HR_AND_GM), hrController.getSystemUsers);
router.post("/employees/import-users", authorize(...HR_AND_GM), hrController.importUsersToEmployees);

// Workforce CRUD (HR & GM)
router.get("/employees", authorize(...ATTENDANCE_VIEWERS), hrController.getEmployees);
router.get("/employees/:id", authorize(...ATTENDANCE_VIEWERS), hrController.getEmployeeById);
router.post("/employees", authorize(...HR_AND_GM), validateCreateEmployee, hrController.createEmployee);
router.patch("/employees/:id/approve", authorize(...HR_AND_GM), hrController.approveEmployee);
router.patch("/employees/:id/reject", authorize(...HR_AND_GM), hrController.rejectEmployee);
router.patch("/employees/:id", authorize(...HR_AND_GM), validateUpdateEmployee, hrController.updateEmployee);
router.put("/employees/:id", authorize(...HR_AND_GM), validateUpdateEmployee, hrController.updateEmployee);
router.delete("/employees/:id", authorize(...HR_AND_GM), hrController.deleteEmployee);

// Site Attendance Management Hub
router.get("/attendance/dashboard", authorize(...ATTENDANCE_VIEWERS), hrController.getAttendanceDashboard);
router.get("/attendance/history", authorize(...ATTENDANCE_VIEWERS), hrController.getAttendanceHistory);
router.get("/attendance/worker/:workerId", authorize(...ATTENDANCE_VIEWERS), hrController.getWorkerAttendance);
router.get("/attendance/reports", authorize(...ATTENDANCE_VIEWERS), hrController.getAttendanceReports);
router.get("/attendance", authorize(...ATTENDANCE_VIEWERS), hrController.getDailyAttendance);
router.post("/attendance", authorize(...ATTENDANCE_RECORDERS), validateRecordAttendance, hrController.recordAttendance);
router.post("/attendance/submit", authorize(...ATTENDANCE_RECORDERS), validateSubmitAttendance, hrController.submitDailyAttendance);
router.post("/attendance/review", authorize(...ATTENDANCE_REVIEWERS), validateReviewAttendance, hrController.reviewDailyAttendance);
router.patch("/attendance/:id", authorize(...ATTENDANCE_REVIEWERS), validateUpdateSingleAttendance, hrController.updateSingleAttendance);

// Leave Requests & Approvals
router.get("/leaves", authorize(...ATTENDANCE_VIEWERS), hrController.getLeaveRequests);
router.post("/leaves", authorize(...ATTENDANCE_RECORDERS), validateCreateLeave, hrController.submitLeaveRequest);
router.patch("/leaves/:id/review", authorize(...HR_AND_GM), validateReviewLeave, hrController.reviewLeaveRequest);

// Payroll & Wage Calculations
router.get("/payroll", authorize(...PAYROLL_VIEWERS), hrController.getPayrollSheet);

export default router;
