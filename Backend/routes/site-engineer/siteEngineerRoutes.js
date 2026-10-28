import express from "express";
import {
  seDashboardController,
  seProjectController,
  seTaskController,
  seActivityController,
  seAttendanceController,
  seProgressReportController,
  seMaterialRequestController,
  seNotificationController,
} from "../../controllers/site-engineer/index.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { USER_ROLES } from "../../constants/roles.js";
import {
  validateTaskProgressUpdate,
  validateCreateActivity,
  validateUpdateActivity,
  validateRecordAttendance,
  validateUpdateAttendance,
  validateCreateProgressReport,
  validateCreateMaterialRequest,
} from "../../validations/site-engineer/index.js";

const router = express.Router();

// Role-based access control: Authenticated Site Engineer only
router.use(authenticate);
router.use(authorize(USER_ROLES.SITE_ENGINEER));

// 1. Dashboard Overview
router.get("/dashboard", seDashboardController.getDashboard);

// 2. Assigned Projects
router.get("/projects", seProjectController.getProjects);
router.get("/projects/:projectId", seProjectController.getProjectById);
router.get("/projects/:projectId/workers", seAttendanceController.getProjectWorkers);

// 3. Assigned Tasks
router.get("/tasks", seTaskController.getTasks);
router.get("/tasks/:taskId", seTaskController.getTaskById);
router.patch("/tasks/:taskId/progress", validateTaskProgressUpdate, seTaskController.updateProgress);

// 4. Daily Site Activities
router.get("/activities", seActivityController.getActivities);
router.post("/activities", validateCreateActivity, seActivityController.createActivity);
router.get("/activities/:activityId", seActivityController.getActivityById);
router.patch("/activities/:activityId", validateUpdateActivity, seActivityController.updateActivity);

// 5. Worker Attendance
router.get("/attendance", seAttendanceController.getAttendance);
router.post("/attendance", validateRecordAttendance, seAttendanceController.recordAttendance);
router.patch("/attendance/:attendanceId", validateUpdateAttendance, seAttendanceController.updateAttendance);

// 6. Progress Reports
router.get("/progress-reports", seProgressReportController.getProgressReports);
router.post("/progress-reports", validateCreateProgressReport, seProgressReportController.submitProgressReport);
router.get("/progress-reports/:reportId", seProgressReportController.getProgressReportById);

// 7. Material Requests
router.get("/material-requests", seMaterialRequestController.getMaterialRequests);
router.post("/material-requests", validateCreateMaterialRequest, seMaterialRequestController.submitMaterialRequest);
router.get("/material-requests/:requestId", seMaterialRequestController.getMaterialRequestById);

// 8. Notifications
router.get("/notifications", seNotificationController.getNotifications);
router.patch("/notifications/mark-all-read", seNotificationController.markAllAsRead);
router.patch("/notifications/:notificationId/read", seNotificationController.markAsRead);

export default router;
