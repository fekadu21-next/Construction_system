import { EventEmitter } from "events";
import prisma from "../config/prisma.js";

const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(100);

export const notificationService = {
  async createNotification({
    recipientRole = null,
    recipientUserId = null,
    title,
    message,
    type = "INFO",
    category = "GENERAL",
    link = null,
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          recipientRole,
          recipientUserId,
          title,
          message,
          type,
          category,
          link,
        },
      });

      // Broadcast to real-time subscribers
      notificationEmitter.emit("new_notification", notification);

      return notification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      return null;
    }
  },

  async getNotifications({ role = null, userId = null, limit = 20, page = 1, isRead = null }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      OR: [
        { recipientRole: null, recipientUserId: null },
        ...(role ? [{ recipientRole: role }] : []),
        ...(userId ? [{ recipientUserId: userId }] : []),
      ],
    };

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === "true" || isRead === true;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  async markAsRead(id) {
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return updated;
  },

  async markAllAsRead({ role = null, userId = null }) {
    const where = {
      isRead: false,
      OR: [
        { recipientRole: null, recipientUserId: null },
        ...(role ? [{ recipientRole: role }] : []),
        ...(userId ? [{ recipientUserId: userId }] : []),
      ],
    };

    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return result;
  },

  handleSSE(req, res, userRole, userId) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`);

    // Listener for new notifications
    const listener = (notification) => {
      const matchRole = !notification.recipientRole || notification.recipientRole === userRole;
      const matchUser = !notification.recipientUserId || notification.recipientUserId === userId;

      if (matchRole && matchUser) {
        res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
      }
    };

    notificationEmitter.on("new_notification", listener);

    // Keep connection alive with heartbeat ping
    const keepAlive = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      notificationEmitter.off("new_notification", listener);
      res.end();
    });
  },
};
