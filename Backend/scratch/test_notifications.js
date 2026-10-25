import { notificationService } from "../services/notificationService.js";
import prisma from "../config/prisma.js";

async function main() {
  console.log("Testing notificationService...");

  const notif = await notificationService.createNotification({
    title: "System Test Notification",
    message: "Verifying real-time notifications integration.",
    type: "SUCCESS",
    category: "GENERAL",
    link: "/hr/dashboard",
  });

  console.log("Created notification:", notif);

  const list = await notificationService.getNotifications({ limit: 5 });
  console.log("Fetched notifications:", {
    total: list.pagination.total,
    unreadCount: list.unreadCount,
    first: list.notifications[0]?.title,
  });

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
