import express from "express";
import { userController } from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validateCreateUser, validateUpdateUser } from "../validations/userValidator.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

const USER_MANAGERS = [USER_ROLES.GENERAL_MANAGER, "ADMIN"];
const SELECT_LIST_VIEWERS = [USER_ROLES.GENERAL_MANAGER, USER_ROLES.PROJECT_MANAGER, "ADMIN"];

// Specific selector endpoints
router.get("/project-managers", authorize(...SELECT_LIST_VIEWERS), userController.getProjectManagers);
router.get("/supervisors", authorize(...SELECT_LIST_VIEWERS), userController.getSupervisors);

// General Manager management endpoints
router.get("/", authorize(...USER_MANAGERS), userController.getUsers);
router.get("/summary", authorize(...USER_MANAGERS), userController.getUserSummary);
router.get("/roles", authorize(...USER_MANAGERS), userController.getRoles);

// Parameterized user endpoints
router.get("/:id", authorize(...USER_MANAGERS), userController.getUserById);
router.post("/", authorize(...USER_MANAGERS), validateCreateUser, userController.createUser);
router.patch("/:id", authorize(...USER_MANAGERS), validateUpdateUser, userController.updateUser);
router.patch("/:id/status", authorize(...USER_MANAGERS), userController.updateUserStatus);
router.delete("/:id", authorize(...USER_MANAGERS), userController.deleteUser);

export default router;
