import { pmReportService } from "../../services/project-manager/index.js";

export const pmReportController = {
  /**
   * GET /api/project-manager/reports
   */
  async getReports(req, res) {
    try {
      const managerId = req.userId;
      const reports = await pmReportService.getPerformanceReports(managerId);

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error("PM getReports error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch performance analytics",
      });
    }
  },
};
