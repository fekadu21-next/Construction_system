import { seProjectService } from "../../services/site-engineer/index.js";

export const seProjectController = {
  async getProjects(req, res, next) {
    try {
      const result = await seProjectService.getAssignedProjects(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProjectById(req, res, next) {
    try {
      const project = await seProjectService.getProjectDetails(req.params.projectId, req.userId);
      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },
};
