import api from "../api.js";

export const procurementService = {
  async getDashboardStats() {
    try {
      const response = await api.get("/api/procurement/dashboard/stats");
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch dashboard stats";
      return { success: false, error: message };
    }
  },

  async getMaterials(options = {}) {
    try {
      const { includeInactive, categoryId, search } = options;
      const params = {};
      if (includeInactive) params.includeInactive = true;
      if (categoryId) params.categoryId = categoryId;
      if (search) params.search = search;

      const response = await api.get("/api/procurement/materials", { params });
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch materials";
      return { success: false, error: message };
    }
  },

  async getStockHistory(id) {
    try {
      const response = await api.get(`/api/procurement/materials/${id}/stock-history`);
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch stock history";
      return { success: false, error: message };
    }
  },

  async getMaterialById(id) {
    try {
      const response = await api.get(`/api/procurement/materials/${id}`);
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch material";
      return { success: false, error: message };
    }
  },

  async createMaterial(data) {
    try {
      const response = await api.post("/api/procurement/materials", data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Material created successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create material";
      return { success: false, error: message };
    }
  },

  async updateMaterial(id, data) {
    try {
      const response = await api.put(`/api/procurement/materials/${id}`, data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Material updated successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update material";
      return { success: false, error: message };
    }
  },

  async deleteMaterial(id) {
    try {
      const response = await api.delete(`/api/procurement/materials/${id}`);
      return {
        success: true,
        message: response.data?.message || "Material deleted successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete material";
      return { success: false, error: message };
    }
  },

  async getLowStockMaterials() {
    try {
      const response = await api.get("/api/procurement/materials/low-stock");
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch low stock materials";
      return { success: false, error: message };
    }
  },

  async getStockStats() {
    try {
      const response = await api.get("/api/procurement/materials/stats");
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch stock stats";
      return { success: false, error: message };
    }
  },

  async getCategories() {
    try {
      const response = await api.get("/api/procurement/materials/categories");
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch categories";
      return { success: false, error: message };
    }
  },

  async createCategory(data) {
    try {
      const response = await api.post("/api/procurement/materials/categories", data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Category created successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create category";
      return { success: false, error: message };
    }
  },

  async updateCategory(id, data) {
    try {
      const response = await api.put(`/api/procurement/materials/categories/${id}`, data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Category updated successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update category";
      return { success: false, error: message };
    }
  },

  async deleteCategory(id) {
    try {
      const response = await api.delete(`/api/procurement/materials/categories/${id}`);
      return {
        success: true,
        message: response.data?.message || "Category deleted successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete category";
      return { success: false, error: message };
    }
  },

  async getSuppliers(options = {}) {
    try {
      const { includeInactive, search } = options;
      const params = {};
      if (includeInactive) params.includeInactive = true;
      if (search) params.search = search;

      const response = await api.get("/api/procurement/suppliers", { params });
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch suppliers";
      return { success: false, error: message };
    }
  },

  async getSupplierById(id) {
    try {
      const response = await api.get(`/api/procurement/suppliers/${id}`);
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch supplier";
      return { success: false, error: message };
    }
  },

  async createSupplier(data) {
    try {
      const response = await api.post("/api/procurement/suppliers", data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Supplier created successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create supplier";
      return { success: false, error: message };
    }
  },

  async updateSupplier(id, data) {
    try {
      const response = await api.put(`/api/procurement/suppliers/${id}`, data);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || "Supplier updated successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update supplier";
      return { success: false, error: message };
    }
  },

  async deleteSupplier(id) {
    try {
      const response = await api.delete(`/api/procurement/suppliers/${id}`);
      return {
        success: true,
        message: response.data?.message || "Supplier deleted successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete supplier";
      return { success: false, error: message };
    }
  },

  async getSupplierStats() {
    try {
      const response = await api.get("/api/procurement/suppliers/stats");
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch supplier stats";
      return { success: false, error: message };
    }
  },
};
