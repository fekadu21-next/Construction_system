import api from "./api.js";

export const dashboardApi = {
  async getMetrics() {
    try {
      const response = await api.get("/api/general-manager/metrics");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch dashboard metrics";
      return { success: false, error: message };
    }
  },

  async getAuditLogs(params = {}) {
    try {
      const response = await api.get("/api/general-manager/audit-logs", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch audit logs";
      return { success: false, error: message };
    }
  },
};
