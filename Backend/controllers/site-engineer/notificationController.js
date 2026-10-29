import { seNotificationService } from "../../services/site-engineer/index.js";

export const seNotificationController = {
  async getNotifications(req, res, next) {
    try {
      const result = await seNotificationService.getNotifications(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      await seNotificationService.markAsRead(req.params.notificationId, req.userId);
      res.json({
        success: true,
        message: "Notification marked as read.",
      });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await seNotificationService.markAllAsRead(req.userId);
      res.json({
        success: true,
        message: "All notifications marked as read.",
      });
    } catch (error) {
      next(error);
    }
  },
};
