import prisma from "../../config/prisma.js";

export const seMaterialRequestRepository = {
  /**
   * Find paginated material requests submitted by this Site Engineer
   */
  async findRequests(engineerId, { projectId, status, urgency, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      requestedById: engineerId,
      project: { archivedAt: null },
    };

    if (projectId && projectId !== "ALL") {
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
          project: {
            select: {
              id: true,
              projectName: true,
              projectCode: true,
              projectManager: { select: { id: true, fullName: true } },
            },
          },
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
   * Find single material request by ID
   */
  async findById(requestId, engineerId) {
    return prisma.materialRequest.findFirst({
      where: {
        id: requestId,
        ...(engineerId ? { requestedById: engineerId } : {}),
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
        requestedBy: { select: { id: true, fullName: true, email: true } },
        reviewedBy: { select: { id: true, fullName: true } },
        items: true,
      },
    });
  },

  /**
   * Create material request with nested items in a transaction
   */
  async create(data, items = []) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.materialRequest.create({
        data: {
          ...data,
          items: {
            create: items.map((it) => ({
              itemName: it.itemName,
              quantity: it.quantity,
              unit: it.unit,
              estimatedUnitCost: it.estimatedUnitCost || null,
            })),
          },
        },
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          items: true,
        },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          actorUserId: data.requestedById,
          action: "MATERIAL_REQUEST_SUBMITTED",
          entityType: "MaterialRequest",
          entityId: request.id,
          details: {
            requestNumber: request.requestNumber,
            projectId: request.projectId,
            itemCount: items.length,
          },
        },
      });

      return request;
    });
  },
};
