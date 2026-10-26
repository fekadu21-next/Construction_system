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

// Read endpoints: accessible by both General Manager and Project Manager (with assignment enforcement)
router.get("/metrics", authorize(USER_ROLES.GENERAL_MANAGER, USER_ROLES.PROJECT_MANAGER), projectController.getProjectMetrics);
router.get("/next-code", authorize(USER_ROLES.GENERAL_MANAGER), projectController.getNextProjectCode);
router.get("/", authorize(USER_ROLES.GENERAL_MANAGER, USER_ROLES.PROJECT_MANAGER), projectController.getProjects);
router.get("/:id", authorize(USER_ROLES.GENERAL_MANAGER, USER_ROLES.PROJECT_MANAGER), projectController.getProjectById);

// Write endpoints: restricted to General Manager
router.post("/", authorize(USER_ROLES.GENERAL_MANAGER), validateCreateProject, projectController.createProject);
router.patch("/:id", authorize(USER_ROLES.GENERAL_MANAGER), validateUpdateProject, projectController.updateProject);
router.patch("/:id/manager", authorize(USER_ROLES.GENERAL_MANAGER), validateAssignManager, projectController.assignManager);
router.patch("/:id/status", authorize(USER_ROLES.GENERAL_MANAGER, USER_ROLES.PROJECT_MANAGER), validateStatusUpdate, projectController.updateProjectStatus);
router.patch("/:id/archive", authorize(USER_ROLES.GENERAL_MANAGER), projectController.archiveProject);
router.delete("/:id", authorize(USER_ROLES.GENERAL_MANAGER), projectController.deleteProject);

export default router;
