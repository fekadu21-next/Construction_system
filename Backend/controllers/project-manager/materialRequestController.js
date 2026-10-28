import { pmMaterialRequestService } from "../../services/project-manager/index.js";

export const pmMaterialRequestController = {
  /**
   * GET /api/project-manager/material-requests
   */
  async getMaterialRequests(req, res) {
    try {
      const managerId = req.userId;
      const { projectId, status, urgency, page, limit } = req.query;

      const result = await pmMaterialRequestService.getRequests(managerId, {
        projectId,
        status,
        urgency,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("PM getMaterialRequests error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch material requests",
      });
    }
  },

  /**
   * PATCH /api/project-manager/material-requests/:requestId/approve
   */
  async approveMaterialRequest(req, res) {
    try {
      const managerId = req.userId;
      const { requestId } = req.params;
      const { reviewNotes } = req.body || {};

      const approved = await pmMaterialRequestService.approveRequest(requestId, managerId, reviewNotes);

      res.json({
        success: true,
        message: `Material request ${approved.requestNumber} approved successfully`,
        data: approved,
      });
    } catch (error) {
      console.error("PM approveMaterialRequest error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to approve material request",
      });
    }
  },

  /**
   * PATCH /api/project-manager/material-requests/:requestId/reject
   */
  async rejectMaterialRequest(req, res) {
    try {
      const managerId = req.userId;
      const { requestId } = req.params;
      const { reviewNotes } = req.body || {};

      const rejected = await pmMaterialRequestService.rejectRequest(requestId, managerId, reviewNotes);

      res.json({
        success: true,
        message: `Material request ${rejected.requestNumber} rejected`,
        data: rejected,
      });
    } catch (error) {
      console.error("PM rejectMaterialRequest error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to reject material request",
      });
    }
  },
};
