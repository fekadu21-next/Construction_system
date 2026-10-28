import api from "./api.js";

export const aiApi = {
  async getCostPrediction(projectId) {
    try {
      const response = await api.get(`/api/ai/cost-prediction/${projectId}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load cost prediction" };
    }
  },

  async getDelayPrediction(projectId) {
    try {
      const response = await api.get(`/api/ai/delay-prediction/${projectId}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load delay risk prediction" };
    }
  },

  async getWorkforceUtilization(projectId) {
    try {
      const response = await api.get(`/api/ai/workforce-utilization/${projectId}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load workforce utilization" };
    }
  },

  async getAllInsights() {
    try {
      const response = await api.get("/api/ai/insights");
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load AI insights" };
    }
  },
};
