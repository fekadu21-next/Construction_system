import prisma from "../../config/prisma.js";

export const pmProgressReportRepository = {
  /**
   * Retrieve progress reports for assigned projects with pagination & filters
   */
  async findReports(managerId, { projectId, reviewStatus, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      project: {
        projectManagerId: managerId,
        archivedAt: null,
      },
    };

    if (projectId) {
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
          project: { select: { id: true, projectName: true, projectCode: true } },
          siteEngineer: { select: { id: true, fullName: true, email: true, phone: true } },
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
   * Find report by ID ensuring manager owns the project
   */
  async findById(reportId, managerId) {
    return prisma.progressReport.findFirst({
      where: {
        id: reportId,
        project: managerId ? { projectManagerId: managerId, archivedAt: null } : { archivedAt: null },
      },
      include: {
        project: { select: { id: true, projectName: true, projectManagerId: true } },
      },
    });
  },

  /**
   * Mark report as reviewed with notes
   */
  async updateReview(reportId, managerId, reviewerNotes = "") {
    return prisma.progressReport.update({
      where: { id: reportId },
      data: {
        reviewStatus: "REVIEWED",
        reviewedById: managerId,
        reviewedAt: new Date(),
        reviewerNotes,
      },
      include: {
        project: { select: { id: true, projectName: true } },
        siteEngineer: { select: { id: true, fullName: true } },
      },
    });
  },
};
