import { seTaskRepository } from "../../repositories/site-engineer/index.js";

export const seTaskService = {
  /**
   * Get paginated assigned tasks with filters
   */
  async getTasks(engineerId, query) {
    return seTaskRepository.findAssignedTasks(engineerId, query);
  },

  /**
   * Get single task details ensuring assignment
   */
  async getTaskById(taskId, engineerId) {
    const task = await seTaskRepository.findById(taskId, engineerId);
    if (!task) {
      const error = new Error("Task not found or not assigned to you.");
      error.statusCode = 404;
      throw error;
    }
    return task;
  },

  /**
   * Update task progress & status
   */
  async updateTaskProgress(taskId, engineerId, data) {
    const existingTask = await this.getTaskById(taskId, engineerId);

    const updatePayload = {};

    if (data.progressPercent !== undefined) {
      updatePayload.progressPercent = Math.min(100, Math.max(0, parseInt(data.progressPercent, 10) || 0));
    }

    if (data.status !== undefined) {
      updatePayload.status = data.status;
      if (data.status === "COMPLETED") {
        updatePayload.progressPercent = 100;
        updatePayload.completedAt = new Date();
      } else if (existingTask.status === "COMPLETED" && data.status !== "COMPLETED") {
        updatePayload.completedAt = null;
      }
    } else if (updatePayload.progressPercent === 100) {
      updatePayload.status = "COMPLETED";
      updatePayload.completedAt = new Date();
    }

    if (data.completionNotes !== undefined) {
      updatePayload.completionNotes = data.completionNotes;
    }

    if (data.issues !== undefined) {
      updatePayload.issues = data.issues;
    }

    return seTaskRepository.updateProgress(taskId, updatePayload);
  },
};
