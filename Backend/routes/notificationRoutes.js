import express from "express";
import { notificationController } from "../controllers/notificationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// Real-time SSE stream endpoint
router.get("/stream", notificationController.subscribeStream);

// Fetch notifications with unread count
router.get("/", notificationController.getNotifications);

// Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all as read
router.patch("/read-all", notificationController.markAllAsRead);

export default router;
