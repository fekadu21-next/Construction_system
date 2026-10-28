import { pmDashboardRepository, pmBudgetRepository } from "../../repositories/project-manager/index.js";

export const pmBudgetService = {
  /**
   * Get budget overview and expense ledger
   */
  async getBudgetAndExpenses(managerId, filters) {
    if (!managerId) {
      const error = new Error("Project Manager ID is required");
      error.statusCode = 401;
      throw error;
    }

    const [overview, expenses] = await Promise.all([
      pmDashboardRepository.getMetrics(managerId),
      pmBudgetRepository.findExpenses(managerId, filters),
    ]);

    return {
      budgetSummary: overview.budgetOverview,
      expenseLedger: expenses,
    };
  },
};
