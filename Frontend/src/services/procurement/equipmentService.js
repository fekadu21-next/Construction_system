// Equipment Service — connects to real PostgreSQL backend via REST API
import api from "../api.js";

export const equipmentService = {
  // Fetch all equipment with optional filters
  async getEquipment(filters = {}) {
    try {
      const params = {};
      if (filters.status && filters.status !== "ALL") params.status = filters.status;
      if (filters.ownership && filters.ownership !== "ALL") params.ownership = filters.ownership;
      if (filters.category && filters.category !== "ALL") params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.projectId) params.projectId = filters.projectId;

      const response = await api.get("/api/procurement/equipment", { params });
      return { success: true, data: response.data?.data || [] };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch equipment";
      return { success: false, error: message, data: [] };
    }
  },

  // Get equipment stats
  async getEquipmentStats() {
    try {
      const response = await api.get("/api/procurement/equipment/stats");
      return {
        success: true,
        data: response.data?.data || {
          totalEquipment: 0,
          activeOnSite: 0,
          availableInYard: 0,
          rentedCount: 0,
          companyOwnedCount: 0,
          inMaintenance: 0,
          dailyRentalBurnETB: 0,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to fetch equipment stats",
        data: {
          totalEquipment: 0,
          activeOnSite: 0,
          availableInYard: 0,
          rentedCount: 0,
          companyOwnedCount: 0,
          inMaintenance: 0,
          dailyRentalBurnETB: 0,
        },
      };
    }
  },

  // Get single equipment by ID
  async getEquipmentById(id) {
    try {
      const response = await api.get(`/api/procurement/equipment/${id}`);
      return { success: true, data: response.data?.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to fetch equipment" };
    }
  },

  // Create new equipment (rented or company-owned)
  async createEquipment(data) {
    try {
      const response = await api.post("/api/procurement/equipment", data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Equipment registered successfully",
      };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to create equipment" };
    }
  },

  // Update existing equipment
  async updateEquipment(id, data) {
    try {
      const response = await api.put(`/api/procurement/equipment/${id}`, data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Equipment updated successfully",
      };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to update equipment" };
    }
  },

  // Return rented equipment to supplier (Off-Hire)
  async returnRentedEquipment(id, returnData) {
    try {
      const response = await api.post(`/api/procurement/equipment/${id}/return`, returnData);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Equipment returned successfully",
      };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to return equipment" };
    }
  },

  // Delete equipment record
  async deleteEquipment(id) {
    try {
      const response = await api.delete(`/api/procurement/equipment/${id}`);
      return { success: true, message: response.data?.message || "Deleted successfully" };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to delete equipment" };
    }
  },

  // Fetch real active projects from DB (for project assignment dropdown)
  async getActiveProjects() {
    try {
      const response = await api.get("/api/shared/projects");
      return { success: true, data: response.data?.data || [] };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to fetch projects", data: [] };
    }
  },

  // Fetch active suppliers (for supplier dropdown in forms)
  async getActiveSuppliers() {
    try {
      const response = await api.get("/api/procurement/suppliers", { params: { includeInactive: false } });
      return { success: true, data: response.data?.data || [] };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to fetch suppliers", data: [] };
    }
  },
};
