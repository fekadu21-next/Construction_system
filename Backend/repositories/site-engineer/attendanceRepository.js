import prisma from "../../config/prisma.js";

export const seAttendanceRepository = {
  /**
   * Find eligible workers assigned to project
   */
  async findEligibleWorkers(projectId) {
    return prisma.employees.findMany({
      where: {
        assignedProjectId: projectId,
        status: "ACTIVE",
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        phone: true,
        trade: true,
        employmentType: true,
        dailyRate: true,
        currency: true,
        status: true,
      },
    });
  },

  /**
   * Find attendance records for project and date/filters
   */
  async findAttendance({ projectId, date, page = 1, limit = 50 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    }

    const [records, total] = await Promise.all([
      prisma.attendances.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: {
          employees: {
            select: { id: true, employeeCode: true, fullName: true, trade: true, employmentType: true },
          },
          project: {
            select: { id: true, projectName: true, projectCode: true },
          },
          recordedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.attendances.count({ where }),
    ]);

    return {
      records,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },

  /**
   * Check if attendance already exists for worker on date
   */
  async checkExisting(employeeId, date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return prisma.attendances.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: targetDate,
        },
      },
    });
  },

  /**
   * Create single attendance record
   */
  async create(data) {
    return prisma.attendances.create({
      data,
      include: {
        employees: { select: { id: true, employeeCode: true, fullName: true, trade: true } },
        project: { select: { id: true, projectName: true } },
      },
    });
  },

  /**
   * Update attendance record (for corrections)
   */
  async update(attendanceId, data) {
    return prisma.attendances.update({
      where: { id: attendanceId },
      data,
      include: {
        employees: { select: { id: true, employeeCode: true, fullName: true, trade: true } },
        project: { select: { id: true, projectName: true } },
      },
    });
  },

  /**
   * Find attendance by ID
   */
  async findById(attendanceId) {
    return prisma.attendances.findUnique({
      where: { id: attendanceId },
      include: {
        employees: true,
        project: true,
      },
    });
  },
};
