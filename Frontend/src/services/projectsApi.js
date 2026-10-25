import api from "./api.js";

export const projectsApi = {
  async getProjects(params = {}) {
    try {
      const response = await api.get("/api/projects", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch projects";
      return { success: false, error: message };
    }
  },

  async getMetrics() {
    try {
      const response = await api.get("/api/projects/metrics");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch project metrics";
      return { success: false, error: message };
    }
  },

  async getNextProjectCode() {
    try {
      const response = await api.get("/api/projects/next-code");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to generate project code";
      return { success: false, error: message };
    }
  },

  async getProjectById(id) {
    try {
      const response = await api.get(`/api/projects/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch project";
      return { success: false, error: message };
    }
  },

  async createProject(data) {
    try {
      const response = await api.post("/api/projects", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create project";
      return { success: false, error: message };
    }
  },

  async updateProject(id, data) {
    try {
      const response = await api.patch(`/api/projects/${id}`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update project";
      return { success: false, error: message };
    }
  },

  async assignManager(id, projectManagerId) {
    try {
      const response = await api.patch(`/api/projects/${id}/manager`, { projectManagerId });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to assign manager";
      return { success: false, error: message };
    }
  },

  async updateProjectStatus(id, status) {
    try {
      const response = await api.patch(`/api/projects/${id}/status`, { status });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update project status";
      return { success: false, error: message };
    }
  },

  async archiveProject(id) {
    try {
      const response = await api.patch(`/api/projects/${id}/archive`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to archive project";
      return { success: false, error: message };
    }
  },

  async deleteProject(id) {
    try {
      const response = await api.delete(`/api/projects/${id}`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete project";
      return { success: false, error: message };
    }
  },
};
