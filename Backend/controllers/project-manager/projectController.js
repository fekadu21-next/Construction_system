import { pmProjectService } from "../../services/project-manager/index.js";

export const pmProjectController = {
  /**
   * GET /api/project-manager/projects
   */
  async getProjects(req, res) {
    try {
      const managerId = req.userId;
      const { page, limit, search, status, sortBy, sortOrder } = req.query;

      const result = await pmProjectService.getAssignedProjects(managerId, {
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("PM getProjects error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch assigned projects",
      });
    }
  },

  /**
   * GET /api/project-manager/projects/:projectId
   */
  async getProjectById(req, res) {
    try {
      const managerId = req.userId;
      const { projectId } = req.params;

      const project = await pmProjectService.getProjectDetails(projectId, managerId);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("PM getProjectById error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch project details",
      });
    }
  },
};
