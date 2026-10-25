import { dashboardService } from "../services/dashboardService.js";

export const dashboardController = {
  async getDashboardMetrics(req, res, next) {
    try {
      const metrics = await dashboardService.getDashboardMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Get dashboard metrics error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch dashboard metrics. Please try again.",
      });
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, action, entityType, sortBy, sortOrder } = req.query;

      const result = await dashboardService.getAuditLogs({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        action: action || "",
        entityType: entityType || "",
        sortBy: sortBy || "createdAt",
        sortOrder: sortOrder || "desc",
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch audit logs. Please try again.",
      });
    }
  },
};
