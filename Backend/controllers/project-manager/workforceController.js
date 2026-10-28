import { pmWorkforceService } from "../../services/project-manager/index.js";

export const pmWorkforceController = {
  /**
   * GET /api/project-manager/workforce
   */
  async getWorkforce(req, res) {
    try {
      const managerId = req.userId;
      const data = await pmWorkforceService.getWorkforce(managerId, req.query);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("PM getWorkforce error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch workforce overview",
      });
    }
  },
};
