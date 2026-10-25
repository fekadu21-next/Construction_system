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

// All project routes require authentication and General Manager role
router.use(authenticate);
router.use(authorize(USER_ROLES.GENERAL_MANAGER));

router.get("/metrics", projectController.getProjectMetrics);
router.get("/next-code", projectController.getNextProjectCode);
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);
router.post("/", validateCreateProject, projectController.createProject);
router.patch("/:id", validateUpdateProject, projectController.updateProject);
router.patch("/:id/manager", validateAssignManager, projectController.assignManager);
router.patch("/:id/status", validateStatusUpdate, projectController.updateProjectStatus);
router.patch("/:id/archive", projectController.archiveProject);
router.delete("/:id", projectController.deleteProject);

export default router;
