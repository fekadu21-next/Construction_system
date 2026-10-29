import express from "express";
import { preferencesController } from "../controllers/preferencesController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All preference routes require authentication
router.use(authenticate);

router.get("/", preferencesController.getPreferences);
router.put("/", preferencesController.updatePreferences);
router.patch("/", preferencesController.updatePreferences);

export default router;
