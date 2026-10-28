import express from "express";
import { supervisorController } from "../controllers/supervisorController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { USER_ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(authenticate);

const SUPERVISOR_ROLES = [
  USER_ROLES.SUPERVISOR,
  "SUPERVISER",
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.SITE_ENGINEER,
  USER_ROLES.HR_MANAGER,
  USER_ROLES.ACCOUNTANT,
];

router.use(authorize(...SUPERVISOR_ROLES));

// Dashboard metrics
router.get("/dashboard", supervisorController.getDashboard);

// Authorized projects and workers
router.get("/projects", supervisorController.getProjects);
router.get("/projects/:projectId/workers", supervisorController.getProjectWorkers);
router.post("/projects/:projectId/workers", supervisorController.addDailyWorker);
router.post("/workers", supervisorController.addDailyWorker);

// Daily site attendance
router.get("/attendance", supervisorController.getAttendance);
router.post("/attendance", supervisorController.saveAttendance);
router.post("/attendance/submit", supervisorController.submitAttendance);
router.post("/attendance/request-correction", supervisorController.requestCorrection);

// Tasks & daily progress
router.get("/tasks", supervisorController.getTasks);
router.patch("/tasks/:taskId/progress", supervisorController.updateTaskProgress);

// Daily site reports & activities
router.get("/daily-reports", supervisorController.getDailyActivities);
router.post("/daily-reports", supervisorController.recordDailyActivity);

// Materials & material requests
router.get("/materials", supervisorController.getMaterials);
router.get("/material-requests", supervisorController.getMaterialRequests);
router.post("/material-requests", supervisorController.createMaterialRequest);

// Site incidents & safety
router.get("/incidents", supervisorController.getIncidents);
router.post("/incidents", supervisorController.reportIncident);
router.patch("/incidents/:id/resolve", supervisorController.resolveIncident);

export default router;
