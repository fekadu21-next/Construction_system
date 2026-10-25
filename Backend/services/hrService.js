import { hrRepository } from "../repositories/hrRepository.js";
import prisma from "../config/prisma.js";
import { notificationService } from "./notificationService.js";

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

  async recordDailyAttendance(date, projectId, records, actorId) {
    const formattedRecords = records.map((r) => ({
      employeeId: r.employeeId,
      projectId: projectId || r.projectId || null,
      date,
      status: r.status || "PRESENT",
      overtimeHours: r.overtimeHours ? Number(r.overtimeHours) : 0,
      notes: r.notes || null,
    }));

    const result = await hrRepository.upsertAttendanceBatch(formattedRecords);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "RECORD_ATTENDANCE",
          entityType: "Attendance",
          details: {
            date,
            projectId: projectId || "ALL",
            recordCount: records.length,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed:", auditErr.message);
    }

    // Trigger real-time notification
    try {
      const highOvertimeWorkers = formattedRecords.filter((r) => r.overtimeHours >= 4);
      await notificationService.createNotification({
        title: "Site Attendance Logged",
        message: `Daily attendance logged for ${records.length} worker(s) on ${date}`,
        type: "INFO",
        category: "ATTENDANCE",
        link: "/hr/attendance",
      });

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

    return { count: result.length, date };
  },

  async getDailyAttendance(date, projectId) {
    // 1. Fetch all active employees (optionally filtered by project)
    const empWhere = { status: { in: ["ACTIVE", "ON_LEAVE"] } };
    if (projectId && projectId !== "all") {
      empWhere.assignedProjectId = projectId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        trade: true,
        phone: true,
        dailyRate: true,
        assignedProjectId: true,
        assignedProject: {
          select: {
            id: true,
            projectName: true,
          },
        },
      },
    });

    // 2. Fetch logged attendance for date
    const attendanceLogs = await hrRepository.findAttendance({
      date,
      projectId: projectId && projectId !== "all" ? projectId : undefined,
    });

    const logsMap = new Map();
    attendanceLogs.forEach((log) => {
      logsMap.set(log.employeeId, log);
    });

    // 3. Merge so every relevant employee has an entry
    const merged = employees.map((emp) => {
      const log = logsMap.get(emp.id);
      return {
        employee: emp,
        status: log ? log.status : "PRESENT",
        overtimeHours: log ? Number(log.overtimeHours) : 0,
        notes: log ? log.notes : "",
        isLogged: !!log,
      };
    });

    return {
      date,
      projectId: projectId || "all",
      totalWorkers: employees.length,
      loggedCount: attendanceLogs.length,
      roster: merged,
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
        if (log.status === "PRESENT") daysPresent += 1;
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
