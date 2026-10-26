import { pmDashboardRepository } from "../../repositories/project-manager/index.js";

export const pmDashboardService = {
  /**
   * Get full dashboard overview
   */
  async getOverview(managerId) {
    if (!managerId) {
      const error = new Error("Project Manager ID is required");
      error.statusCode = 401;
      throw error;
    }
    return pmDashboardRepository.getMetrics(managerId);
  },
};
