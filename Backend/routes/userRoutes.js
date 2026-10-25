import express from "express";
import { userController } from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validateCreateUser, validateUpdateUser } from "../validations/userValidator.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

// All user routes require authentication and General Manager role
router.use(authenticate);
router.use(authorize(USER_ROLES.GENERAL_MANAGER));

// Specific endpoints MUST come before parameterized /:id route
router.get("/", userController.getUsers);
router.get("/summary", userController.getUserSummary);
router.get("/roles", userController.getRoles);
router.get("/project-managers", userController.getProjectManagers);

// Parameterized user endpoints
router.get("/:id", userController.getUserById);
router.post("/", validateCreateUser, userController.createUser);
router.patch("/:id", validateUpdateUser, userController.updateUser);
router.patch("/:id/status", userController.updateUserStatus);
router.delete("/:id", userController.deleteUser);

export default router;
