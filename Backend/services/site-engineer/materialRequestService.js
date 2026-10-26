import { seMaterialRequestRepository, seNotificationRepository } from "../../repositories/site-engineer/index.js";
import { seProjectService } from "./projectService.js";

export const seMaterialRequestService = {
  /**
   * Get material requests submitted by this engineer
   */
  async getMaterialRequests(engineerId, query) {
    return seMaterialRequestRepository.findRequests(engineerId, query);
  },

  /**
   * Get single material request detail
   */
  async getMaterialRequestById(requestId, engineerId) {
    const request = await seMaterialRequestRepository.findById(requestId, engineerId);
    if (!request) {
      const error = new Error("Material request not found or you are not authorized to view it.");
      error.statusCode = 404;
      throw error;
    }
    return request;
  },

  /**
   * Submit new material requisition
   */
  async submitMaterialRequest(engineerId, data) {
    const project = await seProjectService.getProjectDetails(data.projectId, engineerId);

    // Prepare items array
    let items = [];
    let requestedMaterialsSummary = "";

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      items = data.items.map((it) => ({
        itemName: it.itemName.trim(),
        quantity: Number(it.quantity),
        unit: it.unit.trim(),
        estimatedUnitCost: it.estimatedUnitCost ? Number(it.estimatedUnitCost) : null,
      }));
      requestedMaterialsSummary = items.map((it) => `${it.quantity} ${it.unit} ${it.itemName}`).join(", ");
    } else if (data.requestedMaterials) {
      requestedMaterialsSummary = data.requestedMaterials.trim();
      items = [
        {
          itemName: requestedMaterialsSummary,
          quantity: 1,
          unit: "Lot",
          estimatedUnitCost: data.totalEstimatedCost ? Number(data.totalEstimatedCost) : null,
        },
      ];
    }

    const totalEstimatedCost = items.reduce((acc, it) => {
      if (it.estimatedUnitCost && it.quantity) {
        return acc + it.estimatedUnitCost * it.quantity;
      }
      return acc;
    }, 0);

    const requestNumber = `MR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      requestNumber,
      projectId: data.projectId,
      requestedById: engineerId,
      requestedMaterials: requestedMaterialsSummary,
      totalEstimatedCost: totalEstimatedCost > 0 ? totalEstimatedCost : (data.totalEstimatedCost ? Number(data.totalEstimatedCost) : null),
      urgency: data.urgency || "NORMAL",
      status: "PENDING",
      justification: data.justification ? data.justification.trim() : null,
      deliveryLocation: data.deliveryLocation ? data.deliveryLocation.trim() : null,
    };

    const createdRequest = await seMaterialRequestRepository.create(payload, items);

    // Notify PM if project has PM assigned
    if (project.projectManagerId) {
      await seNotificationRepository.createNotification({
        recipientUserId: project.projectManagerId,
        recipientRole: "PROJECT_MANAGER",
        title: `Material Request: ${requestNumber}`,
        message: `Site Engineer submitted requisition for '${requestedMaterialsSummary.slice(0, 50)}...' on ${project.projectName}.`,
        type: "WARNING",
        category: "MATERIAL_REQUESTS",
        link: "/project-manager/material-requests",
        isRead: false,
      }).catch((err) => console.warn("Failed to create PM notification for material request:", err.message));
    }

    return createdRequest;
  },
};
