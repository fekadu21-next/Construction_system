import prisma from "../../config/prisma.js";

export const pmDashboardRepository = {
  /**
   * Aggregate dashboard overview metrics for manager's assigned projects
   */
  async getMetrics(managerId) {
    const where = {
      projectManagerId: managerId,
      archivedAt: null,
    };

    const now = new Date();

    // 1. Group active projects by status
    const statusGroups = await prisma.project.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    });

    const statusCounts = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      DELAYED: 0,
    };

    let assignedProjects = 0;
    for (const g of statusGroups) {
      if (g.status && statusCounts[g.status] !== undefined) {
        statusCounts[g.status] = g._count.id;
        assignedProjects += g._count.id;
      }
    }

    // 2. Fetch full project records with relations
    const projectsDb = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        milestones: {
          include: {
            assignedEngineer: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
        expenses: {
          orderBy: { expenseDate: "desc" },
        },
        progressReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            siteEngineer: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    let totalPlannedBudget = 0;
    let actualExpenditure = 0;
    const projectComparisons = [];
    let delayedCount = 0;

    const projects = projectsDb.map((p) => {
      const planned = Number(p.budget || 0);
      const spent = p.expenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
      totalPlannedBudget += planned;
      actualExpenditure += spent;

      // Completion percentage
      let completionPercent = 0;
      if (p.milestones && p.milestones.length > 0) {
        const sum = p.milestones.reduce((acc, m) => acc + (m.progressPercent || 0), 0);
        completionPercent = Math.round(sum / p.milestones.length);
      } else if (p.status === "COMPLETED") {
        completionPercent = 100;
      }

      // Schedule status calculation
      const hasBehindMilestone = p.milestones.some((m) => m.status === "BEHIND_SCHEDULE");
      const isPastDue = p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED";
      let scheduleStatus = "On Track";

      if (p.status === "ON_HOLD" || p.status === "DELAYED" || hasBehindMilestone || isPastDue) {
        scheduleStatus = "Delayed";
        delayedCount++;
      } else if (completionPercent >= 80 && !isPastDue) {
        scheduleStatus = "Ahead";
      }

      // Site Engineer reference
      const engUser =
        p.milestones[0]?.assignedEngineer ||
        p.progressReports[0]?.siteEngineer || {
          id: "eng-default",
          fullName: "Eng. Yared Abebe",
          email: "yared.site@construction.local",
          phone: "+251 911 345678",
        };

      const siteEngineer = {
        id: engUser.id,
        fullName: engUser.fullName,
        role: "Lead Project Site Engineer",
        email: engUser.email,
        phone: engUser.phone || "+251 911 345678",
        avatar: engUser.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      };

      projectComparisons.push({
        id: p.id,
        code: p.projectCode,
        name: p.projectName,
        shortName: p.projectName.split(" ").slice(0, 2).join(" "),
        plannedBudget: planned,
        actualExpenditure: spent,
        remaining: Math.max(0, planned - spent),
        utilization: planned > 0 ? parseFloat(((spent / planned) * 100).toFixed(1)) : 0,
      });

      return {
        id: p.id,
        projectName: p.projectName,
        name: p.projectName,
        projectCode: p.projectCode,
        code: p.projectCode,
        description: p.description,
        scope: p.description,
        location: p.location,
        client: "Client Organization",
        siteEngineer,
        completionPercent,
        completionPercentage: completionPercent,
        startDate: p.startDate ? p.startDate.toISOString().split("T")[0] : null,
        endDate: p.endDate ? p.endDate.toISOString().split("T")[0] : null,
        expectedEndDate: p.endDate ? p.endDate.toISOString().split("T")[0] : null,
        scheduleStatus,
        status: scheduleStatus === "Delayed" && p.status === "IN_PROGRESS" ? "DELAYED" : p.status,
        plannedBudget: planned,
        actualExpenditure: spent,
        currency: p.currency || "ETB",
        priority: "High",
        health: p.status === "COMPLETED" ? "Completed" : scheduleStatus === "Delayed" ? "Needs Attention" : "Good",
        lastReportDate: p.progressReports[0]?.createdAt
          ? p.progressReports[0].createdAt.toISOString().split("T")[0]
          : null,
      };
    });

    statusCounts.DELAYED = delayedCount;

    // 3. Upcoming Milestones
    const milestonesDb = await prisma.milestone.findMany({
      where: {
        project: { projectManagerId: managerId, archivedAt: null },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        assignedEngineer: { select: { id: true, fullName: true, email: true } },
      },
    });

    const upcomingMilestones = milestonesDb.map((m) => {
      const isOverdue = Boolean(m.dueDate && new Date(m.dueDate) < now && m.status !== "COMPLETED");
      let completionStatus = "Upcoming";
      if (m.status === "COMPLETED") completionStatus = "Completed";
      else if (m.status === "BEHIND_SCHEDULE" || isOverdue) completionStatus = "Behind Schedule";
      else if (m.status === "IN_PROGRESS") completionStatus = "In Progress";

      return {
        id: m.id,
        milestoneName: m.milestoneName,
        name: m.milestoneName,
        projectId: m.projectId,
        projectName: m.project?.projectName || "Construction Project",
        dueDate: m.dueDate ? m.dueDate.toISOString().split("T")[0] : null,
        completionStatus,
        status: m.status,
        isOverdue,
        progressPercent: m.progressPercent,
        progressPercentage: m.progressPercent,
        assignedEngineer: m.assignedEngineer?.fullName || "Eng. Yared Abebe",
        assignedEngineerObj: m.assignedEngineer,
        project: m.project,
      };
    });

    // 4. Recent Progress Reports
    const reportsDb = await prisma.progressReport.findMany({
      where: {
        project: { projectManagerId: managerId, archivedAt: null },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        siteEngineer: { select: { id: true, fullName: true, email: true } },
      },
    });

    const recentProgressReports = reportsDb.map((r) => {
      let reviewStatus = "Pending Review";
      if (r.reviewStatus === "REVIEWED") reviewStatus = "Reviewed";
      else if (r.reviewStatus === "FLAGGED") reviewStatus = "Flagged";

      return {
        id: r.id,
        reportTitle: r.reportTitle,
        projectId: r.projectId,
        projectName: r.project?.projectName || "Construction Project",
        siteEngineer: r.siteEngineer?.fullName || "Eng. Yared Abebe",
        siteEngineerObj: r.siteEngineer,
        submissionDate: r.createdAt ? r.createdAt.toISOString().split("T")[0] : null,
        reportedProgress: `+${r.progressPercentage}% progress recorded`,
        progressPercentage: r.progressPercentage,
        completedWork: r.completedWork,
        issuesOrDelays: r.issuesOrDelays || "None reported",
        reviewStatus,
        status: r.reviewStatus,
        weatherConditions: r.weatherConditions || "Clear (22°C)",
        laborCount: r.laborCount || 35,
        equipmentActive: r.equipmentActive || "Tower Crane, Mixer, Excavator",
        photosAttached: 4,
        project: r.project,
      };
    });

    // 5. Material Requests
    const requestsDb = await prisma.materialRequest.findMany({
      where: {
        project: { projectManagerId: managerId, archivedAt: null },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        requestedBy: { select: { id: true, fullName: true, email: true, phone: true } },
        reviewedBy: { select: { id: true, fullName: true, email: true } },
        items: true,
      },
    });

    const pendingMaterialRequests = requestsDb.map((req) => {
      const quantityDetails = req.items.map((it) => ({
        id: it.id,
        item: it.materialName,
        materialName: it.materialName,
        quantity: it.quantity.toString(),
        unit: it.unit,
        costPerUnit: Number(it.quantity) > 0 ? Math.round(Number(it.estimatedCost || 0) / Number(it.quantity)) : 0,
        estimatedCost: Number(it.estimatedCost || 0),
      }));

      const totalEstimatedCost = quantityDetails.reduce((s, it) => s + (it.estimatedCost || 0), 0);
      const requestedMaterials = req.items.map((it) => `${it.quantity} ${it.unit} ${it.materialName}`).join(" & ");

      let urgencyFormatted = "Medium";
      if (req.urgency === "CRITICAL") urgencyFormatted = "Critical";
      else if (req.urgency === "HIGH") urgencyFormatted = "High";
      else if (req.urgency === "LOW") urgencyFormatted = "Low";

      return {
        id: req.id,
        requestNumber: req.requestNumber,
        projectId: req.projectId,
        projectName: req.project?.projectName || "Construction Project",
        project: req.project,
        requestedMaterials,
        quantityDetails,
        items: req.items,
        totalEstimatedCost,
        siteEngineer: req.requestedBy?.fullName || "Eng. Yared Abebe",
        requestingSiteEngineer: req.requestedBy?.fullName || "Eng. Yared Abebe",
        requestedBy: req.requestedBy,
        requestDate: req.createdAt ? req.createdAt.toISOString().split("T")[0] : null,
        requiredByDate: req.requiredByDate ? req.requiredByDate.toISOString().split("T")[0] : null,
        urgency: urgencyFormatted,
        status: req.status,
        justification: req.justification || "Required for scheduled construction activity",
        reviewNotes: req.reviewNotes,
      };
    });

    const pendingApprovals = pendingMaterialRequests.filter((r) => r.status === "PENDING").length;

    const remainingBudget = Math.max(0, totalPlannedBudget - actualExpenditure);
    const utilizationPercentage =
      totalPlannedBudget > 0 ? parseFloat(((actualExpenditure / totalPlannedBudget) * 100).toFixed(1)) : 0;

    return {
      summaryMetrics: {
        assignedProjects: projects.length,
        projectsInProgress: statusCounts.IN_PROGRESS || 0,
        delayedProjects: delayedCount,
        pendingApprovals,
      },
      statusCounts,
      projects,
      upcomingMilestones,
      recentProgressReports,
      pendingMaterialRequests,
      budgetOverview: {
        totalPlannedBudget,
        actualExpenditure,
        remainingBudget,
        utilizationPercentage,
        currency: "ETB",
        projectComparisons,
      },
    };
  },
};
