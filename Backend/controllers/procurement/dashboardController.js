import { dashboardService } from "../../services/procurement/dashboardService.js";

export const dashboardController = {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await dashboardService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dashboard stats",
      });
    }
  },
};
