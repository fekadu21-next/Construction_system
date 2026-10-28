import { pmMaterialRequestRepository } from "../../repositories/project-manager/index.js";

export const pmMaterialRequestService = {
  /**
   * Retrieve material requests
   */
  async getRequests(managerId, filters) {
    if (!managerId) {
      const error = new Error("Project Manager ID is required");
      error.statusCode = 401;
      throw error;
    }
    return pmMaterialRequestRepository.findRequests(managerId, filters);
  },

  /**
   * Approve material request
   */
  async approveRequest(requestId, managerId, reviewNotes = "") {
    const request = await pmMaterialRequestRepository.findById(requestId);
    if (!request) {
      const error = new Error("Material request not found");
      error.statusCode = 404;
      throw error;
    }

    if (request.project.projectManagerId !== managerId) {
      const error = new Error("Unauthorized: Request does not belong to your assigned project");
      error.statusCode = 403;
      throw error;
    }

    if (request.status === "APPROVED") {
      const error = new Error("Material request is already approved");
      error.statusCode = 400;
      throw error;
    }

    return pmMaterialRequestRepository.recordDecision(requestId, managerId, "APPROVED", reviewNotes);
  },

  /**
   * Reject material request
   */
  async rejectRequest(requestId, managerId, reviewNotes = "") {
    const request = await pmMaterialRequestRepository.findById(requestId);
    if (!request) {
      const error = new Error("Material request not found");
      error.statusCode = 404;
      throw error;
    }

    if (request.project.projectManagerId !== managerId) {
      const error = new Error("Unauthorized: Request does not belong to your assigned project");
      error.statusCode = 403;
      throw error;
    }

    if (request.status === "REJECTED") {
      const error = new Error("Material request is already rejected");
      error.statusCode = 400;
      throw error;
    }

    return pmMaterialRequestRepository.recordDecision(requestId, managerId, "REJECTED", reviewNotes);
  },
};
