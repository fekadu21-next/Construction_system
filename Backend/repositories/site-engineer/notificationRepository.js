import prisma from "../../config/prisma.js";

export const seNotificationRepository = {
  /**
   * Find notifications for Site Engineer
   */
  async findNotifications(engineerId, { unreadOnly = false, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      OR: [{ recipientUserId: engineerId }, { recipientRole: "SITE_ENGINEER" }],
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notifications.count({ where }),
      prisma.notifications.count({
        where: {
          OR: [{ recipientUserId: engineerId }, { recipientRole: "SITE_ENGINEER" }],
          isRead: false,
        },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId, engineerId) {
    return prisma.notifications.updateMany({
      where: {
        id: notificationId,
        OR: [{ recipientUserId: engineerId }, { recipientRole: "SITE_ENGINEER" }],
      },
      data: { isRead: true, updatedAt: new Date() },
    });
  },

  /**
   * Mark all notifications as read for engineer
   */
  async markAllAsRead(engineerId) {
    return prisma.notifications.updateMany({
      where: {
        OR: [{ recipientUserId: engineerId }, { recipientRole: "SITE_ENGINEER" }],
        isRead: false,
      },
      data: { isRead: true, updatedAt: new Date() },
    });
  },

  /**
   * Create notification (e.g. notify PM of new report or material request)
   */
  async createNotification(data) {
    return prisma.notifications.create({
      data: {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        updatedAt: new Date(),
        ...data,
      },
    });
  },
};
