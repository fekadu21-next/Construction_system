import { pmBudgetService } from "../../services/project-manager/index.js";

export const pmBudgetController = {
  /**
   * GET /api/project-manager/budget
   */
  async getBudget(req, res) {
    try {
      const managerId = req.userId;
      const { projectId, category, startDate, endDate, page, limit } = req.query;

      const result = await pmBudgetService.getBudgetAndExpenses(managerId, {
        projectId,
        category,
        startDate,
        endDate,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("PM getBudget error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch budget metrics and expense ledger",
      });
    }
  },
};
