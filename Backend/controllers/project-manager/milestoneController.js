import { pmMilestoneService } from "../../services/project-manager/index.js";

export const pmMilestoneController = {
  /**
   * GET /api/project-manager/projects/:projectId/milestones
   */
  async getMilestones(req, res) {
    try {
      const managerId = req.userId;
      const { projectId } = req.params;

      const milestones = await pmMilestoneService.getProjectMilestones(projectId, managerId);

      res.json({
        success: true,
        data: milestones,
      });
    } catch (error) {
      console.error("PM getMilestones error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch project milestones",
      });
    }
  },

  /**
   * PATCH /api/project-manager/milestones/:milestoneId
   */
  async updateMilestone(req, res) {
    try {
      const managerId = req.userId;
      const { milestoneId } = req.params;
      const data = req.body;

      const updated = await pmMilestoneService.updateMilestone(milestoneId, data, managerId);

      res.json({
        success: true,
        message: "Milestone updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("PM updateMilestone error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update milestone",
      });
    }
  },
};
