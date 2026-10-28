import { aiService } from "../services/aiService.js";

export const aiController = {
  async getCostPrediction(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await aiService.getCostPrediction(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getDelayPrediction(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await aiService.getDelayPrediction(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getWorkforceUtilization(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await aiService.getWorkforceUtilization(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAllInsights(req, res, next) {
    try {
      const data = await aiService.getAllInsights();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
