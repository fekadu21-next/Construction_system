import api from "./api.js";

export const accountantApi = {
  async getDashboard(projectId) {
    try {
      const response = await api.get("/api/accountant/dashboard", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load financial dashboard" };
    }
  },

  async getBudgets(projectId) {
    try {
      const response = await api.get("/api/accountant/budgets", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load budget allocations" };
    }
  },

  async createBudget(data) {
    try {
      const response = await api.post("/api/accountant/budgets", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to create budget allocation" };
    }
  },

  async updateProjectBudget(projectId, data) {
    try {
      const response = await api.patch(`/api/accountant/budgets/project/${projectId}`, data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to update project allocated budget" };
    }
  },

  async getExpenses(params = {}) {
    try {
      const response = await api.get("/api/accountant/expenses", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load expense records" };
    }
  },

  async createExpense(data) {
    try {
      const response = await api.post("/api/accountant/expenses", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to record expense" };
    }
  },

  async reviewExpense(id, data) {
    try {
      const response = await api.patch(`/api/accountant/expenses/${id}/approval`, data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to review expense" };
    }
  },

  async recordPayment(id, data) {
    try {
      const response = await api.patch(`/api/accountant/expenses/${id}/payment`, data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to record payment" };
    }
  },

  async getEligibleLaborCosts(projectId) {
    try {
      const response = await api.get("/api/accountant/labor-costs", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load eligible labor costs" };
    }
  },

  async postLaborCost(data) {
    try {
      const response = await api.post("/api/accountant/labor-costs/post", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to post labor cost" };
    }
  },

  async getInvoices(projectId) {
    try {
      const response = await api.get("/api/accountant/invoices", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load invoices" };
    }
  },

  async createInvoice(data) {
    try {
      const response = await api.post("/api/accountant/invoices", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to record invoice" };
    }
  },

  async payInvoice(id, data) {
    try {
      const response = await api.post(`/api/accountant/invoices/${id}/pay`, data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to execute invoice payment" };
    }
  },

  async getMaterialCosts(projectId) {
    try {
      const response = await api.get("/api/accountant/material-costs", { params: { projectId } });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load material costs" };
    }
  },

  async recordMaterialCost(data) {
    try {
      const response = await api.post("/api/accountant/material-costs/record", data);
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to record material cost" };
    }
  },

  async getReports(params = {}) {
    try {
      const response = await api.get("/api/accountant/reports", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to generate financial reports" };
    }
  },

  async getSuppliers() {
    try {
      const response = await api.get("/api/accountant/suppliers");
      return { success: true, data: response.data.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Failed to load suppliers" };
    }
  },
};
