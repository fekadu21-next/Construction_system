import api from "./api.js";

export const usersApi = {
  async getUsers(params = {}) {
    try {
      const response = await api.get("/api/users", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch users";
      return { success: false, error: message };
    }
  },

  async getUserSummary() {
    try {
      const response = await api.get("/api/users/summary");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch user summary";
      return { success: false, error: message };
    }
  },

  async getRoles() {
    try {
      const response = await api.get("/api/users/roles");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch system roles";
      return { success: false, error: message };
    }
  },

  async getUserById(id) {
    try {
      const response = await api.get(`/api/users/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch user details";
      return { success: false, error: message };
    }
  },

  async createUser(data) {
    try {
      const response = await api.post("/api/users", data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "User created successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create user";
      return { success: false, error: message };
    }
  },

  async updateUser(id, data) {
    try {
      const response = await api.patch(`/api/users/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "User updated successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update user";
      return { success: false, error: message };
    }
  },

  async updateUserStatus(id, isActive) {
    try {
      const response = await api.patch(`/api/users/${id}/status`, { isActive });
      return {
        success: true,
        data: response.data.data,
        warning: response.data.warning,
        activeProjectsAffected: response.data.activeProjectsAffected,
        message: response.data.message || (isActive ? "User activated" : "User deactivated"),
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update user status";
      return { success: false, error: message };
    }
  },

  async deleteUser(id) {
    try {
      const response = await api.delete(`/api/users/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "User deleted successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete user";
      return { success: false, error: message };
    }
  },

  async getProjectManagers() {
    try {
      const response = await api.get("/api/users/project-managers");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch project managers";
      return { success: false, error: message };
    }
  },

  async getSupervisors() {
    try {
      const response = await api.get("/api/users/supervisors");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch site supervisors";
      return { success: false, error: message };
    }
  },
};
