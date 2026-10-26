import prisma from "../../config/prisma.js";

export const seTaskRepository = {
  /**
   * Find paginated tasks assigned to the Site Engineer
   */
  async findAssignedTasks(engineerId, { projectId, status, priority, search, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      assignedToId: engineerId,
      project: { archivedAt: null },
    };

    if (projectId && projectId !== "ALL") {
      where.projectId = projectId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { taskName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          milestone: { select: { id: true, milestoneName: true, dueDate: true, status: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Find single task by ID ensuring it is assigned to this Site Engineer
   */
  async findById(taskId, engineerId) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        ...(engineerId ? { assignedToId: engineerId } : {}),
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true, location: true } },
        milestone: { select: { id: true, milestoneName: true, dueDate: true, status: true } },
      },
    });
  },

  /**
   * Update task progress, status, and completion notes
   */
  async updateProgress(taskId, updateData) {
    return prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        milestone: { select: { id: true, milestoneName: true } },
      },
    });
  },
};
