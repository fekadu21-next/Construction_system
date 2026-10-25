import api from "./api.js";

export const notificationsApi = {
  async getNotifications({ page = 1, limit = 50, isRead = null } = {}) {
    const params = { page, limit };
    if (isRead !== null && isRead !== undefined) {
      params.isRead = isRead;
    }
    const response = await api.get("/api/notifications", { params });
    return response.data;
  },

  async markAsRead(id) {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch("/api/notifications/read-all");
    return response.data;
  },
};
