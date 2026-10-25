import prisma from "../config/prisma.js";

export const dashboardService = {
  async getDashboardMetrics() {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      projectsByStatus,
      projectsWithManager,
      projectsWithoutManager,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.project.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.project.count({
        where: { projectManagerId: { not: null } },
      }),
      prisma.project.count({
        where: { projectManagerId: null },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const statusCounts = projectsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {});

    return {
      totalUsers,
      activeUsers,
      totalProjects,
      projectsByStatus: statusCounts,
      projectsWithManager,
      projectsWithoutManager,
      recentActivity,
    };
  },

  async getAuditLogs({ page = 1, limit = 20, action = "", entityType = "", sortBy = "createdAt", sortOrder = "desc" }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  },
};
