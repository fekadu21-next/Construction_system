import { seActivityService } from "../../services/site-engineer/index.js";

export const seActivityController = {
  async getActivities(req, res, next) {
    try {
      const result = await seActivityService.getActivities(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getActivityById(req, res, next) {
    try {
      const activity = await seActivityService.getActivityById(req.params.activityId, req.userId);
      res.json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  },

  async createActivity(req, res, next) {
    try {
      const created = await seActivityService.createActivity(req.userId, req.body);
      res.status(201).json({
        success: true,
        message: "Daily site activity recorded successfully.",
        data: created,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateActivity(req, res, next) {
    try {
      const updated = await seActivityService.updateActivity(req.params.activityId, req.userId, req.body);
      res.json({
        success: true,
        message: "Daily site activity updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
};
