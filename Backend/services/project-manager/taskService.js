import { pmTaskRepository } from "../../repositories/project-manager/index.js";

export const pmTaskService = {
  async getTasks(managerId, query) {
    return pmTaskRepository.getTasks(managerId, query);
  },

  async getAssignees(managerId, projectId) {
    return pmTaskRepository.getAssignees(managerId, projectId);
  },

  async createTask(managerId, taskData) {
    if (!taskData.projectId) {
      const error = new Error("Project ID is required to create a task.");
      error.statusCode = 400;
      throw error;
    }
    if (!taskData.taskName || !taskData.taskName.trim()) {
      const error = new Error("Task name is required.");
      error.statusCode = 400;
      throw error;
    }
    return pmTaskRepository.createTask(managerId, taskData);
  },

  async updateTask(managerId, taskId, updateData) {
    if (!taskId) {
      const error = new Error("Task ID is required.");
      error.statusCode = 400;
      throw error;
    }
    return pmTaskRepository.updateTask(managerId, taskId, updateData);
  },

  async deleteTask(managerId, taskId) {
    if (!taskId) {
      const error = new Error("Task ID is required.");
      error.statusCode = 400;
      throw error;
    }
    return pmTaskRepository.deleteTask(managerId, taskId);
  },
};
