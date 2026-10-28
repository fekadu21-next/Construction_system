import prisma from "../config/prisma.js";
import pool from "../config/db.js";
import { notificationService } from "./notificationService.js";

async function safeCount(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return parseInt(res.rows[0]?.count, 10) || 0;
  } catch {
    return 0;
  }
}

async function safeRows(sql, params = []) {
  try {
    const res = await pool.query(sql, params);
    return res.rows || [];
  } catch {
    return [];
  }
}

function calculateHours(checkIn, checkOut, status) {
  if (["ABSENT", "ON_LEAVE", "HOLIDAY", "REST_DAY"].includes(status)) {
    return 0.0;
  }
  if (status === "HALF_DAY") {
    return 4.0;
  }
  if (!checkIn || !checkOut) {
    return 8.0;
  }
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
    return 8.0;
  }
  let diff = (outH * 60 + outM) - (inH * 60 + inM);
  if (diff < 0) diff += 24 * 60;
  if (diff >= 300) diff -= 60; // 1-hour break
  const hrs = Math.max(0, diff / 60);
  return Math.round(hrs * 100) / 100;
}

export function calculateWorkerWage(dailyRate, monthlySalary, status, overtimeHours = 0) {
  const dRate = Number(dailyRate || 0);
  const mSalary = Number(monthlySalary || 0);
  const baseDaily = dRate > 0 ? dRate : (mSalary > 0 ? mSalary / 26 : 0);

  if (!["PRESENT", "LATE", "HALF_DAY"].includes(status)) {
    return {
      baseDailyRate: Math.round(baseDaily * 100) / 100,
      hourlyRate: Math.round((baseDaily / 8) * 100) / 100,
      regularPay: 0,
      overtimePay: 0,
      totalCost: 0,
    };
  }

  const factor = status === "HALF_DAY" ? 0.5 : 1.0;
  const regularPay = baseDaily * factor;
  const hourlyRate = baseDaily / 8;
  const otHours = Math.max(0, Number(overtimeHours || 0));
  const overtimePay = otHours * hourlyRate * 1.5;
  const totalCost = regularPay + overtimePay;

  return {
    baseDailyRate: Math.round(baseDaily * 100) / 100,
    hourlyRate: Math.round(hourlyRate * 100) / 100,
    regularPay: Math.round(regularPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

export const supervisorService = {
  /**
   * Get authorized projects for a supervisor
   */
  async getAuthorizedProjects(userId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN", "HR_MANAGER", "ACCOUNTANT"].includes(userRole);
    const where = { archivedAt: null };

    if (!isSuperAdmin) {
      if (userRole === "PROJECT_MANAGER") {
        where.projectManagerId = userId;
      } else if (userRole === "SITE_ENGINEER") {
        where.siteEngineerId = userId;
      } else {
        // Site Supervisor strictly sees only projects assigned to them
        where.supervisorId = userId;
      }
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        projectManager: { select: { id: true, fullName: true, phone: true, email: true } },
        supervisor: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach real counts for workers, open tasks, pending requests
    const enhanced = await Promise.all(
      projects.map(async (p) => {
        const [workerCount, openTasksCount, pendingMatReqCount, activeIncidentsCount] = await Promise.all([
          prisma.employee.count({
            where: { assignedProjectId: p.id, status: { in: ["ACTIVE", "ON_LEAVE"] } },
          }),
          safeCount(`
            SELECT COUNT(*)::int as count FROM tasks 
            WHERE "projectId" = $1 AND status != 'COMPLETED'
          `, [p.id]),
          safeCount(`
            SELECT COUNT(*)::int as count FROM material_requests 
            WHERE "projectId" = $1 AND status = 'PENDING'
          `, [p.id]),
          prisma.siteIncident.count({
            where: { projectId: p.id, status: { in: ["OPEN", "INVESTIGATING"] } },
          }).catch(() => 0),
        ]);

        return {
          ...p,
          assignedWorkersCount: workerCount,
          openTasksCount,
          pendingMaterialRequestsCount: pendingMatReqCount,
          activeIncidentsCount,
        };
      })
    );

    return enhanced;
  },

  /**
   * Get eligible workers assigned to a specific project
   */
  async getProjectWorkers(projectId, userId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN", "HR_MANAGER", "ACCOUNTANT"].includes(userRole);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, projectCode: true, supervisorId: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!isSuperAdmin && project.supervisorId !== userId) {
      throw new Error("You are not authorized to view workers for this project");
    }

    const workers = await prisma.employee.findMany({
      where: {
        assignedProjectId: projectId,
        status: { in: ["ACTIVE", "ON_LEAVE", "PENDING_APPROVAL"] },
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        trade: true,
        employmentType: true,
        dailyRate: true,
        monthlySalary: true,
        currency: true,
        status: true,
        workTeam: true,
        assignedProjectId: true,
      },
      orderBy: { fullName: "asc" },
    });

    return {
      project,
      workers,
      totalCount: workers.length,
    };
  },

  /**
   * Register a daily laborer directly on site to a project (Pending HR approval)
   */
  async addDailyWorker(projectId, data, userId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN"].includes(userRole);
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    if (!data.fullName || !data.fullName.trim()) {
      throw new Error("Worker full name is required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, projectCode: true, supervisorId: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!isSuperAdmin && project.supervisorId !== userId) {
      throw new Error("You can only add daily workers to your assigned project");
    }

    // Auto-generate next employee code (e.g. DL-0001 or EMP-0001)
    const latest = await prisma.employee.findFirst({
      orderBy: { createdAt: "desc" },
      select: { employeeCode: true },
    });

    let employeeCode = `DL-${Date.now().toString().slice(-4)}`;
    if (latest?.employeeCode) {
      const match = latest.employeeCode.match(/(?:EMP|DL)-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        employeeCode = `DL-${String(nextNum).padStart(4, "0")}`;
      }
    }

    const trade = (data.trade || "GENERAL_LABORER").trim().toUpperCase();
    const workTeam = (data.workTeam || "Site Daily Crew").trim();
    const dailyRate = data.dailyRate !== undefined && data.dailyRate !== null && data.dailyRate !== "" 
      ? Number(data.dailyRate) 
      : null;

    const worker = await prisma.employee.create({
      data: {
        employeeCode,
        fullName: data.fullName.trim(),
        phone: (data.phone || "").trim() || "0900000000",
        trade,
        employmentType: "DAILY_LABORER",
        dailyRate,
        currency: data.currency || "ETB",
        status: "PENDING_APPROVAL", // Daily workers added by supervisor await HR approval
        nationalId: data.nationalId ? data.nationalId.trim() : null,
        emergencyContactName: data.emergencyContactName ? data.emergencyContactName.trim() : null,
        emergencyContactPhone: data.emergencyContactPhone ? data.emergencyContactPhone.trim() : null,
        hireDate: new Date(),
        workTeam,
        assignedProjectId: projectId,
      },
    });

    // Create pending project assignment
    try {
      await prisma.projectAssignment.create({
        data: {
          employeeId: worker.id,
          projectId,
          jobRole: trade,
          workTeam,
          startDate: new Date(),
          status: "PENDING",
          notes: "Registered directly on site by Site Supervisor, awaiting HR verification",
          assignedById: userId,
        },
      });
    } catch (e) {
      console.warn("Project assignment creation warning:", e.message);
    }

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: userId,
          action: "CREATE_DAILY_WORKER",
          entityType: "Employee",
          entityId: worker.id,
          details: {
            employeeCode,
            fullName: worker.fullName,
            projectId,
            trade,
            dailyRate,
            status: "PENDING_APPROVAL",
          },
        },
      });
    } catch (e) {
      console.warn("Audit log creation warning:", e.message);
    }

    // Notify HR Manager for formal approval
    try {
      await notificationService.createNotification({
        recipientRole: "HR_MANAGER",
        title: "Daily Worker Awaiting HR Approval",
        message: `Site Supervisor registered daily worker ${worker.fullName} (${trade}, ${employeeCode}) at project "${project.projectName}". Awaiting HR verification.`,
        type: "WARNING",
        category: "WORKFORCE",
        link: "/hr/employees?status=PENDING_APPROVAL",
      });
    } catch (e) {
      console.warn("Notification warning:", e.message);
    }

    return worker;
  },

  /**
   * Get daily attendance roster for a project & date
   * Supports 'all' projects for HR_MANAGER, ACCOUNTANT, GENERAL_MANAGER, and ADMIN
   * Calculates independent labor costs per project and per worker
   */
  async getDailyAttendance(projectId, date, userId, userRole) {
    const isManager = ["GENERAL_MANAGER", "ADMIN", "HR_MANAGER", "ACCOUNTANT"].includes(userRole);
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    // Multi-project aggregate view (projectId is 'all' or empty)
    if (!projectId || projectId === "all") {
      const projectWhere = { archivedAt: null };
      if (!isManager) {
        if (userRole === "PROJECT_MANAGER") {
          projectWhere.projectManagerId = userId;
        } else if (userRole === "SITE_ENGINEER") {
          projectWhere.siteEngineerId = userId;
        } else {
          projectWhere.supervisorId = userId;
        }
      }

      const projects = await prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          projectName: true,
          projectCode: true,
          supervisor: { select: { id: true, fullName: true } },
        },
        orderBy: { projectName: "asc" },
      });

      const projectIds = projects.map((p) => p.id);
      const projectMap = new Map();
      projects.forEach((p) => projectMap.set(p.id, p));

      // Get assigned workers across all active projects
      const workers = await prisma.employee.findMany({
        where: {
          assignedProjectId: { in: projectIds },
          status: { in: ["ACTIVE", "ON_LEAVE", "PENDING_APPROVAL"] },
        },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          trade: true,
          phone: true,
          employmentType: true,
          dailyRate: true,
          monthlySalary: true,
          currency: true,
          workTeam: true,
          status: true,
          assignedProjectId: true,
        },
        orderBy: [{ assignedProjectId: "asc" }, { fullName: "asc" }],
      });

      // Get existing attendance logs for this day across projects
      const logs = await prisma.attendance.findMany({
        where: {
          projectId: { in: projectIds },
          date: targetDate,
        },
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
        },
      });

      const logsMap = new Map();
      logs.forEach((log) => logsMap.set(log.employeeId, log));

      let sheetStatus = "DRAFT";
      if (logs.length > 0) {
        if (logs.every((l) => l.approvalStatus === "APPROVED")) {
          sheetStatus = "APPROVED";
        } else if (logs.some((l) => l.approvalStatus === "SUBMITTED")) {
          sheetStatus = "SUBMITTED";
        } else if (logs.some((l) => l.approvalStatus === "REJECTED")) {
          sheetStatus = "REJECTED";
        }
      }

      const roster = workers.map((worker) => {
        const proj = projectMap.get(worker.assignedProjectId) || null;
        const existing = logsMap.get(worker.id);

        if (existing) {
          const wage = calculateWorkerWage(worker.dailyRate, worker.monthlySalary, existing.status, existing.overtimeHours);
          return {
            id: existing.id,
            employeeId: worker.id,
            employeeCode: worker.employeeCode,
            fullName: worker.fullName,
            trade: worker.trade,
            employmentType: worker.employmentType,
            employeeStatus: worker.status,
            dailyRate: Number(worker.dailyRate) || 0,
            monthlySalary: Number(worker.monthlySalary) || 0,
            baseDailyRate: wage.baseDailyRate,
            hourlyRate: wage.hourlyRate,
            regularCost: wage.regularPay,
            overtimeCost: wage.overtimePay,
            calculatedCost: wage.totalCost,
            currency: worker.currency || "ETB",
            workTeam: existing.team || worker.workTeam || "Main Team",
            projectId: worker.assignedProjectId,
            projectName: proj?.projectName || existing.project?.projectName || "Unassigned",
            projectCode: proj?.projectCode || existing.project?.projectCode || "N/A",
            supervisorName: proj?.supervisor?.fullName || "Unassigned",
            status: existing.status,
            checkInTime: existing.checkInTime || "",
            checkOutTime: existing.checkOutTime || "",
            workHours: Number(existing.workHours) || 8.0,
            overtimeHours: Number(existing.overtimeHours) || 0.0,
            notes: existing.notes || "",
            approvalStatus: existing.approvalStatus,
            correctionReason: existing.correctionReason,
            isLogged: true,
          };
        }

        const defaultStatus = worker.status === "ON_LEAVE" ? "ON_LEAVE" : "PRESENT";
        const wage = calculateWorkerWage(worker.dailyRate, worker.monthlySalary, defaultStatus, 0);
        return {
          id: null,
          employeeId: worker.id,
          employeeCode: worker.employeeCode,
          fullName: worker.fullName,
          trade: worker.trade,
          employmentType: worker.employmentType,
          employeeStatus: worker.status,
          dailyRate: Number(worker.dailyRate) || 0,
          monthlySalary: Number(worker.monthlySalary) || 0,
          baseDailyRate: wage.baseDailyRate,
          hourlyRate: wage.hourlyRate,
          regularCost: wage.regularPay,
          overtimeCost: wage.overtimePay,
          calculatedCost: wage.totalCost,
          currency: worker.currency || "ETB",
          workTeam: worker.workTeam || "Main Team",
          projectId: worker.assignedProjectId,
          projectName: proj?.projectName || "Unassigned",
          projectCode: proj?.projectCode || "N/A",
          supervisorName: proj?.supervisor?.fullName || "Unassigned",
          status: defaultStatus,
          checkInTime: defaultStatus === "PRESENT" ? "08:00" : "",
          checkOutTime: defaultStatus === "PRESENT" ? "17:00" : "",
          workHours: defaultStatus === "PRESENT" ? 8.0 : 0.0,
          overtimeHours: 0.0,
          notes: "",
          approvalStatus: "DRAFT",
          correctionReason: null,
          isLogged: false,
        };
      });

      const presentCount = roster.filter((r) => ["PRESENT", "LATE"].includes(r.status)).length;
      const absentCount = roster.filter((r) => r.status === "ABSENT").length;
      const leaveCount = roster.filter((r) => r.status === "ON_LEAVE").length;
      const halfDayCount = roster.filter((r) => r.status === "HALF_DAY").length;
      const totalOT = roster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
      const totalLaborCost = Math.round(roster.reduce((sum, r) => sum + (Number(r.calculatedCost) || 0), 0) * 100) / 100;
      const regularLaborCost = Math.round(roster.reduce((sum, r) => sum + (Number(r.regularCost) || 0), 0) * 100) / 100;
      const overtimeLaborCost = Math.round(roster.reduce((sum, r) => sum + (Number(r.overtimeCost) || 0), 0) * 100) / 100;

      // Calculate each project's labor cost independently
      const projectSummaries = projects.map((proj) => {
        const pRoster = roster.filter((r) => r.projectId === proj.id);
        const pLogs = logs.filter((l) => l.projectId === proj.id);
        const pPresent = pRoster.filter((r) => ["PRESENT", "LATE"].includes(r.status)).length;
        const pAbsent = pRoster.filter((r) => r.status === "ABSENT").length;
        const pLeave = pRoster.filter((r) => r.status === "ON_LEAVE").length;
        const pHalf = pRoster.filter((r) => r.status === "HALF_DAY").length;
        const pOT = pRoster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
        const pTotalLaborCost = Math.round(pRoster.reduce((sum, r) => sum + (Number(r.calculatedCost) || 0), 0) * 100) / 100;
        const pRegularCost = Math.round(pRoster.reduce((sum, r) => sum + (Number(r.regularCost) || 0), 0) * 100) / 100;
        const pOvertimeCost = Math.round(pRoster.reduce((sum, r) => sum + (Number(r.overtimeCost) || 0), 0) * 100) / 100;

        let pStatus = "DRAFT";
        if (pLogs.length > 0) {
          if (pLogs.every((l) => l.approvalStatus === "APPROVED")) pStatus = "APPROVED";
          else if (pLogs.some((l) => l.approvalStatus === "SUBMITTED")) pStatus = "SUBMITTED";
          else if (pLogs.some((l) => l.approvalStatus === "REJECTED")) pStatus = "REJECTED";
        }
        return {
          projectId: proj.id,
          projectName: proj.projectName,
          projectCode: proj.projectCode,
          supervisorName: proj.supervisor?.fullName || "Unassigned",
          totalWorkers: pRoster.length,
          presentCount: pPresent,
          absentCount: pAbsent,
          leaveCount: pLeave,
          halfDayCount: pHalf,
          totalOvertimeHours: Math.round(pOT * 10) / 10,
          attendanceRate: pRoster.length > 0 ? Math.round(((pPresent + pHalf * 0.5) / pRoster.length) * 100) : 0,
          sheetStatus: pStatus,
          totalLaborCost: pTotalLaborCost,
          regularLaborCost: pRegularCost,
          overtimeLaborCost: pOvertimeCost,
          estimatedCost: pTotalLaborCost,
          currency: "ETB",
        };
      });

      return {
        projectId: "all",
        projectName: "All Active Projects",
        projectCode: "ALL",
        date: targetDate.toISOString().split("T")[0],
        sheetStatus,
        summary: {
          totalWorkers: roster.length,
          presentCount,
          absentCount,
          leaveCount,
          halfDayCount,
          totalOvertimeHours: Math.round(totalOT * 10) / 10,
          attendanceRate: roster.length > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / roster.length) * 100) : 0,
          totalLaborCost,
          regularLaborCost,
          overtimeLaborCost,
          currency: "ETB",
        },
        projectSummaries,
        roster,
      };
    }

    // Specific single project query
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectName: true,
        projectCode: true,
        supervisorId: true,
        supervisor: { select: { id: true, fullName: true } },
      },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!isManager && project.supervisorId !== userId) {
      throw new Error("You are not authorized to view attendance for this project");
    }

    // Get assigned workers
    const workers = await prisma.employee.findMany({
      where: {
        assignedProjectId: projectId,
        status: { in: ["ACTIVE", "ON_LEAVE", "PENDING_APPROVAL"] },
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        trade: true,
        phone: true,
        employmentType: true,
        dailyRate: true,
        monthlySalary: true,
        currency: true,
        workTeam: true,
        status: true,
        assignedProjectId: true,
      },
      orderBy: { fullName: "asc" },
    });

    // Get existing attendance logs for this day
    const logs = await prisma.attendance.findMany({
      where: {
        projectId,
        date: targetDate,
      },
    });

    const logsMap = new Map();
    logs.forEach((log) => logsMap.set(log.employeeId, log));

    let sheetStatus = "DRAFT";
    if (logs.length > 0) {
      if (logs.every((l) => l.approvalStatus === "APPROVED")) {
        sheetStatus = "APPROVED";
      } else if (logs.some((l) => l.approvalStatus === "SUBMITTED")) {
        sheetStatus = "SUBMITTED";
      } else if (logs.some((l) => l.approvalStatus === "REJECTED")) {
        sheetStatus = "REJECTED";
      }
    }

    const roster = workers.map((worker) => {
      const existing = logsMap.get(worker.id);
      if (existing) {
        const wage = calculateWorkerWage(worker.dailyRate, worker.monthlySalary, existing.status, existing.overtimeHours);
        return {
          id: existing.id,
          employeeId: worker.id,
          employeeCode: worker.employeeCode,
          fullName: worker.fullName,
          trade: worker.trade,
          employmentType: worker.employmentType,
          employeeStatus: worker.status,
          dailyRate: Number(worker.dailyRate) || 0,
          monthlySalary: Number(worker.monthlySalary) || 0,
          baseDailyRate: wage.baseDailyRate,
          hourlyRate: wage.hourlyRate,
          regularCost: wage.regularPay,
          overtimeCost: wage.overtimePay,
          calculatedCost: wage.totalCost,
          currency: worker.currency || "ETB",
          workTeam: existing.team || worker.workTeam || "Main Team",
          projectId,
          projectName: project.projectName,
          projectCode: project.projectCode,
          supervisorName: project.supervisor?.fullName || "Unassigned",
          status: existing.status,
          checkInTime: existing.checkInTime || "",
          checkOutTime: existing.checkOutTime || "",
          workHours: Number(existing.workHours) || 8.0,
          overtimeHours: Number(existing.overtimeHours) || 0.0,
          notes: existing.notes || "",
          approvalStatus: existing.approvalStatus,
          correctionReason: existing.correctionReason,
          isLogged: true,
        };
      }

      const defaultStatus = worker.status === "ON_LEAVE" ? "ON_LEAVE" : "PRESENT";
      const wage = calculateWorkerWage(worker.dailyRate, worker.monthlySalary, defaultStatus, 0);
      return {
        id: null,
        employeeId: worker.id,
        employeeCode: worker.employeeCode,
        fullName: worker.fullName,
        trade: worker.trade,
        employmentType: worker.employmentType,
        employeeStatus: worker.status,
        dailyRate: Number(worker.dailyRate) || 0,
        monthlySalary: Number(worker.monthlySalary) || 0,
        baseDailyRate: wage.baseDailyRate,
        hourlyRate: wage.hourlyRate,
        regularCost: wage.regularPay,
        overtimeCost: wage.overtimePay,
        calculatedCost: wage.totalCost,
        currency: worker.currency || "ETB",
        workTeam: worker.workTeam || "Main Team",
        projectId,
        projectName: project.projectName,
        projectCode: project.projectCode,
        supervisorName: project.supervisor?.fullName || "Unassigned",
        status: defaultStatus,
        checkInTime: defaultStatus === "PRESENT" ? "08:00" : "",
        checkOutTime: defaultStatus === "PRESENT" ? "17:00" : "",
        workHours: defaultStatus === "PRESENT" ? 8.0 : 0.0,
        overtimeHours: 0.0,
        notes: "",
        approvalStatus: "DRAFT",
        correctionReason: null,
        isLogged: false,
      };
    });

    const presentCount = roster.filter((r) => ["PRESENT", "LATE"].includes(r.status)).length;
    const absentCount = roster.filter((r) => r.status === "ABSENT").length;
    const leaveCount = roster.filter((r) => r.status === "ON_LEAVE").length;
    const halfDayCount = roster.filter((r) => r.status === "HALF_DAY").length;
    const totalOT = roster.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
    const totalLaborCost = Math.round(roster.reduce((sum, r) => sum + (Number(r.calculatedCost) || 0), 0) * 100) / 100;
    const regularLaborCost = Math.round(roster.reduce((sum, r) => sum + (Number(r.regularCost) || 0), 0) * 100) / 100;
    const overtimeLaborCost = Math.round(roster.reduce((sum, r) => sum + (Number(r.overtimeCost) || 0), 0) * 100) / 100;

    return {
      projectId,
      projectName: project.projectName,
      projectCode: project.projectCode,
      supervisorName: project.supervisor?.fullName || "Unassigned",
      date: targetDate.toISOString().split("T")[0],
      sheetStatus,
      summary: {
        totalWorkers: roster.length,
        presentCount,
        absentCount,
        leaveCount,
        halfDayCount,
        totalOvertimeHours: Math.round(totalOT * 10) / 10,
        attendanceRate: roster.length > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / roster.length) * 100) : 0,
        totalLaborCost,
        regularLaborCost,
        overtimeLaborCost,
        currency: "ETB",
      },
      roster,
    };
  },

  /**
   * Save / Record daily attendance (Draft or In-Progress)
   */
  async saveAttendance({ projectId, date, records }, actorId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN"].includes(userRole);
    if (!projectId || !date || !Array.isArray(records) || records.length === 0) {
      throw new Error("Project ID, date, and worker records are required");
    }

    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Validate that project exists and supervisor is assigned
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, supervisorId: true },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    if (!isSuperAdmin && project.supervisorId !== actorId) {
      throw new Error("You can only save attendance for your assigned project");
    }

    // Verify assigned workers only
    const validWorkers = await prisma.employee.findMany({
      where: { assignedProjectId: projectId },
      select: { id: true, employeeCode: true, fullName: true },
    });
    const validWorkerIds = new Set(validWorkers.map((w) => w.id));

    for (const r of records) {
      const empId = r.employeeId || r.workerId;
      if (!validWorkerIds.has(empId)) {
        throw new Error(`Worker with ID ${empId} is not assigned to this project`);
      }

      // Check checkOut >= checkIn if both provided
      if (r.checkInTime && r.checkOutTime) {
        const [inH, inM] = r.checkInTime.split(":").map(Number);
        const [outH, outM] = r.checkOutTime.split(":").map(Number);
        if (!isNaN(inH) && !isNaN(outH) && (outH * 60 + outM) < (inH * 60 + inM)) {
          throw new Error(`Check-out time (${r.checkOutTime}) cannot be earlier than check-in time (${r.checkInTime}) for worker ${r.fullName || empId}`);
        }
      }

      const calculatedHours = calculateHours(r.checkInTime, r.checkOutTime, r.status);
      const workHours = r.workHours !== undefined ? Number(r.workHours) : calculatedHours;
      const overtimeHours = Math.max(0, Number(r.overtimeHours) || 0.0);

      // Check existing record to avoid overwriting approved records without permission
      const existing = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: empId,
            date: targetDate,
          },
        },
      });

      if (existing && existing.approvalStatus === "APPROVED") {
        throw new Error(`Attendance for ${empId} on ${date} is already APPROVED and cannot be modified directly. Request a correction instead.`);
      }

      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: empId,
            date: targetDate,
          },
        },
        update: {
          projectId,
          status: r.status || "PRESENT",
          checkInTime: r.checkInTime || null,
          checkOutTime: r.checkOutTime || null,
          workHours,
          overtimeHours,
          notes: r.notes || null,
          team: r.workTeam || null,
          recordedById: actorId,
          approvalStatus: "DRAFT",
        },
        create: {
          employeeId: empId,
          projectId,
          date: targetDate,
          status: r.status || "PRESENT",
          checkInTime: r.checkInTime || null,
          checkOutTime: r.checkOutTime || null,
          workHours,
          overtimeHours,
          notes: r.notes || null,
          team: r.workTeam || null,
          recordedById: actorId,
          approvalStatus: "DRAFT",
        },
      });
    }

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "SAVE_SITE_ATTENDANCE_DRAFT",
          entityType: "Attendance",
          details: { projectId, date, recordsCount: records.length },
        },
      });
    } catch (e) {
      console.warn("Audit log warning:", e.message);
    }

    return {
      success: true,
      message: `Saved attendance draft for ${records.length} workers`,
      date,
      count: records.length,
    };
  },

  /**
   * Submit daily attendance to HR for review
   */
  async submitAttendance({ projectId, date }, actorId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN"].includes(userRole);
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectName: true, projectCode: true, supervisorId: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!isSuperAdmin && project.supervisorId !== actorId) {
      throw new Error("You can only submit attendance for your assigned project");
    }

    const existingLogs = await prisma.attendance.findMany({
      where: { projectId, date: targetDate },
    });

    if (existingLogs.length === 0) {
      throw new Error(`No attendance records logged for date ${date}. Please record attendance first.`);
    }

    const updated = await prisma.attendance.updateMany({
      where: { projectId, date: targetDate },
      data: {
        approvalStatus: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Notify Accountant for daily wage review and labor cost disbursement
    try {
      await notificationService.createNotification({
        recipientRole: "ACCOUNTANT",
        title: "Site Attendance Submitted for Wage Review",
        message: `Site Supervisor submitted daily attendance for project "${project?.projectName || projectId}" on ${date} (${updated.count} workers). Please review daily laborer hours and authorize wage payout.`,
        type: "ACTION",
        category: "ATTENDANCE",
        link: `/accountant/labor-costs?projectId=${projectId}`,
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "SUBMIT_SITE_ATTENDANCE_TO_ACCOUNTANT",
          entityType: "Attendance",
          details: { projectId, date, count: updated.count, routedTo: "ACCOUNTANT" },
        },
      });
    } catch (e) {
      console.warn("Submit notification warning:", e.message);
    }

    return {
      success: true,
      message: `Submitted attendance for ${updated.count} workers to Accountant for wage review`,
      count: updated.count,
      status: "SUBMITTED",
      routedTo: "ACCOUNTANT",
    };
  },

  /**
   * Request correction after submission
   */
  async requestAttendanceCorrection({ attendanceId, reason }, actorId) {
    if (!attendanceId || !reason || !reason.trim()) {
      throw new Error("Attendance record ID and correction reason are required");
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { employee: true, project: true },
    });

    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        approvalStatus: "DRAFT",
        correctionReason: reason.trim(),
      },
    });

    try {
      await notificationService.createNotification({
        recipientRole: "HR_MANAGER",
        title: "Attendance Correction Requested",
        message: `Correction requested for ${attendance.employee.fullName} (${attendance.project?.projectName}): ${reason.trim()}`,
        type: "WARNING",
        category: "ATTENDANCE",
        link: "/hr/attendance",
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "REQUEST_ATTENDANCE_CORRECTION",
          entityType: "Attendance",
          entityId: attendanceId,
          details: { reason: reason.trim() },
        },
      });
    } catch (e) {
      console.warn("Correction notification warning:", e.message);
    }

    return updated;
  },

  /**
   * Tasks assigned to Supervisor's projects
   */
  async getTasks(projectId, userId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN"].includes(userRole);
    const where = {};
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    } else if (!isSuperAdmin) {
      const authorizedProjects = await this.getAuthorizedProjects(userId, userRole);
      const pIds = authorizedProjects.map((p) => p.id);
      where.projectId = { in: pIds };
    }

    const tasks = await safeRows(`
      SELECT 
        t.id,
        t."projectId",
        t."taskName",
        t.description,
        t.priority,
        t.status,
        t."progressPercent",
        t."startDate",
        t."dueDate",
        t."completedAt",
        t."completionNotes",
        t.issues,
        t."createdAt",
        p."projectName",
        p."projectCode"
      FROM tasks t
      JOIN projects p ON t."projectId" = p.id
      ${where.projectId ? (typeof where.projectId === 'string' ? `WHERE t."projectId" = '${where.projectId}'` : `WHERE t."projectId" = ANY(ARRAY[${where.projectId.in.map(id => `'${id}'`).join(',')}])`) : ''}
      ORDER BY 
        CASE WHEN t.status = 'COMPLETED' THEN 2 ELSE 1 END,
        t."dueDate" ASC NULLS LAST
    `);

    return tasks;
  },

  /**
   * Update task daily progress & status
   */
  async updateTaskProgress(taskId, { progressPercent, status, notes, issues }, actorId) {
    const taskRows = await safeRows(`
      SELECT id, "projectId", "taskName", status, "progressPercent" 
      FROM tasks 
      WHERE id = $1
    `, [taskId]);

    if (!taskRows || taskRows.length === 0) {
      throw new Error("Task not found");
    }

    const currentTask = taskRows[0];
    const newProgress = Math.max(0, Math.min(100, parseInt(progressPercent, 10) || 0));
    let newStatus = status || currentTask.status;

    if (newProgress === 100 && newStatus !== "COMPLETED") {
      newStatus = "COMPLETED";
    } else if (newProgress > 0 && newProgress < 100 && newStatus === "PENDING") {
      newStatus = "IN_PROGRESS";
    }

    const completedAt = newStatus === "COMPLETED" ? new Date() : null;

    await pool.query(`
      UPDATE tasks
      SET 
        "progressPercent" = $1,
        status = $2::"TaskStatus",
        "completionNotes" = $3,
        issues = $4,
        "completedAt" = $5,
        "updatedAt" = NOW()
      WHERE id = $6
    `, [newProgress, newStatus, notes || null, issues || null, completedAt, taskId]);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "UPDATE_TASK_PROGRESS",
          entityType: "Task",
          entityId: taskId,
          details: {
            taskName: currentTask.taskName,
            oldProgress: currentTask.progressPercent,
            newProgress,
            newStatus,
            issues: issues || null,
          },
        },
      });
    } catch (e) {
      console.warn("Audit warning:", e.message);
    }

    return {
      id: taskId,
      progressPercent: newProgress,
      status: newStatus,
      notes,
      issues,
    };
  },

  /**
   * Daily Site Activities (Site Reports)
   */
  async getDailySiteActivities(projectId, date) {
    const where = {};
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }
    if (date) {
      where.activityDate = new Date(date);
    }

    const activities = await safeRows(`
      SELECT 
        dsa.id,
        dsa."projectId",
        dsa."activityDate",
        dsa."activityDescription",
        dsa."workCompleted",
        dsa."laborCount",
        dsa."materialsUsed",
        dsa.issues,
        dsa."weatherConditions",
        dsa."safetyObservations",
        dsa.notes,
        dsa."createdAt",
        p."projectName",
        p."projectCode"
      FROM daily_site_activities dsa
      JOIN projects p ON dsa."projectId" = p.id
      ${where.projectId ? `WHERE dsa."projectId" = '${where.projectId}'` : ''}
      ORDER BY dsa."activityDate" DESC, dsa."createdAt" DESC
      LIMIT 50
    `);

    return activities;
  },

  async recordDailySiteActivity(data, actorId) {
    const {
      projectId,
      activityDate,
      activityDescription,
      workCompleted,
      laborCount,
      materialsUsed,
      issues,
      weatherConditions,
      safetyObservations,
      notes,
    } = data;

    if (!projectId || !activityDescription || !workCompleted) {
      throw new Error("Project, activity description, and work completed summary are required");
    }

    const id = `dsa-${Date.now()}`;
    const targetDate = activityDate ? new Date(activityDate) : new Date();

    await pool.query(`
      INSERT INTO daily_site_activities (
        id, "projectId", "siteEngineerId", "activityDate", "activityDescription",
        "workCompleted", "laborCount", "materialsUsed", issues, "weatherConditions",
        "safetyObservations", notes, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      )
    `, [
      id,
      projectId,
      actorId,
      targetDate,
      activityDescription,
      workCompleted,
      parseInt(laborCount, 10) || 0,
      materialsUsed || null,
      issues || null,
      weatherConditions || "Clear",
      safetyObservations || "Normal operations, PPE observed",
      notes || null
    ]);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "RECORD_DAILY_SITE_ACTIVITY",
          entityType: "DailySiteActivity",
          entityId: id,
          details: { projectId, activityDate: targetDate, workCompleted },
        },
      });
    } catch (e) {
      console.warn("Audit warning:", e.message);
    }

    return { id, projectId, workCompleted, status: "RECORDED" };
  },

  /**
   * Materials & Material Requests
   */
  async getMaterials() {
    const materials = await safeRows(`
      SELECT 
        m.id,
        m.code,
        m.name,
        m.unit,
        m."reorderLevel",
        m."currentStock",
        m.description,
        m."isActive",
        mc.name as "categoryName"
      FROM materials m
      LEFT JOIN material_categories mc ON m."categoryId" = mc.id
      WHERE m."isActive" = true
      ORDER BY m.name ASC
    `);

    return materials;
  },

  async getMaterialRequests(projectId, userId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN"].includes(userRole);
    let filterClause = "";
    if (projectId && projectId !== "all") {
      filterClause = `WHERE mr."projectId" = '${projectId}'`;
    } else if (!isSuperAdmin) {
      const authorizedProjects = await this.getAuthorizedProjects(userId, userRole);
      const pIds = authorizedProjects.map((p) => `'${p.id}'`).join(",");
      if (pIds) {
        filterClause = `WHERE mr."projectId" IN (${pIds})`;
      }
    }

    const requests = await safeRows(`
      SELECT 
        mr.id,
        mr."requestNumber",
        mr."projectId",
        mr."requestedById",
        mr."requestedMaterials",
        mr."totalEstimatedCost",
        mr.urgency,
        mr.status,
        mr.justification,
        mr."deliveryLocation",
        mr."createdAt",
        p."projectName",
        p."projectCode",
        p."projectManagerId",
        pm."fullName" as "projectManagerName",
        u."fullName" as "requesterName"
      FROM material_requests mr
      JOIN projects p ON mr."projectId" = p.id
      LEFT JOIN users pm ON p."projectManagerId" = pm.id
      LEFT JOIN users u ON mr."requestedById" = u.id
      ${filterClause}
      ORDER BY mr."createdAt" DESC
      LIMIT 100
    `);

    return requests;
  },

  async createMaterialRequest(data, actorId) {
    const {
      projectId,
      requestedMaterials,
      quantity,
      unit,
      urgency = "NORMAL",
      justification,
      deliveryLocation,
      items = [],
    } = data;

    if (!projectId || !requestedMaterials) {
      throw new Error("Project and requested materials description are required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, projectCode: true, projectManagerId: true },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    const count = await safeCount(`SELECT COUNT(*)::int as count FROM material_requests`);
    const reqNum = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const id = `mr-${Date.now()}`;

    await pool.query(`
      INSERT INTO material_requests (
        id, "requestNumber", "projectId", "requestedById", "requestedMaterials",
        urgency, status, justification, "deliveryLocation", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6::"RequestUrgency", 'PENDING'::"MaterialRequestStatus", $7, $8, NOW(), NOW()
      )
    `, [
      id,
      reqNum,
      projectId,
      actorId,
      requestedMaterials,
      urgency,
      justification || null,
      deliveryLocation || project.projectName
    ]);

    // If specific structured items provided, insert them into material_request_items
    if (Array.isArray(items) && items.length > 0) {
      for (const itm of items) {
        const itemId = `mri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        await pool.query(`
          INSERT INTO material_request_items (
            id, "materialRequestId", "itemName", quantity, unit, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [itemId, id, itm.itemName || requestedMaterials, Number(itm.quantity) || 1, itm.unit || unit || "PCS"]);
      }
    }

    // Trigger notification directly to Project Manager (Not to Accountant)
    try {
      await notificationService.createNotification({
        recipientUserId: project.projectManagerId || null,
        recipientRole: "PROJECT_MANAGER",
        title: "New Site Material Requisition (Pending Review)",
        message: `Site Supervisor submitted request ${reqNum} for "${project.projectName}" directly to Project Manager for approval: ${requestedMaterials} (${urgency} priority)`,
        type: urgency === "CRITICAL" ? "WARNING" : "INFO",
        category: "MATERIAL",
        link: "/supervisor/materials",
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "CREATE_MATERIAL_REQUEST",
          entityType: "MaterialRequest",
          entityId: id,
          details: {
            requestNumber: reqNum,
            projectId,
            urgency,
            requestedMaterials,
            routedTo: "PROJECT_MANAGER",
            projectManagerId: project.projectManagerId || null,
          },
        },
      });
    } catch (e) {
      console.warn("Notification warning:", e.message);
    }

    return {
      id,
      requestNumber: reqNum,
      projectId,
      requestedMaterials,
      urgency,
      status: "PENDING",
      routedTo: "PROJECT_MANAGER",
    };
  },

  /**
   * Site Incidents & Safety Concerns
   */
  async getSiteIncidents(projectId, userId, userRole) {
    const isSuperAdmin = ["GENERAL_MANAGER", "ADMIN"].includes(userRole);
    const where = {};
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    } else if (!isSuperAdmin) {
      const authorizedProjects = await this.getAuthorizedProjects(userId, userRole);
      where.projectId = { in: authorizedProjects.map((p) => p.id) };
    }

    const incidents = await prisma.siteIncident.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [
        { status: "asc" },
        { incidentDate: "desc" },
      ],
    });

    return incidents;
  },

  async reportSiteIncident(data, actorId) {
    const {
      projectId,
      title,
      description,
      incidentType = "SAFETY",
      severity = "MEDIUM",
      incidentDate,
      location,
      photos,
    } = data;

    if (!projectId || !title || !description) {
      throw new Error("Project, title, and incident description are required");
    }

    const targetDate = incidentDate ? new Date(incidentDate) : new Date();

    const incident = await prisma.siteIncident.create({
      data: {
        projectId,
        reportedById: actorId,
        title: title.trim(),
        description: description.trim(),
        incidentType,
        severity,
        incidentDate: targetDate,
        location: location || null,
        status: "OPEN",
        photos: photos || null,
      },
      include: {
        project: { select: { projectName: true } },
      },
    });

    try {
      await notificationService.createNotification({
        title: `Site Incident Alert (${severity})`,
        message: `${incidentType} incident on "${incident.project.projectName}": ${title}`,
        type: severity === "CRITICAL" || severity === "HIGH" ? "WARNING" : "INFO",
        category: "INCIDENT",
        link: "/supervisor/incidents",
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "REPORT_SITE_INCIDENT",
          entityType: "SiteIncident",
          entityId: incident.id,
          details: { projectId, severity, title, incidentType },
        },
      });
    } catch (e) {
      console.warn("Incident notification warning:", e.message);
    }

    return incident;
  },

  async resolveSiteIncident(id, { resolution, status = "RESOLVED" }, actorId) {
    if (!id || !resolution) {
      throw new Error("Incident ID and resolution notes are required");
    }

    const updated = await prisma.siteIncident.update({
      where: { id },
      data: {
        status,
        resolution: resolution.trim(),
        resolvedAt: new Date(),
        resolvedById: actorId,
      },
    });

    return updated;
  },

  /**
   * Supervisor Comprehensive Dashboard Metrics
   */
  async getDashboardMetrics(userId, userRole) {
    const projects = await this.getAuthorizedProjects(userId, userRole);
    const projectIds = projects.map((p) => p.id);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (projectIds.length === 0) {
      return {
        todayDate: today.toISOString().split("T")[0],
        assignedProjectsCount: 0,
        assignedProjects: [],
        workforce: {
          totalWorkers: 0,
          presentCount: 0,
          absentCount: 0,
          leaveCount: 0,
          attendanceLoggedCount: 0,
          pendingSubmissionCount: 0,
          attendanceRate: 0,
        },
        tasks: {
          totalTasks: 0,
          dueToday: 0,
          overdue: 0,
          completed: 0,
        },
        materials: {
          pendingRequests: 0,
          approvedRequests: 0,
          totalRequests: 0,
        },
        incidents: {
          openIncidents: 0,
        },
        pendingSheetsCount: 0,
      };
    }

    // Today's attendance across authorized projects
    const todayLogs = await prisma.attendance.findMany({
      where: {
        projectId: { in: projectIds },
        date: today,
      },
      select: { status: true, approvalStatus: true, workHours: true, overtimeHours: true },
    });

    const presentCount = todayLogs.filter((l) => ["PRESENT", "LATE"].includes(l.status)).length;
    const absentCount = todayLogs.filter((l) => l.status === "ABSENT").length;
    const leaveCount = todayLogs.filter((l) => l.status === "ON_LEAVE").length;
    const pendingSheetsCount = await prisma.attendance.groupBy({
      by: ["date", "projectId"],
      where: {
        projectId: { in: projectIds },
        approvalStatus: "SUBMITTED",
      },
    }).then((r) => r.length).catch(() => 0);

    // Active workers across projects
    const totalWorkers = await prisma.employee.count({
      where: {
        assignedProjectId: { in: projectIds },
        status: { in: ["ACTIVE", "ON_LEAVE"] },
      },
    });

    // Overdue tasks
    const tasksDue = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(*)::int as "totalTasks",
        COUNT(CASE WHEN status != 'COMPLETED' AND "dueDate" < NOW() THEN 1 END)::int as "overdueTasks",
        COUNT(CASE WHEN status != 'COMPLETED' AND DATE("dueDate") = CURRENT_DATE THEN 1 END)::int as "dueTodayTasks",
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as "completedTasks"
      FROM tasks
      WHERE "projectId" = ANY(ARRAY[${projectIds.map(id => `'${id}'`).join(',')}])
    `).then(r => r[0] || {}).catch(() => ({ totalTasks: 0, overdueTasks: 0, dueTodayTasks: 0, completedTasks: 0 }));

    // Material requests by status
    const matRequestsSummary = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int as "pendingRequests",
        COUNT(CASE WHEN status = 'APPROVED' THEN 1 END)::int as "approvedRequests",
        COUNT(*)::int as "totalRequests"
      FROM material_requests
      WHERE "projectId" = ANY(ARRAY[${projectIds.map(id => `'${id}'`).join(',')}])
    `).then(r => r[0] || {}).catch(() => ({ pendingRequests: 0, approvedRequests: 0, totalRequests: 0 }));

    // Open site incidents
    const openIncidents = await prisma.siteIncident.count({
      where: {
        projectId: { in: projectIds },
        status: { in: ["OPEN", "INVESTIGATING"] },
      },
    }).catch(() => 0);

    return {
      todayDate: today.toISOString().split("T")[0],
      assignedProjectsCount: projects.length,
      assignedProjects: projects,
      workforce: {
        totalWorkers,
        presentCount,
        absentCount,
        leaveCount,
        attendanceLoggedCount: todayLogs.length,
        pendingSubmissionCount: todayLogs.filter((l) => l.approvalStatus === "DRAFT").length,
        attendanceRate: totalWorkers > 0 ? Math.round((presentCount / totalWorkers) * 100) : 0,
      },
      tasks: {
        totalTasks: tasksDue.totalTasks || 0,
        dueToday: tasksDue.dueTodayTasks || 0,
        overdue: tasksDue.overdueTasks || 0,
        completed: tasksDue.completedTasks || 0,
      },
      materials: {
        pendingRequests: matRequestsSummary.pendingRequests || 0,
        approvedRequests: matRequestsSummary.approvedRequests || 0,
        totalRequests: matRequestsSummary.totalRequests || 0,
      },
      incidents: {
        openIncidents,
      },
      pendingSheetsCount,
    };
  },
};
