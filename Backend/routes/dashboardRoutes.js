import express from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

// All dashboard routes require authentication and General Manager role
router.use(authenticate);
router.use(authorize(USER_ROLES.GENERAL_MANAGER));

router.get("/metrics", dashboardController.getDashboardMetrics);
router.get("/audit-logs", dashboardController.getAuditLogs);

export default router;
