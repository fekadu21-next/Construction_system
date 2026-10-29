import prisma from "../../config/prisma.js";

export const pmBudgetRepository = {
  /**
   * Retrieve project expenses for budget overview & filtering
   */
  async findExpenses(managerId, { projectId, category, startDate, endDate, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      project: {
        projectManagerId: managerId,
        archivedAt: null,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.projectExpense.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { expenseDate: "desc" },
        include: {
          project: { select: { id: true, projectName: true, projectCode: true } },
          recordedBy: { select: { id: true, fullName: true } },
        },
      }),
      prisma.projectExpense.count({ where }),
    ]);

    return {
      expenses,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  },
};
