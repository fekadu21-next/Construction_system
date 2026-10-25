import express from "express";
import { hrController } from "../controllers/hrController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { USER_ROLES } from "../constants/roles.js";
import {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateRecordAttendance,
  validateCreateLeave,
  validateReviewLeave,
} from "../validations/hrValidator.js";

const router = express.Router();

// All HR routes require authentication and HR_MANAGER or GENERAL_MANAGER permissions
router.use(authenticate);
router.use(authorize(USER_ROLES.HR_MANAGER, USER_ROLES.GENERAL_MANAGER));

// Overview & metrics
router.get("/metrics", hrController.getHRMetrics);
router.get("/next-code", hrController.getNextEmployeeCode);

// Projects for site attendance & worker assignment
router.get("/projects", hrController.getProjects);

// Workforce CRUD
router.get("/employees", hrController.getEmployees);
router.get("/employees/:id", hrController.getEmployeeById);
router.post("/employees", validateCreateEmployee, hrController.createEmployee);
router.patch("/employees/:id", validateUpdateEmployee, hrController.updateEmployee);
router.delete("/employees/:id", hrController.deleteEmployee);

// Site Attendance & Timesheets
router.get("/attendance", hrController.getDailyAttendance);
router.post("/attendance", validateRecordAttendance, hrController.recordAttendance);

// Leave Requests & Approvals
router.get("/leaves", hrController.getLeaveRequests);
router.post("/leaves", validateCreateLeave, hrController.submitLeaveRequest);
router.patch("/leaves/:id/review", validateReviewLeave, hrController.reviewLeaveRequest);

// Payroll & Wage Calculations
router.get("/payroll", hrController.getPayrollSheet);

export default router;
