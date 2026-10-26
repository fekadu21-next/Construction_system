import { seProgressReportService } from "../../services/site-engineer/index.js";

export const seProgressReportController = {
  async getProgressReports(req, res, next) {
    try {
      const result = await seProgressReportService.getReports(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProgressReportById(req, res, next) {
    try {
      const report = await seProgressReportService.getReportById(req.params.reportId, req.userId);
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },

  async submitProgressReport(req, res, next) {
    try {
      const created = await seProgressReportService.submitReport(req.userId, req.body);
      res.status(201).json({
        success: true,
        message: "Progress report submitted successfully to Project Manager.",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  },
};
