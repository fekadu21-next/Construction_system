import { pmProjectRepository } from "../../repositories/project-manager/index.js";

export const pmProjectService = {
  /**
   * Get assigned projects with pagination & filters
   */
  async getAssignedProjects(managerId, params) {
    if (!managerId) {
      const error = new Error("Project Manager ID is required");
      error.statusCode = 401;
      throw error;
    }
    return pmProjectRepository.findAssignedProjects({
      managerId,
      ...params,
    });
  },

  /**
   * Get project details with authorization check
   */
  async getProjectDetails(projectId, managerId) {
    if (!projectId) {
      const error = new Error("Project ID is required");
      error.statusCode = 400;
      throw error;
    }

    const project = await pmProjectRepository.findProjectById(projectId, managerId);
    if (!project) {
      const error = new Error("Project not found or not assigned to your account");
      error.statusCode = 404;
      throw error;
    }

    return project;
  },
};
