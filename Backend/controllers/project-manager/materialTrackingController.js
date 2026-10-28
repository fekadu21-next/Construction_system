import { pmMaterialTrackingService } from "../../services/project-manager/index.js";

export const pmMaterialTrackingController = {
  /**
   * GET /api/project-manager/material-tracking
   */
  async getMaterialTracking(req, res) {
    try {
      const managerId = req.userId;
      const data = await pmMaterialTrackingService.getMaterialTracking(managerId, req.query);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("PM getMaterialTracking error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch material usage and tracking data",
      });
    }
  },
};
