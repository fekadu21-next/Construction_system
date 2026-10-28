import { seTaskService } from "../../services/site-engineer/index.js";

export const seTaskController = {
  async getTasks(req, res, next) {
    try {
      const result = await seTaskService.getTasks(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTaskById(req, res, next) {
    try {
      const task = await seTaskService.getTaskById(req.params.taskId, req.userId);
      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProgress(req, res, next) {
    try {
      const updated = await seTaskService.updateTaskProgress(req.params.taskId, req.userId, req.body);
      res.json({
        success: true,
        message: "Task progress updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
};
