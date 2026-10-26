import prisma from "../../config/prisma.js";

export const pmProjectRepository = {
  /**
   * Find paginated projects assigned to the project manager
   */
  async findAssignedProjects({
    managerId,
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
      projectManagerId: managerId,
      archivedAt: null,
    };

    if (status && status.trim() && status !== "ALL") {
      where.status = status.trim();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { projectName: { contains: q, mode: "insensitive" } },
        { projectCode: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const allowedSort = ["projectName", "projectCode", "startDate", "endDate", "budget", "status", "createdAt"];
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
            select: { id: true, fullName: true, email: true, profilePhotoUrl: true, phone: true },
          },
          milestones: {
            select: { id: true, milestoneName: true, dueDate: true, status: true, progressPercent: true },
          },
          expenses: {
            select: { id: true, amount: true, category: true, expenseDate: true },
          },
          _count: {
            select: { milestones: true, progressReports: true, materialRequests: true },
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
   * Find a specific project ensuring it belongs to the manager
   */
  async findProjectById(projectId, managerId) {
    const where = {
      id: projectId,
      archivedAt: null,
    };

    if (managerId) {
      where.projectManagerId = managerId;
    }

    return prisma.project.findFirst({
      where,
      include: {
        projectManager: {
          select: { id: true, fullName: true, email: true, profilePhotoUrl: true, phone: true },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
          include: {
            assignedEngineer: { select: { id: true, fullName: true, email: true } },
          },
        },
        progressReports: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            siteEngineer: { select: { id: true, fullName: true, email: true } },
          },
        },
        materialRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            requestedBy: { select: { id: true, fullName: true, email: true } },
            items: true,
          },
        },
        expenses: {
          orderBy: { expenseDate: "desc" },
        },
      },
    });
  },
};
