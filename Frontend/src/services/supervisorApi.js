import api from "./api.js";

export const supervisorApi = {
  async getDashboard() {
    try {
      const response = await api.get("/api/supervisor/dashboard");
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load supervisor dashboard" };
    }
  },

  async getProjects() {
    try {
      const response = await api.get("/api/supervisor/projects");
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load assigned projects" };
    }
  },

  async getProjectWorkers(projectId) {
    try {
      const response = await api.get(`/api/supervisor/projects/${projectId}/workers`);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load project workers" };
    }
  },

  async addDailyWorker(projectId, data) {
    try {
      const response = await api.post(`/api/supervisor/projects/${projectId}/workers`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to add daily worker" };
    }
  },

  async getAttendance(projectId, date) {
    try {
      const response = await api.get("/api/supervisor/attendance", { params: { projectId, date } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load attendance roster" };
    }
  },

  async saveAttendance(data) {
    try {
      const response = await api.post("/api/supervisor/attendance", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to save attendance" };
    }
  },

  async submitAttendance(data) {
    try {
      const response = await api.post("/api/supervisor/attendance/submit", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to submit attendance" };
    }
  },

  async requestCorrection(data) {
    try {
      const response = await api.post("/api/supervisor/attendance/request-correction", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to request correction" };
    }
  },

  async getTasks(projectId) {
    try {
      const response = await api.get("/api/supervisor/tasks", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load site tasks" };
    }
  },

  async updateTaskProgress(taskId, data) {
    try {
      const response = await api.patch(`/api/supervisor/tasks/${taskId}/progress`, data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to update task progress" };
    }
  },

  async getDailyActivities(projectId, date) {
    try {
      const response = await api.get("/api/supervisor/daily-reports", { params: { projectId, date } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load daily activities" };
    }
  },

  async recordDailyActivity(data) {
    try {
      const response = await api.post("/api/supervisor/daily-reports", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to record daily activity" };
    }
  },

  async getMaterials() {
    try {
      const response = await api.get("/api/supervisor/materials");
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load materials" };
    }
  },

  async getMaterialRequests(projectId) {
    try {
      const response = await api.get("/api/supervisor/material-requests", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load material requests" };
    }
  },

  async createMaterialRequest(data) {
    try {
      const response = await api.post("/api/supervisor/material-requests", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to submit material request" };
    }
  },

  async getIncidents(projectId) {
    try {
      const response = await api.get("/api/supervisor/incidents", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load site incidents" };
    }
  },

  async reportIncident(data) {
    try {
      const response = await api.post("/api/supervisor/incidents", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to report incident" };
    }
  },

  async resolveIncident(id, data) {
    try {
      const response = await api.patch(`/api/supervisor/incidents/${id}/resolve`, data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to resolve incident" };
    }
  },
};
