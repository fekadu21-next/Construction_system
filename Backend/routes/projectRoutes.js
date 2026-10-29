import express from "express";
import { projectController } from "../controllers/projectController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { USER_ROLES } from "../constants/projectConstants.js";
import {
  validateCreateProject,
  validateUpdateProject,
  validateAssignManager,
  validateStatusUpdate,
} from "../validations/projectValidator.js";

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

const PROJECT_VIEWERS = [
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.SITE_ENGINEER,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.SUPERVISOR,
  "SUPERVISER",
  "ADMIN",
];

const PROJECT_EDITORS = [
  USER_ROLES.GENERAL_MANAGER,
  USER_ROLES.PROJECT_MANAGER,
  "ADMIN",
];

router.get("/metrics", authorize(...PROJECT_VIEWERS), projectController.getProjectMetrics);
router.get("/next-code", authorize(...PROJECT_EDITORS), projectController.getNextProjectCode);
router.get("/", authorize(...PROJECT_VIEWERS), projectController.getProjects);
router.get("/:id", authorize(...PROJECT_VIEWERS), projectController.getProjectById);

// Creation and modification restricted to GM and PM
router.post("/", authorize(...PROJECT_EDITORS), validateCreateProject, projectController.createProject);
router.patch("/:id", authorize(...PROJECT_EDITORS), validateUpdateProject, projectController.updateProject);
router.patch("/:id/manager", authorize(...PROJECT_EDITORS), validateAssignManager, projectController.assignManager);
router.patch("/:id/supervisor", authorize(...PROJECT_EDITORS), projectController.assignSupervisor);
router.patch("/:id/status", authorize(...PROJECT_EDITORS), validateStatusUpdate, projectController.updateProjectStatus);
router.patch("/:id/archive", authorize(USER_ROLES.GENERAL_MANAGER, "ADMIN"), projectController.archiveProject);
router.delete("/:id", authorize(USER_ROLES.GENERAL_MANAGER, "ADMIN"), projectController.deleteProject);

export default router;
