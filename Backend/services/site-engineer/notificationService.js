import { seNotificationRepository } from "../../repositories/site-engineer/index.js";

export const seNotificationService = {
  /**
   * Get notifications for Site Engineer
   */
  async getNotifications(engineerId, query) {
    return seNotificationRepository.findNotifications(engineerId, {
      unreadOnly: query.unreadOnly === "true",
      page: query.page,
      limit: query.limit,
    });
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId, engineerId) {
    return seNotificationRepository.markAsRead(notificationId, engineerId);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(engineerId) {
    return seNotificationRepository.markAllAsRead(engineerId);
  },
};
