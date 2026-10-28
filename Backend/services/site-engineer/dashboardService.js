import { seDashboardRepository } from "../../repositories/site-engineer/index.js";

export const seDashboardService = {
  /**
   * Get complete dashboard overview for Site Engineer
   */
  async getDashboardOverview(engineerId) {
    return seDashboardRepository.getDashboardData(engineerId);
  },
};
