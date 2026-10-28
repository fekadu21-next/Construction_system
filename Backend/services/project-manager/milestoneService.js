import { pmMilestoneRepository } from "../../repositories/project-manager/index.js";
import { pmProjectService } from "./projectService.js";

export const pmMilestoneService = {
  /**
   * Get milestones for project
   */
  async getProjectMilestones(projectId, managerId) {
    // Verify project belongs to manager
    await pmProjectService.getProjectDetails(projectId, managerId);
    return pmMilestoneRepository.findByProjectId(projectId, managerId);
  },

  /**
   * Update milestone progress or status
   */
  async updateMilestone(milestoneId, data, managerId) {
    const milestone = await pmMilestoneRepository.findById(milestoneId, managerId);
    if (!milestone) {
      const error = new Error("Milestone not found or does not belong to your project");
      error.statusCode = 403;
      throw error;
    }

    const updatePayload = {};
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.progressPercent !== undefined) {
      updatePayload.progressPercent = Math.min(100, Math.max(0, parseInt(data.progressPercent, 10) || 0));
    }
    if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);

    return pmMilestoneRepository.update(milestoneId, updatePayload);
  },
};
