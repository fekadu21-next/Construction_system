import { seDashboardService } from "../../services/site-engineer/index.js";

export const seDashboardController = {
  async getDashboard(req, res, next) {
    try {
      const data = await seDashboardService.getDashboardOverview(req.userId);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
