import { notificationService } from "../services/notificationService.js";

export const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { limit, page, isRead } = req.query;
      const role = req.userRole;
      const userId = req.userId;

      const data = await notificationService.getNotifications({
        role,
        userId,
        limit,
        page,
        isRead,
      });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch notifications",
      });
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await notificationService.markAsRead(id);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update notification status",
      });
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const role = req.userRole;
      const userId = req.userId;

      const result = await notificationService.markAllAsRead({ role, userId });

      res.json({
        success: true,
        data: result,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to mark all notifications as read",
      });
    }
  },

  subscribeStream(req, res, next) {
    try {
      const userRole = req.userRole;
      const userId = req.userId;
      notificationService.handleSSE(req, res, userRole, userId);
    } catch (error) {
      console.error("SSE stream error:", error);
      res.status(500).end();
    }
  },
};
