import { pmAiInsightsService } from "../../services/project-manager/index.js";

export const pmAiInsightsController = {
  /**
   * GET /api/project-manager/ai-insights
   */
  async getAiInsights(req, res) {
    try {
      const managerId = req.userId;
      const data = await pmAiInsightsService.getAiInsights(managerId, req.query);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("PM getAiInsights error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to generate AI insights",
      });
    }
  },
};
