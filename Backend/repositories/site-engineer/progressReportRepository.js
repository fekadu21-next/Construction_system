import prisma from "../../config/prisma.js";

export const seProgressReportRepository = {
  /**
   * Find paginated progress reports submitted by or for assigned projects
   */
  async findReports(engineerId, { projectId, reviewStatus, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      siteEngineerId: engineerId,
      project: { archivedAt: null },
    };

    if (projectId && projectId !== "ALL") {
      where.projectId = projectId;
    }

    if (reviewStatus && reviewStatus !== "ALL") {
      where.reviewStatus = reviewStatus;
    }

    const [reports, total] = await Promise.all([
      prisma.progressReport.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          project: {
            select: {
              id: true,
              projectName: true,
              projectCode: true,
              projectManager: { select: { id: true, fullName: true } },
            },
          },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.progressReport.count({ where }),
    ]);

    return {
      reports,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Find single progress report by ID
   */
  async findById(reportId, engineerId) {
    return prisma.progressReport.findFirst({
      where: {
        id: reportId,
        ...(engineerId ? { siteEngineerId: engineerId } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
            projectManager: { select: { id: true, fullName: true, email: true } },
          },
        },
        siteEngineer: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });
  },

  /**
   * Create progress report
   */
  async create(data) {
    return prisma.progressReport.create({
      data,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        siteEngineer: { select: { id: true, fullName: true } },
      },
    });
  },
};
