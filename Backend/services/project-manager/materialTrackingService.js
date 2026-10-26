import { pmMaterialTrackingRepository } from "../../repositories/project-manager/index.js";

export const pmMaterialTrackingService = {
  async getMaterialTracking(managerId, query) {
    return pmMaterialTrackingRepository.getMaterialTracking(managerId, query);
  },
};
