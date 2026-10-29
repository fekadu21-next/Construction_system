import { seProjectRepository } from "../../repositories/site-engineer/index.js";

export const seProjectService = {
  /**
   * Get paginated assigned projects for Site Engineer
   */
  async getAssignedProjects(engineerId, query) {
    return seProjectRepository.findAssignedProjects({
      engineerId,
      ...query,
    });
  },

  /**
   * Get single project details ensuring assignment
   */
  async getProjectDetails(projectId, engineerId) {
    const project = await seProjectRepository.findProjectById(projectId, engineerId);
    if (!project) {
      const error = new Error("Project not found or you are not authorized to access this project.");
      error.statusCode = 404;
      throw error;
    }
    return project;
  },

  /**
   * Validate that project is assigned to engineer
   */
  async ensureProjectAssigned(projectId, engineerId) {
    const isAssigned = await seProjectRepository.isAssignedToEngineer(projectId, engineerId);
    if (!isAssigned) {
      const error = new Error("You are not assigned to this project.");
      error.statusCode = 403;
      throw error;
    }
    return true;
  },
};
