import { pmAiInsightsRepository } from "../../repositories/project-manager/index.js";

export const pmAiInsightsService = {
  async getAiInsights(managerId, query) {
    return pmAiInsightsRepository.getAiInsights(managerId, query);
  },
};
