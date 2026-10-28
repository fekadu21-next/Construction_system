import prisma from "../../config/prisma.js";
import { seProjectRepository } from "./projectRepository.js";

export const seDashboardRepository = {
  /**
   * Aggregate complete dashboard data for authenticated Site Engineer
   */
  async getDashboardData(engineerId) {
    const now = new Date();
    const fourteenDaysAhead = new Date(Date.now() + 14 * 86400000);

    const projectFilter = seProjectRepository.getAssignmentFilter(engineerId);

    // Parallel fetch of core operational records
    const [
      assignedProjects,
      allTasks,
      recentActivities,
      reports,
      materialRequests,
      recentNotifications,
      upcomingMilestones,
    ] = await Promise.all([
      // 1. Projects assigned to engineer
      prisma.project.findMany({
        where: projectFilter,
        orderBy: { updatedAt: "desc" },
        include: {
          projectManager: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          milestones: {
            select: { id: true, milestoneName: true, dueDate: true, status: true, progressPercent: true },
          },
          _count: {
            select: { tasks: true, employees: true, dailyActivities: true, progressReports: true },
          },
        },
      }),

      // 2. Tasks assigned to this engineer
      prisma.task.findMany({
        where: { assignedToId: engineerId, project: { archivedAt: null } },
        orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          milestone: { select: { id: true, milestoneName: true } },
        },
      }),

      // 3. Recent daily site activities
      prisma.dailySiteActivity.findMany({
        where: {
          project: projectFilter,
        },
        orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          task: { select: { id: true, taskName: true } },
        },
      }),

      // 4. Progress reports submitted by engineer
      prisma.progressReport.findMany({
        where: { siteEngineerId: engineerId, project: { archivedAt: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      }),

      // 5. Material requests submitted by engineer
      prisma.materialRequest.findMany({
        where: { requestedById: engineerId, project: { archivedAt: null } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          items: true,
          reviewedBy: { select: { id: true, fullName: true } },
        },
      }),

      // 6. Recent notifications
      prisma.notifications.findMany({
        where: {
          OR: [{ recipientUserId: engineerId }, { recipientRole: "SITE_ENGINEER" }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // 7. Upcoming Milestones on assigned projects
      prisma.milestone.findMany({
        where: {
          project: projectFilter,
          dueDate: { gte: new Date(Date.now() - 7 * 86400000), lte: fourteenDaysAhead },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
        },
      }),
    ]);

    // Metric Calculations
    const activeTasks = allTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "PENDING");
    const completedTasks = allTasks.filter((t) => t.status === "COMPLETED");
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED"
    );

    // Upcoming deadlines in next 14 days
    const upcomingDeadlines = [
      ...allTasks
        .filter((t) => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= fourteenDaysAhead && t.status !== "COMPLETED")
        .map((t) => ({
          id: t.id,
          type: "TASK",
          title: t.taskName,
          projectName: t.project.projectName,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          progressPercent: t.progressPercent,
        })),
      ...upcomingMilestones
        .filter((m) => m.dueDate && new Date(m.dueDate) >= now && m.status !== "COMPLETED")
        .map((m) => ({
          id: m.id,
          type: "MILESTONE",
          title: m.milestoneName,
          projectName: m.project.projectName,
          dueDate: m.dueDate,
          priority: "HIGH",
          status: m.status,
          progressPercent: m.progressPercent,
        })),
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const pendingRequests = materialRequests.filter((r) => r.status === "PENDING").length;
    const approvedRequests = materialRequests.filter((r) => r.status === "APPROVED").length;
    const rejectedRequests = materialRequests.filter((r) => r.status === "REJECTED").length;

    return {
      summaryMetrics: {
        assignedProjects: assignedProjects.length,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingDeadlines: upcomingDeadlines.length,
        submittedReports: reports.length,
        pendingMaterialRequests: pendingRequests,
        approvedMaterialRequests: approvedRequests,
        rejectedMaterialRequests: rejectedRequests,
      },
      assignedProjects: assignedProjects.map((p) => {
        const totalMilestones = p.milestones.length;
        const avgProgress = totalMilestones > 0
          ? Math.round(p.milestones.reduce((acc, m) => acc + (m.progressPercent || 0), 0) / totalMilestones)
          : 0;

        return {
          id: p.id,
          projectName: p.projectName,
          projectCode: p.projectCode,
          location: p.location,
          status: p.status,
          startDate: p.startDate,
          endDate: p.endDate,
          progressPercent: avgProgress,
          projectManager: p.projectManager,
          counts: p._count,
        };
      }),
      activeTasks: activeTasks.slice(0, 8),
      upcomingDeadlines: upcomingDeadlines.slice(0, 6),
      recentActivities,
      recentReports: reports.slice(0, 5),
      recentMaterialRequests: materialRequests.slice(0, 5),
      recentNotifications,
    };
  },
};
