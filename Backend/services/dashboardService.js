import prisma from "../config/prisma.js";

export const dashboardService = {
  async getDashboardMetrics() {
    // 1. User counts
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    // 2. Project counts by status in a single query
    const statusGroups = await prisma.project.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { archivedAt: null },
    });

    const statusCounts = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    let totalProjects = 0;
    for (const item of statusGroups) {
      if (item.status) {
        statusCounts[item.status] = item._count.id;
        totalProjects += item._count.id;
      }
    }

    // 3. Manager assignment count
    const projectsWithoutManager = await prisma.project.count({
      where: { archivedAt: null, projectManagerId: null },
    });
    const projectsWithManager = Math.max(0, totalProjects - projectsWithoutManager);

    // 4. Recent administrative activity
    const recentActivity = await prisma.auditLog.findMany({
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
    });

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
