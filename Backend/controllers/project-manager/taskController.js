import { pmTaskService } from "../../services/project-manager/index.js";

export const pmTaskController = {
  /**
   * GET /api/project-manager/tasks
   */
  async getTasks(req, res) {
    try {
      const managerId = req.userId;
      const data = await pmTaskService.getTasks(managerId, req.query);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("PM getTasks error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch project tasks",
      });
    }
  },

  /**
   * GET /api/project-manager/tasks/assignees
   */
  async getAssignees(req, res) {
    try {
      const managerId = req.userId;
      const { projectId } = req.query;
      const data = await pmTaskService.getAssignees(managerId, projectId);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("PM getAssignees error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch task assignees",
      });
    }
  },

  /**
   * POST /api/project-manager/tasks
   */
  async createTask(req, res) {
    try {
      const managerId = req.userId;
      const task = await pmTaskService.createTask(managerId, req.body);
      res.status(201).json({
        success: true,
        message: "Task created and assigned successfully",
        data: task,
      });
    } catch (error) {
      console.error("PM createTask error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to create task",
      });
    }
  },

  /**
   * PATCH /api/project-manager/tasks/:taskId
   */
  async updateTask(req, res) {
    try {
      const managerId = req.userId;
      const { taskId } = req.params;
      const task = await pmTaskService.updateTask(managerId, taskId, req.body);
      res.json({
        success: true,
        message: "Task updated successfully",
        data: task,
      });
    } catch (error) {
      console.error("PM updateTask error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update task",
      });
    }
  },

  /**
   * DELETE /api/project-manager/tasks/:taskId
   */
  async deleteTask(req, res) {
    try {
      const managerId = req.userId;
      const { taskId } = req.params;
      const result = await pmTaskService.deleteTask(managerId, taskId);
      res.json({
        success: true,
        message: result.message || "Task deleted successfully",
      });
    } catch (error) {
      console.error("PM deleteTask error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to delete task",
      });
    }
  },
};
