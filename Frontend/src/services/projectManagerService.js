import api from "./api.js";
import { initialProjectManagerData } from "../data/projectManagerMockData.js";

const STORAGE_KEY = "buildmanage_pm_data_v1";

// Helper to get stored or fresh PM data from localStorage fallback
function getStoredFallbackData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read PM fallback data from localStorage:", e);
  }
  return initialProjectManagerData;
}

// Helper to persist PM fallback data
function saveStoredFallbackData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not write PM fallback data to localStorage:", e);
  }
}

export const projectManagerService = {
  /**
   * Fetch complete Project Manager dashboard overview
   * Connects to backend API: GET /api/project-manager/dashboard
   * Falls back gracefully to cached/mock data if API is unreachable.
   */
  async getDashboardOverview() {
    try {
      const response = await api.get("/api/project-manager/dashboard");
      if (response.data && response.data.success) {
        const payload = response.data.data;
        // Keep fallback store fresh
        saveStoredFallbackData(payload);
        return {
          success: true,
          data: payload,
          isLive: true,
        };
      }
    } catch (apiError) {
      console.warn("Live PM dashboard API fetch failed, falling back to cached/mock store:", apiError?.message);
    }

    // Graceful fallback
    const fallbackData = getStoredFallbackData();
    const assignedProjects = fallbackData.projects?.length || 0;
    const projectsInProgress = (fallbackData.projects || []).filter((p) => p.status === "IN_PROGRESS").length;
    const delayedProjects = (fallbackData.projects || []).filter(
      (p) => p.status === "DELAYED" || p.scheduleStatus === "Delayed" || p.status === "ON_HOLD"
    ).length;
    const pendingApprovals = (fallbackData.pendingMaterialRequests || []).filter((r) => r.status === "PENDING").length;

    const statusCounts = {
      PLANNED: (fallbackData.projects || []).filter((p) => p.status === "PLANNED").length,
      IN_PROGRESS: projectsInProgress,
      ON_HOLD: (fallbackData.projects || []).filter((p) => p.status === "ON_HOLD").length,
      COMPLETED: (fallbackData.projects || []).filter((p) => p.status === "COMPLETED").length,
      DELAYED: delayedProjects,
    };

    const totalPlanned = (fallbackData.projects || []).reduce((acc, p) => acc + (p.plannedBudget || 0), 0);
    const totalActual = (fallbackData.projects || []).reduce((acc, p) => acc + (p.actualExpenditure || 0), 0);
    const totalRemaining = Math.max(0, totalPlanned - totalActual);
    const utilization = totalPlanned > 0 ? parseFloat(((totalActual / totalPlanned) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        ...fallbackData,
        summaryMetrics: fallbackData.summaryMetrics || {
          assignedProjects,
          projectsInProgress,
          delayedProjects,
          pendingApprovals,
        },
        statusCounts: fallbackData.statusCounts || statusCounts,
        budgetOverview: fallbackData.budgetOverview || {
          totalPlannedBudget: totalPlanned,
          actualExpenditure: totalActual,
          remainingBudget: totalRemaining,
          utilizationPercentage: utilization,
          currency: "ETB",
          projectComparisons: (fallbackData.projects || []).map((p) => ({
            id: p.id,
            code: p.projectCode,
            name: p.projectName,
            shortName: (p.projectName || "").split(" ").slice(0, 2).join(" "),
            plannedBudget: p.plannedBudget,
            actualExpenditure: p.actualExpenditure,
            remaining: Math.max(0, (p.plannedBudget || 0) - (p.actualExpenditure || 0)),
            utilization:
              p.plannedBudget > 0 ? parseFloat((((p.actualExpenditure || 0) / p.plannedBudget) * 100).toFixed(1)) : 0,
          })),
        },
      },
      isLive: false,
    };
  },

  /**
   * Approve a material request
   * Calls: PATCH /api/project-manager/material-requests/:id/approve
   */
  async approveMaterialRequest(requestId, notes = "") {
    try {
      const response = await api.patch(`/api/project-manager/material-requests/${requestId}/approve`, {
        approvalNotes: notes,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || `Material request approved successfully.`,
          data: response.data.data,
        };
      }
    } catch (apiError) {
      console.warn("Backend approval call failed, attempting fallback update:", apiError?.message);
    }

    // Fallback store update
    const data = getStoredFallbackData();
    const index = (data.pendingMaterialRequests || []).findIndex((r) => r.id === requestId);
    if (index !== -1) {
      const updated = {
        ...data.pendingMaterialRequests[index],
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
        reviewNotes: notes,
      };
      data.pendingMaterialRequests[index] = updated;
      saveStoredFallbackData(data);
      return {
        success: true,
        message: `Request ${updated.requestNumber || ""} approved successfully (offline mode).`,
        data: updated,
      };
    }

    return { success: false, error: "Material request not found." };
  },

  /**
   * Reject a material request
   * Calls: PATCH /api/project-manager/material-requests/:id/reject
   */
  async rejectMaterialRequest(requestId, reason = "") {
    try {
      const response = await api.patch(`/api/project-manager/material-requests/${requestId}/reject`, {
        rejectionReason: reason || "Budget/priority constraints",
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || `Material request rejected.`,
          data: response.data.data,
        };
      }
    } catch (apiError) {
      console.warn("Backend rejection call failed, attempting fallback update:", apiError?.message);
    }

    // Fallback store update
    const data = getStoredFallbackData();
    const index = (data.pendingMaterialRequests || []).findIndex((r) => r.id === requestId);
    if (index !== -1) {
      const updated = {
        ...data.pendingMaterialRequests[index],
        status: "REJECTED",
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || "Budget/priority constraints",
      };
      data.pendingMaterialRequests[index] = updated;
      saveStoredFallbackData(data);
      return {
        success: true,
        message: `Request ${updated.requestNumber || ""} rejected (offline mode).`,
        data: updated,
      };
    }

    return { success: false, error: "Material request not found." };
  },

  /**
   * Review a site engineer progress report
   * Calls: PATCH /api/project-manager/progress-reports/:id/review
   */
  async reviewProgressReport(reportId, reviewNotes = "") {
    try {
      const response = await api.patch(`/api/project-manager/progress-reports/${reportId}/review`, {
        reviewNotes,
        status: "REVIEWED",
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || "Progress report reviewed and acknowledged.",
          data: response.data.data,
        };
      }
    } catch (apiError) {
      console.warn("Backend report review call failed, attempting fallback update:", apiError?.message);
    }

    // Fallback store update
    const data = getStoredFallbackData();
    const index = (data.recentProgressReports || []).findIndex((r) => r.id === reportId);
    if (index !== -1) {
      const updated = {
        ...data.recentProgressReports[index],
        reviewStatus: "Reviewed",
        status: "REVIEWED",
        reviewedAt: new Date().toISOString(),
        reviewerNotes: reviewNotes,
      };
      data.recentProgressReports[index] = updated;
      saveStoredFallbackData(data);
      return {
        success: true,
        message: "Progress report reviewed and acknowledged (offline mode).",
        data: updated,
      };
    }

    return { success: false, error: "Progress report not found." };
  },

  /**
   * Get paginated assigned projects
   * Calls: GET /api/project-manager/projects
   */
  async getProjects(params = {}) {
    try {
      const response = await api.get("/api/project-manager/projects", { params });
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      return {
        success: true,
        data: {
          projects: overview.data?.projects || [],
          total: overview.data?.projects?.length || 0,
        },
      };
    }
  },

  /**
   * Get single project details with milestones and expenses
   * Calls: GET /api/project-manager/projects/:id
   */
  async getProjectById(projectId) {
    try {
      const response = await api.get(`/api/project-manager/projects/${projectId}`);
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      const project = overview.data?.projects?.find((p) => p.id === projectId);
      return { success: !!project, data: project };
    }
  },

  /**
   * Get project milestones
   * Calls: GET /api/project-manager/projects/:id/milestones
   */
  async getProjectMilestones(projectId) {
    try {
      const response = await api.get(`/api/project-manager/projects/${projectId}/milestones`);
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      const milestones = (overview.data?.upcomingMilestones || []).filter((m) => m.projectId === projectId);
      return { success: true, data: milestones };
    }
  },

  /**
   * Update milestone status / progress
   * Calls: PATCH /api/project-manager/milestones/:id
   */
  async updateMilestone(milestoneId, data) {
    try {
      const response = await api.patch(`/api/project-manager/milestones/${milestoneId}`, data);
      return response.data;
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  /**
   * Get progress reports
   * Calls: GET /api/project-manager/progress-reports
   */
  async getProgressReports(params = {}) {
    try {
      const response = await api.get("/api/project-manager/progress-reports", { params });
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      return {
        success: true,
        data: {
          reports: overview.data?.recentProgressReports || [],
          total: overview.data?.recentProgressReports?.length || 0,
        },
      };
    }
  },

  /**
   * Get material requests
   * Calls: GET /api/project-manager/material-requests
   */
  async getMaterialRequests(params = {}) {
    try {
      const response = await api.get("/api/project-manager/material-requests", { params });
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      return {
        success: true,
        data: {
          requests: overview.data?.pendingMaterialRequests || [],
          total: overview.data?.pendingMaterialRequests?.length || 0,
        },
      };
    }
  },

  /**
   * Get budget and expense summary
   * Calls: GET /api/project-manager/budget
   */
  async getBudgetSummary(params = {}) {
    try {
      const response = await api.get("/api/project-manager/budget", { params });
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      return { success: true, data: overview.data?.budgetOverview };
    }
  },

  /**
   * Get reports and analytics summary
   * Calls: GET /api/project-manager/reports
   */
  async getReportsAnalytics(params = {}) {
    try {
      const response = await api.get("/api/project-manager/reports", { params });
      return response.data;
    } catch {
      const overview = await this.getDashboardOverview();
      return { success: true, data: overview.data };
    }
  },

  /**
   * Reset fallback store to initial demo state
   */
  async resetMockData() {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true, message: "PM fallback data reset to default successfully." };
  },
};
