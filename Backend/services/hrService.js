import { hrRepository } from "../repositories/hrRepository.js";
import prisma from "../config/prisma.js";
import { notificationService } from "./notificationService.js";
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_APPROVAL_STATUS,
  ATTENDANCE_VALUE_RULES,
} from "../constants/hrConstants.js";

function calculateWorkHours(checkIn, checkOut, status) {
  if (status === "ABSENT" || status === "ON_LEAVE" || status === "HOLIDAY" || status === "REST_DAY") {
    return 0.0;
  }
  if (status === "HALF_DAY") {
    return 4.0;
  }
  if (!checkIn || !checkOut) {
    return ATTENDANCE_VALUE_RULES[status]?.defaultHours ?? 8.0;
  }
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
    return 8.0;
  }
  let durationMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }
  // Deduct 1 hour lunch/break if 5+ hours
  if (durationMinutes >= 300) {
    durationMinutes -= 60;
  }
  const hours = Math.max(0, durationMinutes / 60);
  return Math.round(hours * 100) / 100;
}

export const hrService = {
  async generateNextEmployeeCode() {
    const latest = await hrRepository.findLatestEmployee();
    if (!latest || !latest.employeeCode) {
      return "EMP-0001";
    }

    const match = latest.employeeCode.match(/EMP-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `EMP-${String(nextNum).padStart(4, "0")}`;
    }

    return `EMP-${Date.now().toString().slice(-4)}`;
  },

  async getEmployees({
    page = 1,
    limit = 10,
    search = "",
    trade = "",
    employmentType = "",
    status = "",
    assignedProjectId = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { employeeCode: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    if (trade && trade.trim()) {
      where.trade = trade.trim();
    }

    if (employmentType && employmentType.trim()) {
      where.employmentType = employmentType.trim();
    }

    if (status && status.trim()) {
      where.status = status.trim();
    }

    if (assignedProjectId === "unassigned") {
      where.assignedProjectId = null;
    } else if (assignedProjectId && assignedProjectId.trim()) {
      where.assignedProjectId = assignedProjectId.trim();
    }

    const allowedSortFields = ["fullName", "employeeCode", "trade", "createdAt", "status"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDir = sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

    const [employees, total] = await Promise.all([
      hrRepository.findEmployees({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir },
      }),
      hrRepository.countEmployees({ where }),
    ]);

    return {
      employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  async getEmployeeById(id) {
    const employee = await hrRepository.findEmployeeById(id);
    if (!employee) {
      throw new Error("Employee not found");
    }
    return employee;
  },

  async createEmployee(data, actorId) {
    let code = data.employeeCode?.trim();
    if (!code) {
      code = await this.generateNextEmployeeCode();
    } else {
      const existing = await hrRepository.findEmployeeByCode(code);
      if (existing) {
        throw new Error("Employee code already exists");
      }
    }

    if (data.assignedProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.assignedProjectId },
      });
      if (!project) {
        throw new Error("Assigned project not found");
      }
    }

    const employee = await hrRepository.createEmployee({
      employeeCode: code,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email ? data.email.trim().toLowerCase() : null,
      trade: data.trade,
      employmentType: data.employmentType || "DAILY_LABORER",
      dailyRate: data.dailyRate ? Number(data.dailyRate) : null,
      monthlySalary: data.monthlySalary ? Number(data.monthlySalary) : null,
      currency: data.currency || "ETB",
      status: data.status || "ACTIVE",
      nationalId: data.nationalId ? data.nationalId.trim() : null,
      assignedProjectId: data.assignedProjectId || null,
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "CREATE_EMPLOYEE",
          entityType: "Employee",
          entityId: employee.id,
          details: {
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            trade: employee.trade,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    // Trigger real-time notification
    try {
      await notificationService.createNotification({
        title: "New Worker Registered",
        message: `${employee.fullName} (${employee.trade}) registered with ID ${employee.employeeCode}`,
        type: "SUCCESS",
        category: "WORKFORCE",
        link: "/hr/workers",
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr.message);
    }

    return employee;
  },

  async updateEmployee(id, data, actorId) {
    const existing = await hrRepository.findEmployeeById(id);
    if (!existing) {
      throw new Error("Employee not found");
    }

    if (data.assignedProjectId && data.assignedProjectId !== existing.assignedProjectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.assignedProjectId },
      });
      if (!project) {
        throw new Error("Assigned project not found");
      }
    }

    const updateData = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.email !== undefined) updateData.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.trade !== undefined) updateData.trade = data.trade;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.dailyRate !== undefined) updateData.dailyRate = data.dailyRate ? Number(data.dailyRate) : null;
    if (data.monthlySalary !== undefined) updateData.monthlySalary = data.monthlySalary ? Number(data.monthlySalary) : null;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.nationalId !== undefined) updateData.nationalId = data.nationalId ? data.nationalId.trim() : null;
    if (data.assignedProjectId !== undefined) updateData.assignedProjectId = data.assignedProjectId || null;

    const updated = await hrRepository.updateEmployee(id, updateData);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "UPDATE_EMPLOYEE",
          entityType: "Employee",
          entityId: updated.id,
          details: { updatedFields: Object.keys(updateData) },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    return updated;
  },

  async deleteEmployee(id, actorId) {
    const existing = await hrRepository.findEmployeeById(id);
    if (!existing) {
      throw new Error("Employee not found");
    }

    const result = await hrRepository.deleteEmployee(id);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "DELETE_EMPLOYEE",
          entityType: "Employee",
          entityId: id,
          details: {
            employeeCode: existing.employeeCode,
            fullName: existing.fullName,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    return result;
  },

  async recordDailyAttendance(date, projectId, records, actorId, userRole = "HR_MANAGER", saveAction = "SAVE") {
    const isManager = ["HR_MANAGER", "GENERAL_MANAGER"].includes(userRole);

    let targetApprovalStatus = "APPROVED";
    if (saveAction === "DRAFT") {
      targetApprovalStatus = "DRAFT";
    } else if (saveAction === "SUBMIT") {
      targetApprovalStatus = "SUBMITTED";
    } else if (!isManager) {
      targetApprovalStatus = "SUBMITTED";
    }

    const formattedRecords = records.map((r) => {
      const status = r.status || "PRESENT";
      const checkInTime = r.checkInTime || null;
      const checkOutTime = r.checkOutTime || null;
      const workHours = r.workHours !== undefined && r.workHours !== null && r.workHours !== ""
        ? Number(r.workHours)
        : calculateWorkHours(checkInTime, checkOutTime, status);
      const overtimeHours = r.overtimeHours ? Number(r.overtimeHours) : 0;

      return {
        employeeId: r.employeeId,
        projectId: projectId && projectId !== "all" ? projectId : (r.projectId || null),
        date,
        status,
        checkInTime,
        checkOutTime,
        workHours,
        overtimeHours,
        notes: r.notes || null,
        approvalStatus: r.approvalStatus || targetApprovalStatus,
        recordedById: actorId,
        correctionReason: r.correctionReason || null,
        submittedAt: targetApprovalStatus === "SUBMITTED" ? new Date() : (r.submittedAt ? new Date(r.submittedAt) : null),
        reviewedById: targetApprovalStatus === "APPROVED" ? actorId : null,
        reviewedAt: targetApprovalStatus === "APPROVED" ? new Date() : null,
      };
    });

    const result = await hrRepository.upsertAttendanceBatch(formattedRecords);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: saveAction === "SUBMIT" ? "SUBMIT_ATTENDANCE" : isManager ? "APPROVE_ATTENDANCE" : "RECORD_ATTENDANCE",
          entityType: "Attendance",
          details: {
            date,
            projectId: projectId || "ALL",
            recordCount: records.length,
            approvalStatus: targetApprovalStatus,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    // Trigger real-time notifications
    try {
      if (targetApprovalStatus === "SUBMITTED") {
        await notificationService.createNotification({
          recipientRole: "HR_MANAGER",
          title: "Attendance Submitted for Approval",
          message: `Site attendance for ${records.length} workers on ${date} was submitted for review`,
          type: "INFO",
          category: "ATTENDANCE",
          link: "/hr/attendance",
        });
      } else if (targetApprovalStatus === "APPROVED") {
        await notificationService.createNotification({
          title: "Attendance Sheet Verified",
          message: `Daily attendance logged & verified for ${records.length} worker(s) on ${date}`,
          type: "SUCCESS",
          category: "ATTENDANCE",
          link: "/hr/attendance",
        });
      }

      const highOvertimeWorkers = formattedRecords.filter((r) => r.overtimeHours >= 4);
      if (highOvertimeWorkers.length > 0) {
        await notificationService.createNotification({
          title: "Overtime Threshold Alert",
          message: `${highOvertimeWorkers.length} worker(s) recorded 4+ overtime hours on ${date}`,
          type: "WARNING",
          category: "ATTENDANCE",
          link: "/hr/attendance",
        });
      }
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr.message);
    }

    return {
      count: result.length,
      date,
      approvalStatus: targetApprovalStatus,
    };
  },

  async getDailyAttendance(date, projectId) {
    // 1. Fetch all active employees (optionally filtered by project)
    const empWhere = { status: { in: ["ACTIVE", "ON_LEAVE"] } };
    if (projectId && projectId !== "all") {
      empWhere.assignedProjectId = projectId;
    }

    const targetDateStart = new Date(date);
    targetDateStart.setUTCHours(0, 0, 0, 0);
    const targetDateEnd = new Date(date);
    targetDateEnd.setUTCHours(23, 59, 59, 999);

    const [employees, activeLeaves, attendanceLogs] = await Promise.all([
      prisma.employee.findMany({
        where: empWhere,
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          trade: true,
          phone: true,
          dailyRate: true,
          monthlySalary: true,
          employmentType: true,
          assignedProjectId: true,
          assignedProject: {
            select: {
              id: true,
              projectName: true,
              projectCode: true,
            },
          },
        },
      }),
      prisma.leaveRequest.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: targetDateEnd },
          endDate: { gte: targetDateStart },
        },
        select: {
          employeeId: true,
          leaveType: true,
        },
      }),
      hrRepository.findAttendance({
        date,
        projectId: projectId && projectId !== "all" ? projectId : undefined,
      }),
    ]);

    const leaveMap = new Map();
    activeLeaves.forEach((l) => leaveMap.set(l.employeeId, l));

    const logsMap = new Map();
    attendanceLogs.forEach((log) => {
      logsMap.set(log.employeeId, log);
    });

    // 2. Merge so every relevant employee has an entry
    const merged = employees.map((emp) => {
      const log = logsMap.get(emp.id);
      const leave = leaveMap.get(emp.id);

      const status = log ? log.status : leave ? "ON_LEAVE" : "PRESENT";
      const checkInTime = log ? log.checkInTime : (status === "PRESENT" || status === "LATE" ? "08:00" : null);
      const checkOutTime = log ? log.checkOutTime : (status === "PRESENT" ? "17:00" : status === "HALF_DAY" ? "12:00" : null);
      const workHours = log && log.workHours !== null && log.workHours !== undefined
        ? Number(log.workHours)
        : calculateWorkHours(checkInTime, checkOutTime, status);
      const overtimeHours = log ? Number(log.overtimeHours) : 0;
      const notes = log ? (log.notes || "") : (leave ? `On approved ${leave.leaveType.toLowerCase()} leave` : "");
      const approvalStatus = log ? (log.approvalStatus || "APPROVED") : "DRAFT";

      return {
        id: log ? log.id : null,
        employee: emp,
        status,
        checkInTime,
        checkOutTime,
        workHours,
        overtimeHours,
        notes,
        approvalStatus,
        recordedById: log?.recordedById || null,
        reviewedById: log?.reviewedById || null,
        correctionReason: log?.correctionReason || null,
        submittedAt: log?.submittedAt || null,
        reviewedAt: log?.reviewedAt || null,
        isLogged: !!log,
        isOnApprovedLeave: !!leave,
      };
    });

    const presentCount = merged.filter((r) => r.status === "PRESENT").length;
    const lateCount = merged.filter((r) => r.status === "LATE").length;
    const halfDayCount = merged.filter((r) => r.status === "HALF_DAY").length;
    const absentCount = merged.filter((r) => r.status === "ABSENT").length;
    const onLeaveCount = merged.filter((r) => r.status === "ON_LEAVE").length;
    const holidayCount = merged.filter((r) => r.status === "HOLIDAY").length;
    const restDayCount = merged.filter((r) => r.status === "REST_DAY").length;
    const totalOvertime = merged.reduce((sum, r) => sum + (Number(r.overtimeHours) || 0), 0);
    const totalWorkHours = merged.reduce((sum, r) => sum + (Number(r.workHours) || 0), 0);

    const workingWorkers = merged.filter((r) => !["HOLIDAY", "REST_DAY", "ON_LEAVE"].includes(r.status)).length;
    const effectivePresent = presentCount + lateCount + halfDayCount * 0.5;
    const attendancePercentage = workingWorkers > 0 ? Math.round((effectivePresent / workingWorkers) * 100) : 0;

    let sheetStatus = "DRAFT";
    if (attendanceLogs.length > 0) {
      if (attendanceLogs.every((l) => l.approvalStatus === "APPROVED")) sheetStatus = "APPROVED";
      else if (attendanceLogs.some((l) => l.approvalStatus === "REJECTED")) sheetStatus = "REJECTED";
      else if (attendanceLogs.some((l) => l.approvalStatus === "SUBMITTED")) sheetStatus = "SUBMITTED";
    }

    return {
      date,
      projectId: projectId || "all",
      totalWorkers: employees.length,
      loggedCount: attendanceLogs.length,
      approvalStatus: sheetStatus,
      summary: {
        totalWorkers: employees.length,
        workingWorkers,
        presentCount,
        lateCount,
        halfDayCount,
        absentCount,
        onLeaveCount,
        holidayCount,
        restDayCount,
        totalOvertime: Math.round(totalOvertime * 10) / 10,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        attendancePercentage,
      },
      roster: merged,
    };
  },

  async submitDailyAttendance(date, projectId, actorId) {
    const where = {
      date: new Date(date),
    };
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    const updated = await prisma.attendance.updateMany({
      where,
      data: {
        approvalStatus: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "SUBMIT_ATTENDANCE_SHEET",
          entityType: "Attendance",
          details: { date, projectId: projectId || "ALL", count: updated.count },
        },
      });

      await notificationService.createNotification({
        recipientRole: "HR_MANAGER",
        title: "Attendance Sheet Submitted",
        message: `Attendance sheet for ${date} has been submitted for review (${updated.count} records)`,
        type: "INFO",
        category: "ATTENDANCE",
        link: "/hr/attendance",
      });
    } catch (err) {
      console.warn("Submit notification/audit failed:", err.message);
    }

    return { count: updated.count, status: "SUBMITTED", date };
  },

  async reviewDailyAttendance(date, projectId, { status, reviewerNote }, actorId) {
    const updated = await hrRepository.updateBatchApprovalStatus({
      date,
      projectId,
      approvalStatus: status,
      reviewedById: actorId,
      reviewerNote,
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: status === "APPROVED" ? "APPROVE_ATTENDANCE" : "REJECT_ATTENDANCE",
          entityType: "Attendance",
          details: { date, projectId: projectId || "ALL", status, reviewerNote, count: updated.count },
        },
      });

      await notificationService.createNotification({
        title: `Attendance Sheet ${status === "APPROVED" ? "Approved" : "Returned for Correction"}`,
        message: `Daily attendance on ${date} was marked as ${status.toLowerCase()}${reviewerNote ? `: ${reviewerNote}` : ""}`,
        type: status === "APPROVED" ? "SUCCESS" : "WARNING",
        category: "ATTENDANCE",
        link: "/hr/attendance",
      });
    } catch (err) {
      console.warn("Review notification/audit failed:", err.message);
    }

    return { count: updated.count, status, date };
  },

  async updateSingleAttendance(id, data, actorId, userRole) {
    const existing = await hrRepository.findAttendanceById(id);
    if (!existing) {
      throw new Error("Attendance record not found");
    }

    const isManager = ["HR_MANAGER", "GENERAL_MANAGER"].includes(userRole);
    if (existing.approvalStatus === "APPROVED" && !isManager) {
      throw new Error("Only HR Managers can edit an approved attendance record");
    }

    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) updateData.checkOutTime = data.checkOutTime;
    if (data.workHours !== undefined) updateData.workHours = Number(data.workHours);
    if (data.overtimeHours !== undefined) updateData.overtimeHours = Number(data.overtimeHours);
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.approvalStatus !== undefined) updateData.approvalStatus = data.approvalStatus;
    if (data.correctionReason !== undefined) updateData.correctionReason = data.correctionReason;

    const updated = await hrRepository.updateAttendance(id, updateData);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "UPDATE_ATTENDANCE_RECORD",
          entityType: "Attendance",
          entityId: id,
          details: {
            employeeCode: existing.employee?.employeeCode,
            date: existing.date,
            changes: updateData,
            correctionReason: data.correctionReason || null,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    return updated;
  },

  async getAttendanceDashboard({ projectId, date }) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Today's daily attendance stats
    const dailyData = await this.getDailyAttendance(targetDateStr, projectId);

    // 14-day trends:
    const daysTrend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setUTCDate(d.getUTCDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const start = new Date(d);
      start.setUTCHours(0, 0, 0, 0);

      const logs = await prisma.attendance.findMany({
        where: {
          date: start,
          ...(projectId && projectId !== "all" ? { projectId } : {}),
        },
        select: { status: true, overtimeHours: true, workHours: true },
      });

      const pCount = logs.filter((l) => l.status === "PRESENT").length;
      const lCount = logs.filter((l) => l.status === "LATE").length;
      const hCount = logs.filter((l) => l.status === "HALF_DAY").length;
      const aCount = logs.filter((l) => l.status === "ABSENT").length;
      const leaveCount = logs.filter((l) => l.status === "ON_LEAVE").length;
      const totalWorkers = logs.length;
      const effectivePresent = pCount + lCount + hCount * 0.5;
      const rate = totalWorkers > 0 ? Math.round((effectivePresent / totalWorkers) * 100) : 0;

      daysTrend.push({
        date: dStr,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        present: pCount,
        late: lCount,
        halfDay: hCount,
        absent: aCount,
        onLeave: leaveCount,
        total: totalWorkers,
        rate,
      });
    }

    // Project-wise attendance summary for targetDate
    const allProjects = await prisma.project.findMany({
      where: { archivedAt: null },
      select: { id: true, projectName: true, projectCode: true, location: true },
    });

    const projectSummaries = await Promise.all(
      allProjects.map(async (p) => {
        const workersCount = await prisma.employee.count({
          where: { assignedProjectId: p.id, status: { in: ["ACTIVE", "ON_LEAVE"] } },
        });

        const logs = await prisma.attendance.findMany({
          where: { projectId: p.id, date: targetDate },
          select: { status: true, approvalStatus: true },
        });

        const pCount = logs.filter((l) => l.status === "PRESENT").length;
        const lCount = logs.filter((l) => l.status === "LATE").length;
        const hCount = logs.filter((l) => l.status === "HALF_DAY").length;
        const aCount = logs.filter((l) => l.status === "ABSENT").length;
        const effective = pCount + lCount + hCount * 0.5;
        const rate = workersCount > 0 ? Math.round((effective / workersCount) * 100) : (logs.length > 0 ? 100 : 0);

        let status = "NO_DATA";
        if (logs.length > 0) {
          if (logs.every((l) => l.approvalStatus === "APPROVED")) status = "APPROVED";
          else if (logs.some((l) => l.approvalStatus === "SUBMITTED")) status = "SUBMITTED";
          else status = "DRAFT";
        }

        return {
          id: p.id,
          projectName: p.projectName,
          projectCode: p.projectCode,
          location: p.location,
          assignedWorkers: workersCount,
          present: pCount,
          absent: aCount,
          late: lCount,
          halfDay: hCount,
          attendanceRate: rate,
          status,
        };
      })
    );

    // Pending approval sheets
    const pendingSheets = await prisma.attendance.groupBy({
      by: ["date", "projectId"],
      where: { approvalStatus: "SUBMITTED" },
      _count: true,
      orderBy: { date: "desc" },
    });

    const formattedPending = await Promise.all(
      pendingSheets.map(async (ps) => {
        const proj = ps.projectId ? allProjects.find((p) => p.id === ps.projectId) : null;
        return {
          date: ps.date.toISOString().split("T")[0],
          projectId: ps.projectId,
          projectName: proj ? proj.projectName : "All Sites",
          count: ps._count,
        };
      })
    );

    return {
      date: targetDateStr,
      projectId: projectId || "all",
      kpis: dailyData.summary,
      sheetStatus: dailyData.approvalStatus,
      trend: daysTrend,
      projectSummaries,
      pendingApprovals: formattedPending,
    };
  },

  async getAttendanceHistory({
    page = 1,
    limit = 20,
    search = "",
    projectId = "",
    startDate = "",
    endDate = "",
    status = "",
    employmentType = "",
    sortBy = "date",
    sortOrder = "desc",
  }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (employmentType && employmentType !== "all") {
      where.employee = { ...(where.employee || {}), employmentType };
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.employee = {
        ...(where.employee || {}),
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { employeeCode: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const allowedSort = ["date", "status", "workHours", "overtimeHours", "createdAt"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "date";
    const sortDir = sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

    const [records, total] = await Promise.all([
      hrRepository.findAttendancePaginated({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortDir },
      }),
      hrRepository.countAttendance({ where }),
    ]);

    return {
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  async getWorkerAttendance(workerId, { startDate, endDate, month, year } = {}) {
    const employee = await hrRepository.findEmployeeById(workerId);
    if (!employee) {
      throw new Error("Worker not found");
    }

    let dateWhere = {};
    if (startDate || endDate) {
      if (startDate) dateWhere.gte = new Date(startDate);
      if (endDate) dateWhere.lte = new Date(endDate);
    } else if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      dateWhere.gte = new Date(Date.UTC(y, m - 1, 1));
      dateWhere.lte = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    }

    const logs = await prisma.attendance.findMany({
      where: {
        employeeId: workerId,
        ...(Object.keys(dateWhere).length > 0 ? { date: dateWhere } : {}),
      },
      orderBy: { date: "desc" },
      include: {
        project: {
          select: { projectName: true, projectCode: true },
        },
      },
    });

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let totalWorkHours = 0;
    let totalOvertimeHours = 0;

    logs.forEach((l) => {
      if (l.status === "PRESENT") presentDays++;
      else if (l.status === "LATE") lateDays++;
      else if (l.status === "HALF_DAY") halfDays++;
      else if (l.status === "ABSENT") absentDays++;
      else if (l.status === "ON_LEAVE") leaveDays++;

      totalWorkHours += Number(l.workHours || 0);
      totalOvertimeHours += Number(l.overtimeHours || 0);
    });

    const effectivePresent = presentDays + lateDays + halfDays * 0.5;
    const workingDays = logs.length;
    const rate = workingDays > 0 ? Math.round((effectivePresent / workingDays) * 100) : 0;

    return {
      worker: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        trade: employee.trade,
        phone: employee.phone,
        dailyRate: employee.dailyRate,
        monthlySalary: employee.monthlySalary,
        employmentType: employee.employmentType,
        assignedProject: employee.assignedProject,
      },
      summary: {
        totalLoggedDays: logs.length,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        leaveDays,
        effectivePresent,
        attendanceRate: rate,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
      },
      logs,
    };
  },

  async getAttendanceReports({ startDate, endDate, projectId, month, year } = {}) {
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    let dateGte, dateLte;
    if (startDate && endDate) {
      dateGte = new Date(startDate);
      dateLte = new Date(endDate);
    } else {
      dateGte = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
      dateLte = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));
    }

    const empWhere = { status: { in: ["ACTIVE", "ON_LEAVE"] } };
    if (projectId && projectId !== "all") {
      empWhere.assignedProjectId = projectId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      orderBy: { fullName: "asc" },
      include: {
        assignedProject: { select: { projectName: true, projectCode: true } },
        attendanceLogs: {
          where: {
            date: { gte: dateGte, lte: dateLte },
          },
        },
      },
    });

    const reportRows = employees.map((emp) => {
      let present = 0;
      let late = 0;
      let halfDay = 0;
      let absent = 0;
      let onLeave = 0;
      let totalWorkHours = 0;
      let totalOvertimeHours = 0;

      emp.attendanceLogs.forEach((l) => {
        if (l.status === "PRESENT") present++;
        else if (l.status === "LATE") late++;
        else if (l.status === "HALF_DAY") halfDay++;
        else if (l.status === "ABSENT") absent++;
        else if (l.status === "ON_LEAVE") onLeave++;

        totalWorkHours += Number(l.workHours || 0);
        totalOvertimeHours += Number(l.overtimeHours || 0);
      });

      const effectiveDays = present + late + halfDay * 0.5;
      const totalDays = emp.attendanceLogs.length;
      const rate = totalDays > 0 ? Math.round((effectiveDays / totalDays) * 100) : 0;

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        trade: emp.trade,
        employmentType: emp.employmentType,
        assignedProject: emp.assignedProject?.projectName || "Unassigned",
        presentDays: present,
        lateDays: late,
        halfDays: halfDay,
        absentDays: absent,
        leaveDays: onLeave,
        effectiveDays,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        attendanceRate: rate,
      };
    });

    const totalWorkHours = reportRows.reduce((sum, r) => sum + r.totalWorkHours, 0);
    const totalOT = reportRows.reduce((sum, r) => sum + r.totalOvertimeHours, 0);
    const avgRate = reportRows.length > 0
      ? Math.round(reportRows.reduce((sum, r) => sum + r.attendanceRate, 0) / reportRows.length)
      : 0;

    return {
      period: {
        startDate: dateGte.toISOString().split("T")[0],
        endDate: dateLte.toISOString().split("T")[0],
        month: currentMonth,
        year: currentYear,
      },
      projectId: projectId || "all",
      totalWorkers: reportRows.length,
      overallSummary: {
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        totalOvertimeHours: Math.round(totalOT * 10) / 10,
        averageAttendanceRate: avgRate,
      },
      rows: reportRows,
    };
  },

  async getLeaveRequests({ page = 1, limit = 20, status = "", employeeId = "" }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status.trim()) where.status = status.trim();
    if (employeeId && employeeId.trim()) where.employeeId = employeeId.trim();

    const [leaves, total] = await Promise.all([
      hrRepository.findLeaves({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
      }),
      hrRepository.countLeaves({ where }),
    ]);

    return {
      leaves,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  async submitLeaveRequest(data, actorId) {
    const employee = await hrRepository.findEmployeeById(data.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const leave = await hrRepository.createLeave({
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason ? data.reason.trim() : null,
      status: "PENDING",
    });

    // Trigger real-time notification
    try {
      await notificationService.createNotification({
        title: "New Leave Application",
        message: `${employee.fullName} submitted a ${data.leaveType} leave request`,
        type: "INFO",
        category: "LEAVE",
        link: "/hr/leaves",
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr.message);
    }

    return leave;
  },

  async reviewLeaveRequest(id, status, reviewerNote, actorId) {
    const leave = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!leave) {
      throw new Error("Leave request not found");
    }

    const updated = await hrRepository.updateLeave(id, {
      status,
      reviewerNote: reviewerNote || null,
      reviewedById: actorId,
    });

    // If approved, update employee status to ON_LEAVE
    if (status === "APPROVED") {
      await prisma.employee.update({
        where: { id: leave.employeeId },
        data: { status: "ON_LEAVE" },
      });
    } else if (status === "REJECTED" && leave.employee.status === "ON_LEAVE") {
      await prisma.employee.update({
        where: { id: leave.employeeId },
        data: { status: "ACTIVE" },
      });
    }

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "REVIEW_LEAVE",
          entityType: "LeaveRequest",
          entityId: id,
          details: { status, reviewerNote },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    // Trigger real-time notification
    try {
      await notificationService.createNotification({
        title: `Leave Request ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `Leave request for ${leave.employee.fullName} was marked as ${status.toLowerCase()}`,
        type: status === "APPROVED" ? "SUCCESS" : "WARNING",
        category: "LEAVE",
        link: "/hr/leaves",
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr.message);
    }

    return updated;
  },

  async getPayrollSheet({ month, year, projectId }) {
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endDate = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

    const empWhere = { status: { in: ["ACTIVE", "ON_LEAVE"] } };
    if (projectId && projectId !== "all") {
      empWhere.assignedProjectId = projectId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        assignedProject: {
          select: { projectName: true, projectCode: true },
        },
        attendanceLogs: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const payroll = employees.map((emp) => {
      let daysPresent = 0;
      let daysHalfDay = 0;
      let totalOvertimeHours = 0;

      emp.attendanceLogs.forEach((log) => {
        if (log.status === "PRESENT" || log.status === "LATE") daysPresent += 1;
        if (log.status === "HALF_DAY") daysHalfDay += 0.5;
        if (log.overtimeHours) totalOvertimeHours += Number(log.overtimeHours);
      });

      const effectiveDays = daysPresent + daysHalfDay;
      const dailyRate = Number(emp.dailyRate || 0);
      const monthlySalary = Number(emp.monthlySalary || 0);

      // Hourly rate calculation for overtime (standard 8-hour workday)
      const hourlyRate = dailyRate > 0 ? dailyRate / 8 : monthlySalary > 0 ? monthlySalary / 160 : 0;
      const overtimePay = totalOvertimeHours * hourlyRate * 1.5; // 1.5x overtime multiplier

      let basePay = 0;
      if (emp.employmentType === "DAILY_LABORER" || dailyRate > 0) {
        basePay = effectiveDays * dailyRate;
      } else if (monthlySalary > 0) {
        basePay = monthlySalary;
      }

      const grossPay = basePay + overtimePay;

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        trade: emp.trade,
        employmentType: emp.employmentType,
        assignedProject: emp.assignedProject?.projectName || "Unassigned",
        dailyRate,
        monthlySalary,
        effectiveDays,
        totalOvertimeHours,
        basePay: Math.round(basePay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        grossPay: Math.round(grossPay * 100) / 100,
        currency: emp.currency || "ETB",
      };
    });

    const totalGross = payroll.reduce((sum, item) => sum + item.grossPay, 0);
    const totalOT = payroll.reduce((sum, item) => sum + item.overtimePay, 0);

    return {
      month: currentMonth,
      year: currentYear,
      totalWorkers: payroll.length,
      totalGrossPayout: Math.round(totalGross * 100) / 100,
      totalOvertimePayout: Math.round(totalOT * 100) / 100,
      currency: "ETB",
      items: payroll,
    };
  },

  async getHRMetrics() {
    return hrRepository.getMetrics();
  },

  async getProjects() {
    return hrRepository.findProjects();
  },
};
