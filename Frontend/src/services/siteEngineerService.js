import api from "./api.js";

export const siteEngineerService = {
  /**
   * Fetch complete Site Engineer dashboard overview
   * GET /api/site-engineer/dashboard
   */
  async getDashboardOverview() {
    try {
      const response = await api.get("/api/site-engineer/dashboard");
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          isLive: true,
        };
      }
    } catch (apiError) {
      console.warn("Site Engineer dashboard API fetch failed:", apiError?.message);
    }

    return {
      success: false,
      error: "Unable to load dashboard data. Please check backend connection.",
    };
  },

  /**
   * Fetch assigned projects
   * GET /api/site-engineer/projects
   */
  async getProjects(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/projects", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Get projects error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load projects",
      };
    }
  },

  /**
   * Fetch single project details
   * GET /api/site-engineer/projects/:projectId
   */
  async getProjectById(projectId) {
    try {
      const response = await api.get(`/api/site-engineer/projects/${projectId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load project details",
      };
    }
  },

  /**
   * Fetch eligible workers assigned to project
   * GET /api/site-engineer/projects/:projectId/workers
   */
  async getProjectWorkers(projectId) {
    try {
      const response = await api.get(`/api/site-engineer/projects/${projectId}/workers`);
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load project workers",
      };
    }
  },

  /**
   * Fetch assigned tasks
   * GET /api/site-engineer/tasks
   */
  async getTasks(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/tasks", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load tasks",
      };
    }
  },

  /**
   * Update task progress & status
   * PATCH /api/site-engineer/tasks/:taskId/progress
   */
  async updateTaskProgress(taskId, payload) {
    try {
      const response = await api.patch(`/api/site-engineer/tasks/${taskId}/progress`, payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update task progress",
      };
    }
  },

  /**
   * Fetch daily site activities
   * GET /api/site-engineer/activities
   */
  async getActivities(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/activities", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load activities",
      };
    }
  },

  /**
   * Create daily site activity
   * POST /api/site-engineer/activities
   */
  async createActivity(payload) {
    try {
      const response = await api.post("/api/site-engineer/activities", payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to record daily site activity",
      };
    }
  },

  /**
   * Fetch attendance records
   * GET /api/site-engineer/attendance
   */
  async getAttendance(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/attendance", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load attendance records",
      };
    }
  },

  /**
   * Record attendance
   * POST /api/site-engineer/attendance
   */
  async recordAttendance(payload) {
    try {
      const response = await api.post("/api/site-engineer/attendance", payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: error.response?.status,
        error: error.response?.data?.message || "Failed to record attendance",
      };
    }
  },

  /**
   * Correct attendance record
   * PATCH /api/site-engineer/attendance/:attendanceId
   */
  async updateAttendance(attendanceId, payload) {
    try {
      const response = await api.patch(`/api/site-engineer/attendance/${attendanceId}`, payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update attendance record",
      };
    }
  },

  /**
   * Fetch progress reports
   * GET /api/site-engineer/progress-reports
   */
  async getProgressReports(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/progress-reports", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load progress reports",
      };
    }
  },

  /**
   * Submit progress report
   * POST /api/site-engineer/progress-reports
   */
  async submitProgressReport(payload) {
    try {
      const response = await api.post("/api/site-engineer/progress-reports", payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to submit progress report",
      };
    }
  },

  /**
   * Fetch material requests
   * GET /api/site-engineer/material-requests
   */
  async getMaterialRequests(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/material-requests", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load material requests",
      };
    }
  },

  /**
   * Submit material request
   * POST /api/site-engineer/material-requests
   */
  async submitMaterialRequest(payload) {
    try {
      const response = await api.post("/api/site-engineer/material-requests", payload);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to submit material request",
      };
    }
  },

  /**
   * Fetch notifications
   * GET /api/site-engineer/notifications
   */
  async getNotifications(params = {}) {
    try {
      const response = await api.get("/api/site-engineer/notifications", { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to load notifications",
      };
    }
  },

  /**
   * Mark notification as read
   * PATCH /api/site-engineer/notifications/:id/read
   */
  async markNotificationRead(id) {
    try {
      const response = await api.patch(`/api/site-engineer/notifications/${id}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read
   * PATCH /api/site-engineer/notifications/mark-all-read
   */
  async markAllNotificationsRead() {
    try {
      const response = await api.patch("/api/site-engineer/notifications/mark-all-read");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};
