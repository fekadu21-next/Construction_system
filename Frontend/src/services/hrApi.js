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

  async approveEmployee(id) {
    try {
      const response = await api.patch(`/api/hr/employees/${id}/approve`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to approve employee";
      return { success: false, error: message };
    }
  },

  async rejectEmployee(id, reason = "") {
    try {
      const response = await api.patch(`/api/hr/employees/${id}/reject`, { reason });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reject employee";
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

  async getSystemUsers() {
    try {
      const response = await api.get("/api/hr/system-users");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch system users";
      return { success: false, error: message };
    }
  },

  async importUsers(data = {}) {
    try {
      const response = await api.post("/api/hr/employees/import-users", data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "Users imported successfully",
      };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to import system users";
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

  async submitAttendance(data) {
    try {
      const response = await api.post("/api/hr/attendance/submit", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit attendance sheet";
      return { success: false, error: message };
    }
  },

  async reviewAttendance(data) {
    try {
      const response = await api.post("/api/hr/attendance/review", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to review attendance sheet";
      return { success: false, error: message };
    }
  },

  async updateAttendanceRecord(id, data) {
    try {
      const response = await api.patch(`/api/hr/attendance/${id}`, data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update attendance entry";
      return { success: false, error: message };
    }
  },

  async getAttendanceDashboard(params = {}) {
    try {
      const response = await api.get("/api/hr/attendance/dashboard", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch attendance dashboard";
      return { success: false, error: message };
    }
  },

  async getAttendanceHistory(params = {}) {
    try {
      const response = await api.get("/api/hr/attendance/history", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch attendance history";
      return { success: false, error: message };
    }
  },

  async getWorkerAttendance(workerId, params = {}) {
    try {
      const response = await api.get(`/api/hr/attendance/worker/${workerId}`, { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch worker attendance details";
      return { success: false, error: message };
    }
  },

  async getAttendanceReports(params = {}) {
    try {
      const response = await api.get("/api/hr/attendance/reports", { params });
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch attendance reports";
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

  async getAvailableWorkers() {
    try {
      const response = await api.get("/api/hr/available-workers");
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch available workers";
      return { success: false, error: message };
    }
  },

  async assignWorker(data) {
    try {
      const response = await api.post("/api/hr/assignments", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to assign worker to project";
      return { success: false, error: message };
    }
  },

  async transferWorker(data) {
    try {
      const response = await api.post("/api/hr/assignments/transfer", data);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to transfer worker";
      return { success: false, error: message };
    }
  },

  async getWorkerAssignments(workerId) {
    try {
      const response = await api.get(`/api/hr/employees/${workerId}/assignments`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch worker assignment history";
      return { success: false, error: message };
    }
  },
};
