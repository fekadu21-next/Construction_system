import prisma from "../../config/prisma.js";

export const pmMaterialRequestRepository = {
  /**
   * Retrieve material requests for assigned projects
   */
  async findRequests(managerId, { projectId, status, urgency, page = 1, limit = 10 }) {
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

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (urgency && urgency !== "ALL") {
      where.urgency = urgency;
    }

    const [requests, total] = await Promise.all([
      prisma.materialRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          requestedBy: { select: { id: true, fullName: true, email: true } },
          reviewedBy: { select: { id: true, fullName: true } },
          items: true,
        },
      }),
      prisma.materialRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Get single material request with project validation
   */
  async findById(requestId) {
    return prisma.materialRequest.findUnique({
      where: { id: requestId },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true, projectManagerId: true } },
        requestedBy: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true } },
        items: true,
      },
    });
  },

  /**
   * Approve or reject a material request with audit logging in a Prisma transaction
   */
  async recordDecision(requestId, managerId, decision, reviewNotes = "") {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.materialRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          reviewedById: managerId,
          reviewedAt: new Date(),
          reviewNotes,
        },
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          requestedBy: { select: { id: true, fullName: true, email: true } },
          items: true,
        },
      });

      // Write audit log entry
      await tx.auditLog.create({
        data: {
          actorUserId: managerId,
          action: decision === "APPROVED" ? "MATERIAL_REQUEST_APPROVED" : "MATERIAL_REQUEST_REJECTED",
          entityType: "MaterialRequest",
          entityId: requestId,
          details: {
            requestNumber: updated.requestNumber,
            projectId: updated.projectId,
            decision,
            reviewNotes,
            totalEstimatedCost: updated.totalEstimatedCost ? updated.totalEstimatedCost.toString() : null,
          },
        },
      });

      return updated;
    });
  },
};
