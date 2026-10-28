import { pmProgressReportService } from "../../services/project-manager/index.js";

export const pmProgressReportController = {
  /**
   * GET /api/project-manager/progress-reports
   */
  async getProgressReports(req, res) {
    try {
      const managerId = req.userId;
      const { projectId, reviewStatus, page, limit } = req.query;

      const reports = await pmProgressReportService.getReports(managerId, {
        projectId,
        reviewStatus,
        page,
        limit,
      });

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error("PM getProgressReports error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch progress reports",
      });
    }
  },

  /**
   * PATCH /api/project-manager/progress-reports/:reportId/review
   */
  async reviewProgressReport(req, res) {
    try {
      const managerId = req.userId;
      const { reportId } = req.params;
      const { reviewerNotes } = req.body || {};

      const reviewed = await pmProgressReportService.reviewReport(reportId, managerId, reviewerNotes);

      res.json({
        success: true,
        message: "Progress report reviewed and acknowledged",
        data: reviewed,
      });
    } catch (error) {
      console.error("PM reviewProgressReport error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to review progress report",
      });
    }
  },
};
