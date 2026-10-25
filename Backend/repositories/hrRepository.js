import prisma from "../config/prisma.js";

export const hrRepository = {
  async findEmployees({ where = {}, skip = 0, take = 10, orderBy = { createdAt: "desc" } }) {
    return prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        assignedProject: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
            status: true,
            location: true,
          },
        },
      },
    });
  },

  async countEmployees({ where = {} }) {
    return prisma.employee.count({ where });
  },

  async findEmployeeById(id) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        assignedProject: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
            status: true,
            location: true,
          },
        },
        attendanceLogs: {
          take: 15,
          orderBy: { date: "desc" },
        },
        leaveRequests: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async findEmployeeByCode(employeeCode) {
    return prisma.employee.findUnique({
      where: { employeeCode },
    });
  },

  async findLatestEmployee() {
    return prisma.employee.findFirst({
      orderBy: { createdAt: "desc" },
      select: { employeeCode: true },
    });
  },

  async createEmployee(data) {
    return prisma.employee.create({
      data,
      include: {
        assignedProject: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
          },
        },
      },
    });
  },

  async updateEmployee(id, data) {
    return prisma.employee.update({
      where: { id },
      data,
      include: {
        assignedProject: {
          select: {
            id: true,
            projectName: true,
            projectCode: true,
          },
        },
      },
    });
  },

  async deleteEmployee(id) {
    return prisma.employee.delete({
      where: { id },
    });
  },

  async upsertAttendanceBatch(records) {
    return prisma.$transaction(
      records.map((record) =>
        prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: record.employeeId,
              date: new Date(record.date),
            },
          },
          update: {
            status: record.status,
            overtimeHours: record.overtimeHours ? Number(record.overtimeHours) : 0,
            notes: record.notes ?? null,
            projectId: record.projectId ?? null,
          },
          create: {
            employeeId: record.employeeId,
            projectId: record.projectId ?? null,
            date: new Date(record.date),
            status: record.status ?? "PRESENT",
            overtimeHours: record.overtimeHours ? Number(record.overtimeHours) : 0,
            notes: record.notes ?? null,
          },
        })
      )
    );
  },

  async findAttendance({ projectId, date, startDate, endDate, employeeId }) {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (employeeId) where.employeeId = employeeId;
    if (date) {
      where.date = new Date(date);
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            trade: true,
            phone: true,
            dailyRate: true,
          },
        },
      },
    });
  },

  async findLeaves({ where = {}, skip = 0, take = 20, orderBy = { createdAt: "desc" } }) {
    return prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            trade: true,
            assignedProject: {
              select: {
                id: true,
                projectName: true,
              },
            },
          },
        },
      },
    });
  },

  async countLeaves({ where = {} }) {
    return prisma.leaveRequest.count({ where });
  },

  async createLeave(data) {
    return prisma.leaveRequest.create({
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });
  },

  async updateLeave(id, data) {
    return prisma.leaveRequest.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });
  },

  async getMetrics() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      dailyLaborers,
      presentToday,
      pendingLeaves,
      tradesGroup,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.employee.count({ where: { status: "ON_LEAVE" } }),
      prisma.employee.count({ where: { employmentType: "DAILY_LABORER" } }),
      prisma.attendance.count({
        where: {
          date: today,
          status: { in: ["PRESENT", "HALF_DAY", "LATE"] },
        },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.employee.groupBy({
        by: ["trade"],
        _count: true,
      }),
    ]);

    const tradeDistribution = tradesGroup.reduce((acc, curr) => {
      acc[curr.trade] = curr._count;
      return acc;
    }, {});

    return {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      dailyLaborers,
      presentToday,
      pendingLeaves,
      tradeDistribution,
    };
  },

  async findProjects() {
    return prisma.project.findMany({
      where: {
        archivedAt: null,
      },
      select: {
        id: true,
        projectName: true,
        projectCode: true,
        location: true,
        status: true,
      },
      orderBy: {
        projectName: "asc",
      },
    });
  },
};
