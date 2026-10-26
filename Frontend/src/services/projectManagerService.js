import { initialProjectManagerData } from "../data/projectManagerMockData.js";

const STORAGE_KEY = "buildmanage_pm_data_v1";

// Helper to get stored or fresh PM data
function getStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read PM data from localStorage, using initial state:", e);
  }
  return initialProjectManagerData;
}

// Helper to persist PM data
function saveStoredData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not write PM data to localStorage:", e);
  }
}

export const projectManagerService = {
  // Fetch overview dashboard metrics and all linked collections
  async getDashboardOverview() {
    await new Promise((res) => setTimeout(res, 250)); // natural smooth latency
    const data = getStoredData();

    // Recalculate summary metrics from current state
    const assignedProjects = data.projects.length;
    const projectsInProgress = data.projects.filter((p) => p.status === "IN_PROGRESS").length;
    const delayedProjects = data.projects.filter(
      (p) => p.status === "DELAYED" || p.scheduleStatus === "Delayed" || p.status === "ON_HOLD"
    ).length;
    const pendingApprovals = data.pendingMaterialRequests.filter((r) => r.status === "PENDING").length;

    // Recalculate status counts
    const statusCounts = {
      PLANNED: data.projects.filter((p) => p.status === "PLANNED").length,
      IN_PROGRESS: data.projects.filter((p) => p.status === "IN_PROGRESS").length,
      ON_HOLD: data.projects.filter((p) => p.status === "ON_HOLD").length,
      COMPLETED: data.projects.filter((p) => p.status === "COMPLETED").length,
      DELAYED: data.projects.filter((p) => p.status === "DELAYED" || p.scheduleStatus === "Delayed").length,
    };

    // Calculate live budgets
    const totalPlanned = data.projects.reduce((acc, p) => acc + (p.plannedBudget || 0), 0);
    const totalActual = data.projects.reduce((acc, p) => acc + (p.actualExpenditure || 0), 0);
    const totalRemaining = Math.max(0, totalPlanned - totalActual);
    const utilization = totalPlanned > 0 ? parseFloat(((totalActual / totalPlanned) * 100).toFixed(1)) : 0;

    return {
      success: true,
      data: {
        ...data,
        summaryMetrics: {
          assignedProjects,
          projectsInProgress,
          delayedProjects,
          pendingApprovals,
        },
        statusCounts,
        budgetOverview: {
          totalPlannedBudget: totalPlanned,
          actualExpenditure: totalActual,
          remainingBudget: totalRemaining,
          utilizationPercentage: utilization,
          currency: "ETB",
          projectComparisons: data.projects.map((p) => ({
            id: p.id,
            code: p.projectCode,
            name: p.projectName,
            shortName: p.projectName.split(" ").slice(0, 2).join(" "),
            plannedBudget: p.plannedBudget,
            actualExpenditure: p.actualExpenditure,
            remaining: Math.max(0, p.plannedBudget - p.actualExpenditure),
            utilization: p.plannedBudget > 0 ? parseFloat(((p.actualExpenditure / p.plannedBudget) * 100).toFixed(1)) : 0,
          })),
        },
      },
    };
  },

  // Approve a material request
  async approveMaterialRequest(requestId, notes = "") {
    await new Promise((res) => setTimeout(res, 200));
    const data = getStoredData();
    const index = data.pendingMaterialRequests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      return { success: false, error: "Material request not found" };
    }

    const updatedRequest = {
      ...data.pendingMaterialRequests[index],
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
      reviewNotes: notes,
    };

    data.pendingMaterialRequests[index] = updatedRequest;
    saveStoredData(data);

    return {
      success: true,
      message: `Request ${updatedRequest.requestNumber} approved successfully.`,
      data: updatedRequest,
    };
  },

  // Reject a material request
  async rejectMaterialRequest(requestId, reason = "") {
    await new Promise((res) => setTimeout(res, 200));
    const data = getStoredData();
    const index = data.pendingMaterialRequests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      return { success: false, error: "Material request not found" };
    }

    const updatedRequest = {
      ...data.pendingMaterialRequests[index],
      status: "REJECTED",
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || "Budget/priority constraints",
    };

    data.pendingMaterialRequests[index] = updatedRequest;
    saveStoredData(data);

    return {
      success: true,
      message: `Request ${updatedRequest.requestNumber} rejected.`,
      data: updatedRequest,
    };
  },

  // Mark a progress report as reviewed
  async reviewProgressReport(reportId, reviewNotes = "") {
    await new Promise((res) => setTimeout(res, 200));
    const data = getStoredData();
    const index = data.recentProgressReports.findIndex((r) => r.id === reportId);
    if (index === -1) {
      return { success: false, error: "Progress report not found" };
    }

    const updated = {
      ...data.recentProgressReports[index],
      reviewStatus: "Reviewed",
      reviewedAt: new Date().toISOString(),
      reviewerNotes: reviewNotes,
    };

    data.recentProgressReports[index] = updated;
    saveStoredData(data);

    return {
      success: true,
      message: "Progress report reviewed and acknowledged.",
      data: updated,
    };
  },

  // Reset to default mock data if desired
  async resetMockData() {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true, message: "Mock data reset to default successfully." };
  },
};
