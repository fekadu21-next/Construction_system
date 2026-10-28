import { pmDashboardService } from "../../services/project-manager/index.js";

export const pmDashboardController = {
  /**
   * GET /api/project-manager/dashboard
   */
  async getDashboard(req, res) {
    try {
      const managerId = req.userId;
      const data = await pmDashboardService.getOverview(managerId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("PM getDashboard error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to load Project Manager dashboard overview",
      });
    }
  },
};
