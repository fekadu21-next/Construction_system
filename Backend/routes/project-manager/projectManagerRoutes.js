import express from "express";
import {
  pmDashboardController,
  pmProjectController,
  pmMilestoneController,
  pmProgressReportController,
  pmMaterialRequestController,
  pmBudgetController,
  pmReportController,
} from "../../controllers/project-manager/index.js";
import { authenticate, authorize } from "../../middlewares/authMiddleware.js";
import { USER_ROLES } from "../../constants/roles.js";
import {
  validateProjectIdParam,
  validateMilestoneUpdate,
  validateMaterialRequestDecision,
  validateProgressReportReview,
} from "../../validations/project-manager/index.js";

const router = express.Router();

// Role-based access control: Project Manager & General Manager only
router.use(authenticate);
router.use(authorize(USER_ROLES.PROJECT_MANAGER, USER_ROLES.GENERAL_MANAGER));

// 1. Dashboard Overview
router.get("/dashboard", pmDashboardController.getDashboard);

// 2. Assigned Projects
router.get("/projects", pmProjectController.getProjects);
router.get("/projects/:projectId", validateProjectIdParam, pmProjectController.getProjectById);
router.get("/projects/:projectId/milestones", validateProjectIdParam, pmMilestoneController.getMilestones);

// 3. Milestones & Schedules
router.patch("/milestones/:milestoneId", validateMilestoneUpdate, pmMilestoneController.updateMilestone);

// 4. Site Engineer Progress Reports
router.get("/progress-reports", pmProgressReportController.getProgressReports);
router.patch("/progress-reports/:reportId/review", validateProgressReportReview, pmProgressReportController.reviewProgressReport);

// 5. Material Requests & Approvals
router.get("/material-requests", pmMaterialRequestController.getMaterialRequests);
router.patch("/material-requests/:requestId/approve", validateMaterialRequestDecision, pmMaterialRequestController.approveMaterialRequest);
router.patch("/material-requests/:requestId/reject", validateMaterialRequestDecision, pmMaterialRequestController.rejectMaterialRequest);

// 6. Budget & Expenditure Ledger
router.get("/budget", pmBudgetController.getBudget);

// 7. Performance Reports & Analytics
router.get("/reports", pmReportController.getReports);

export default router;
