import { pmProgressReportRepository } from "../../repositories/project-manager/index.js";

export const pmProgressReportService = {
  /**
   * Retrieve progress reports
   */
  async getReports(managerId, filters) {
    if (!managerId) {
      const error = new Error("Project Manager ID is required");
      error.statusCode = 401;
      throw error;
    }
    return pmProgressReportRepository.findReports(managerId, filters);
  },

  /**
   * Review or acknowledge progress report
   */
  async reviewReport(reportId, managerId, reviewerNotes = "") {
    const report = await pmProgressReportRepository.findById(reportId, managerId);
    if (!report) {
      const error = new Error("Progress report not found or does not belong to your assigned project");
      error.statusCode = 403;
      throw error;
    }

    return pmProgressReportRepository.updateReview(reportId, managerId, reviewerNotes);
  },
};
