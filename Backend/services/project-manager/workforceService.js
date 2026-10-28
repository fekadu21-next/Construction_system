import { pmWorkforceRepository } from "../../repositories/project-manager/index.js";

export const pmWorkforceService = {
  async getWorkforce(managerId, query) {
    return pmWorkforceRepository.getWorkforce(managerId, query);
  },
};
