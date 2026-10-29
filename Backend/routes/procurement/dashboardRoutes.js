import express from "express";
import { dashboardController } from "../../controllers/procurement/dashboardController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/stats", dashboardController.getDashboardStats);

export default router;
