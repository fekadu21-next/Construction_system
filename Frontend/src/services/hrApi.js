import api from "./api.js";

export const hrApi = {
  async getMetrics() {
    try {
      const response = await api.get("/api/hr/metrics");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch HR metrics";
      return { success: false, error: message };
    }
  },

  async getNextCode() {
    try {
      const response = await api.get("/api/hr/next-code");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to generate code";
      return { success: false, error: message };
    }
  },

  async getEmployees(params = {}) {
    try {
      const response = await api.get("/api/hr/employees", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch workforce roster";
      return { success: false, error: message };
    }
  },

  async getEmployeeById(id) {
    try {
      const response = await api.get(`/api/hr/employees/${id}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch employee details";
      return { success: false, error: message };
    }
  },

  async createEmployee(data) {
    try {
      const response = await api.post("/api/hr/employees", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to register employee";
      return { success: false, error: message };
    }
  },

  async updateEmployee(id, data) {
    try {
      const response = await api.patch(`/api/hr/employees/${id}`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update employee";
      return { success: false, error: message };
    }
  },

  async deleteEmployee(id) {
    try {
      const response = await api.delete(`/api/hr/employees/${id}`);
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete employee";
      return { success: false, error: message };
    }
  },

  async getAttendance(params = {}) {
    try {
      const response = await api.get("/api/hr/attendance", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch attendance records";
      return { success: false, error: message };
    }
  },

  async recordAttendance(data) {
    try {
      const response = await api.post("/api/hr/attendance", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to record site attendance";
      return { success: false, error: message };
    }
  },

  async getLeaves(params = {}) {
    try {
      const response = await api.get("/api/hr/leaves", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch leave requests";
      return { success: false, error: message };
    }
  },

  async submitLeave(data) {
    try {
      const response = await api.post("/api/hr/leaves", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit leave request";
      return { success: false, error: message };
    }
  },

  async reviewLeave(id, data) {
    try {
      const response = await api.patch(`/api/hr/leaves/${id}/review`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to process leave review";
      return { success: false, error: message };
    }
  },

  async getPayroll(params = {}) {
    try {
      const response = await api.get("/api/hr/payroll", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to calculate payroll sheet";
      return { success: false, error: message };
    }
  },

  async getProjects() {
    try {
      const response = await api.get("/api/hr/projects");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch projects";
      return { success: false, error: message };
    }
  },
};
