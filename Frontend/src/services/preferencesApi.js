import api from "./api.js";

export const preferencesApi = {
  async getPreferences() {
    try {
      const response = await api.get("/api/preferences");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch preferences";
      return { success: false, error: message };
    }
  },

  async updatePreferences(preferences) {
    try {
      const response = await api.put("/api/preferences", preferences);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update preferences";
      return { success: false, error: message };
    }
  },
};
