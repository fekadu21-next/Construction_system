import prisma from "../../config/prisma.js";

export const seProjectRepository = {
  /**
   * Filter condition to find projects assigned to this Site Engineer
   */
  getAssignmentFilter(engineerId) {
    return {
      archivedAt: null,
      OR: [
        { siteEngineerId: engineerId },
        { milestones: { some: { assignedEngineerId: engineerId } } },
        { tasks: { some: { assignedToId: engineerId } } },
      ],
    };
  },

  /**
   * Check if a specific project is assigned to this Site Engineer
   */
  async isAssignedToEngineer(projectId, engineerId) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...this.getAssignmentFilter(engineerId),
      },
      select: { id: true },
    });
    return Boolean(project);
  },

  /**
   * Find paginated projects assigned to the Site Engineer
   */
  async findAssignedProjects({
    engineerId,
    page = 1,
    limit = 10,
    search = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      ...this.getAssignmentFilter(engineerId),
    };

    if (status && status.trim() && status !== "ALL") {
      where.status = status.trim();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { projectName: { contains: q, mode: "insensitive" } },
            { projectCode: { contains: q, mode: "insensitive" } },
            { location: { contains: q, mode: "insensitive" } },
          ],
        },
      ];
    }

    const allowedSort = ["projectName", "projectCode", "startDate", "endDate", "status", "createdAt"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const orderDirection = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: orderDirection },
        include: {
          projectManager: {
            select: { id: true, fullName: true, email: true, phone: true, profilePhotoUrl: true },
          },
          milestones: {
            orderBy: { dueDate: "asc" },
            select: { id: true, milestoneName: true, dueDate: true, status: true, progressPercent: true },
          },
          tasks: {
            where: { assignedToId: engineerId },
            select: { id: true, taskName: true, priority: true, status: true, progressPercent: true, dueDate: true },
          },
          _count: {
            select: {
              tasks: true,
              dailyActivities: true,
              progressReports: true,
              materialRequests: true,
              employees: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Find single project by ID ensuring engineer is assigned
   */
  async findProjectById(projectId, engineerId) {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        ...this.getAssignmentFilter(engineerId),
      },
      include: {
        projectManager: {
          select: { id: true, fullName: true, email: true, phone: true, profilePhotoUrl: true },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
          include: {
            assignedEngineer: { select: { id: true, fullName: true, email: true } },
          },
        },
        tasks: {
          where: { assignedToId: engineerId },
          orderBy: { dueDate: "asc" },
        },
        employees: {
          where: { status: "ACTIVE" },
          select: { id: true, employeeCode: true, fullName: true, trade: true, employmentType: true, phone: true },
        },
        _count: {
          select: {
            tasks: true,
            dailyActivities: true,
            progressReports: true,
            materialRequests: true,
            employees: true,
          },
        },
      },
    });
  },
};
