import { seProgressReportRepository, seNotificationRepository } from "../../repositories/site-engineer/index.js";
import { seProjectService } from "./projectService.js";

export const seProgressReportService = {
  /**
   * Get progress reports
   */
  async getReports(engineerId, query) {
    return seProgressReportRepository.findReports(engineerId, query);
  },

  /**
   * Get report details
   */
  async getReportById(reportId, engineerId) {
    const report = await seProgressReportRepository.findById(reportId, engineerId);
    if (!report) {
      const error = new Error("Progress report not found or you are not authorized to view it.");
      error.statusCode = 404;
      throw error;
    }
    return report;
  },

  /**
   * Submit new progress report
   */
  async submitReport(engineerId, data) {
    const project = await seProjectService.getProjectDetails(data.projectId, engineerId);

    const payload = {
      projectId: data.projectId,
      siteEngineerId: engineerId,
      reportTitle: data.reportTitle.trim(),
      workCompleted: data.workCompleted.trim(),
      reportedProgress: data.reportedProgress.trim(),
      issuesOrDelays: data.issuesOrDelays ? data.issuesOrDelays.trim() : null,
      weatherConditions: data.weatherConditions ? data.weatherConditions.trim() : null,
      laborCount: data.laborCount ? parseInt(data.laborCount, 10) : null,
      equipmentActive: data.equipmentActive ? data.equipmentActive.trim() : null,
      photosAttached: data.photosAttached ? parseInt(data.photosAttached, 10) : 0,
      reviewStatus: "PENDING_REVIEW",
    };

    const createdReport = await seProgressReportRepository.create(payload);

    // Notify Project Manager if assigned
    if (project.projectManagerId) {
      await seNotificationRepository.createNotification({
        recipientUserId: project.projectManagerId,
        recipientRole: "PROJECT_MANAGER",
        title: `New Progress Report: ${project.projectName}`,
        message: `Site Engineer submitted report '${payload.reportTitle}'. Review requested.`,
        type: "INFO",
        category: "PROGRESS_REPORTS",
        link: "/project-manager/progress-reports",
        isRead: false,
      }).catch((err) => console.warn("Failed to create PM notification for report:", err.message));
    }

    return createdReport;
  },
};
