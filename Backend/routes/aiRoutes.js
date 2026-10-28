import express from "express";
import { aiController } from "../controllers/aiController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/cost-prediction/:projectId", aiController.getCostPrediction);
router.get("/delay-prediction/:projectId", aiController.getDelayPrediction);
router.get("/workforce-utilization/:projectId", aiController.getWorkforceUtilization);
router.get("/insights", aiController.getAllInsights);

export default router;
