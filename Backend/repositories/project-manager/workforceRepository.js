import prisma from "../../config/prisma.js";

export const pmWorkforceRepository = {
  /**
   * Get complete workforce assigned to Project Manager's projects
   */
  async getWorkforce(managerId, { projectId, trade, status, search } = {}) {
    // 1. Get all PM's assigned projects
    const pmProjects = await prisma.project.findMany({
      where: {
        ...(managerId ? { projectManagerId: managerId } : {}),
        archivedAt: null,
      },
      select: { id: true, projectName: true, projectCode: true },
    });

    const allowedProjectIds = pmProjects.map((p) => p.id);
    if (allowedProjectIds.length === 0) {
      return {
        workers: [],
        summary: {
          totalWorkers: 0,
          activeOnSiteToday: 0,
          onLeaveToday: 0,
          availableOffDuty: 0,
          tradeBreakdown: {},
        },
        projects: [],
      };
    }

    const targetProjectIds = projectId ? [projectId] : allowedProjectIds;

    // Start of today (UTC / local midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. Fetch workers assigned to these projects
    const workersDb = await prisma.employees.findMany({
      where: {
        assignedProjectId: { in: targetProjectIds },
        ...(trade ? { trade } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { employeeCode: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { trade: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        projects: {
          select: { id: true, projectName: true, projectCode: true },
        },
        attendances: {
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          take: 1,
        },
        leave_requests: {
          where: {
            status: "APPROVED",
            startDate: { lte: today },
            endDate: { gte: today },
          },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    });

    // 3. Process workers and compute live availability
    let activeOnSiteToday = 0;
    let onLeaveToday = 0;
    let availableOffDuty = 0;
    const tradeBreakdown = {};

    const workers = workersDb.map((w) => {
      // Tally trades
      tradeBreakdown[w.trade] = (tradeBreakdown[w.trade] || 0) + 1;

      // Determine availability
      let availability = "AVAILABLE"; // Default: off duty / available
      let availabilityLabel = "Off Duty / Available";
      let todayAttendance = null;

      if (w.leave_requests && w.leave_requests.length > 0) {
        availability = "ON_LEAVE";
        availabilityLabel = "On Approved Leave";
        onLeaveToday++;
      } else if (w.attendances && w.attendances.length > 0) {
        const att = w.attendances[0];
        todayAttendance = {
          status: att.status,
          checkInTime: att.checkInTime,
          checkOutTime: att.checkOutTime,
          workHours: Number(att.workHours || 8),
          overtimeHours: Number(att.overtimeHours || 0),
        };

        if (att.status === "PRESENT" || att.status === "LATE") {
          availability = "ACTIVE_ON_SITE";
          availabilityLabel = att.status === "LATE" ? "On Site (Late Check-in)" : "Active On Site";
          activeOnSiteToday++;
        } else if (att.status === "EXCUSED" || att.status === "ON_LEAVE") {
          availability = "ON_LEAVE";
          availabilityLabel = "Excused / On Leave";
          onLeaveToday++;
        } else {
          availability = "ABSENT";
          availabilityLabel = "Absent";
        }
      } else {
        availableOffDuty++;
      }

      return {
        id: w.id,
        employeeCode: w.employeeCode,
        fullName: w.fullName,
        phone: w.phone,
        email: w.email,
        trade: w.trade,
        employmentType: w.employmentType,
        dailyRate: Number(w.dailyRate || 0),
        monthlySalary: Number(w.monthlySalary || 0),
        currency: w.currency || "ETB",
        status: w.status,
        assignedProjectId: w.assignedProjectId,
        project: w.projects,
        availability,
        availabilityLabel,
        todayAttendance,
      };
    });

    // Filter by availability status if requested
    const filteredWorkers = status
      ? workers.filter((w) => w.availability === status || w.status === status)
      : workers;

    return {
      workers: filteredWorkers,
      summary: {
        totalWorkers: workers.length,
        activeOnSiteToday,
        onLeaveToday,
        availableOffDuty,
        tradesCount: Object.keys(tradeBreakdown).length,
        tradeBreakdown,
      },
      projects: pmProjects,
    };
  },
};
