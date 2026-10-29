import prisma from "../../config/prisma.js";

export const seActivityRepository = {
  /**
   * Find paginated daily activities recorded by or for assigned projects
   */
  async findActivities(engineerId, { projectId, dateFrom, dateTo, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      project: {
        archivedAt: null,
        OR: [
          { siteEngineerId: engineerId },
          { milestones: { some: { assignedEngineerId: engineerId } } },
          { tasks: { some: { assignedToId: engineerId } } },
        ],
      },
    };

    if (projectId && projectId !== "ALL") {
      where.projectId = projectId;
    }

    if (dateFrom || dateTo) {
      where.activityDate = {};
      if (dateFrom) where.activityDate.gte = new Date(dateFrom);
      if (dateTo) where.activityDate.lte = new Date(dateTo);
    }

    const [activities, total] = await Promise.all([
      prisma.dailySiteActivity.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          siteEngineer: { select: { id: true, fullName: true, email: true } },
          task: { select: { id: true, taskName: true, status: true } },
        },
      }),
      prisma.dailySiteActivity.count({ where }),
    ]);

    return {
      activities,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Find activity by ID
   */
  async findById(activityId) {
    return prisma.dailySiteActivity.findUnique({
      where: { id: activityId },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        siteEngineer: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, taskName: true, status: true } },
      },
    });
  },

  /**
   * Create daily site activity
   */
  async create(data) {
    return prisma.dailySiteActivity.create({
      data,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        siteEngineer: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, taskName: true } },
      },
    });
  },

  /**
   * Update daily site activity
   */
  async update(activityId, data) {
    return prisma.dailySiteActivity.update({
      where: { id: activityId },
      data,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        siteEngineer: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, taskName: true } },
      },
    });
  },
};
