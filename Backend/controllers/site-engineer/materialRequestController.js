import { seMaterialRequestService } from "../../services/site-engineer/index.js";

export const seMaterialRequestController = {
  async getMaterialRequests(req, res, next) {
    try {
      const result = await seMaterialRequestService.getMaterialRequests(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMaterialRequestById(req, res, next) {
    try {
      const request = await seMaterialRequestService.getMaterialRequestById(req.params.requestId, req.userId);
      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  },

  async submitMaterialRequest(req, res, next) {
    try {
      const created = await seMaterialRequestService.submitMaterialRequest(req.userId, req.body);
      res.status(201).json({
        success: true,
        message: `Material requisition ${created.requestNumber} submitted successfully.`,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  },
};
