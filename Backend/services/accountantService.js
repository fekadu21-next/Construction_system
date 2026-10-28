import prisma from "../config/prisma.js";
import { notificationService } from "./notificationService.js";

export const accountantService = {
  /**
   * Financial Dashboard Overview
   */
  async getDashboardMetrics(projectId) {
    const projWhere = { archivedAt: null };
    if (projectId && projectId !== "all") {
      projWhere.id = projectId;
    }

    const projects = await prisma.project.findMany({
      where: projWhere,
      select: { id: true, projectName: true, projectCode: true, budget: true, currency: true, status: true },
    });

    const projectIds = projects.map((p) => p.id);
    const totalApprovedBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

    // Actual recorded expenses (Only APPROVED / PAID expenses count towards actual expenditure)
    const expenses = await prisma.projectExpense.findMany({
      where: {
        projectId: { in: projectIds },
        approvalStatus: { in: ["APPROVED", "POSTED"] },
      },
    });

    const actualRecordedExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const remainingBudget = Math.max(0, totalApprovedBudget - actualRecordedExpenses);
    const budgetUtilization = totalApprovedBudget > 0
      ? Math.round((actualRecordedExpenses / totalApprovedBudget) * 10000) / 100
      : 0;

    // Expenses breakdown by category
    const categoryTotals = {
      LABOR: 0,
      MATERIALS: 0,
      EQUIPMENT: 0,
      TRANSPORTATION: 0,
      FUEL: 0,
      MAINTENANCE: 0,
      UTILITIES: 0,
      OTHER: 0,
    };

    expenses.forEach((e) => {
      const cat = (e.category || "OTHER").toUpperCase();
      const amt = Number(e.amount || 0);
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amt;
      } else {
        categoryTotals.OTHER += amt;
      }
    });

    // Pending expense approvals
    const pendingExpensesCount = await prisma.projectExpense.count({
      where: {
        projectId: { in: projectIds },
        approvalStatus: { in: ["DRAFT", "SUBMITTED"] },
      },
    });

    // Committed procurement costs from unpaid / approved supplier invoices
    const invoices = await prisma.supplierInvoice.findMany({
      where: {
        projectId: { in: projectIds },
        status: { in: ["PENDING_APPROVAL", "APPROVED", "PARTIALLY_PAID"] },
      },
    });

    const outstandingSupplierPayables = invoices.reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);
    const committedProcurementCosts = invoices
      .filter((inv) => inv.status === "APPROVED")
      .reduce((sum, inv) => sum + Number(inv.balanceDue || 0), 0);

    // Total payments recorded
    const payments = await prisma.payment.findMany({
      where: {
        projectId: { in: projectIds },
        status: "COMPLETED",
      },
    });
    const totalPaymentsRecorded = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Monthly expenditure trend (Last 6 months)
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
      const end = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59));

      const monthExpenses = expenses.filter((e) => {
        const expDate = new Date(e.expenseDate);
        return expDate >= start && expDate <= end;
      });

      const total = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      monthlyTrends.push({
        monthName: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        total: Math.round(total * 100) / 100,
        labor: Math.round(monthExpenses.filter((e) => e.category === "LABOR").reduce((s, e) => s + Number(e.amount), 0) * 100) / 100,
        materials: Math.round(monthExpenses.filter((e) => e.category === "MATERIALS").reduce((s, e) => s + Number(e.amount), 0) * 100) / 100,
      });
    }

    // High risk projects (Over 85% budget utilization)
    const projectSummaries = await Promise.all(
      projects.map(async (p) => {
        const pExp = expenses.filter((e) => e.projectId === p.id);
        const spent = pExp.reduce((s, e) => s + Number(e.amount || 0), 0);
        const pBudget = Number(p.budget || 0);
        const util = pBudget > 0 ? Math.round((spent / pBudget) * 10000) / 100 : 0;
        const isHighRisk = util >= 85.0;

        return {
          id: p.id,
          projectName: p.projectName,
          projectCode: p.projectCode,
          budget: pBudget,
          spent: Math.round(spent * 100) / 100,
          remaining: Math.max(0, Math.round((pBudget - spent) * 100) / 100),
          utilization: util,
          isHighRisk,
          currency: p.currency,
        };
      })
    );

    return {
      totalBudget: Math.round(totalApprovedBudget * 100) / 100,
      approvedBudget: Math.round(totalApprovedBudget * 100) / 100,
      actualExpenses: Math.round(actualRecordedExpenses * 100) / 100,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      budgetUtilization,
      budgetUtilizationPercentage: budgetUtilization,
      committedProcurementCosts: Math.round(committedProcurementCosts * 100) / 100,
      outstandingSupplierPayables: Math.round(outstandingSupplierPayables * 100) / 100,
      totalPaymentsRecorded: Math.round(totalPaymentsRecorded * 100) / 100,
      pendingExpensesCount,
      categoryTotals: {
        labor: Math.round(categoryTotals.LABOR * 100) / 100,
        materials: Math.round(categoryTotals.MATERIALS * 100) / 100,
        equipment: Math.round(categoryTotals.EQUIPMENT * 100) / 100,
        transportation: Math.round(categoryTotals.TRANSPORTATION * 100) / 100,
        fuel: Math.round(categoryTotals.FUEL * 100) / 100,
        maintenance: Math.round(categoryTotals.MAINTENANCE * 100) / 100,
        utilities: Math.round(categoryTotals.UTILITIES * 100) / 100,
        other: Math.round(categoryTotals.OTHER * 100) / 100,
      },
      monthlyTrends,
      projects: projectSummaries,
      currency: "ETB",
    };
  },

  /**
   * Budget Management & Revisions
   */
  async getBudgets(projectId) {
    const where = {};
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    const budgets = await prisma.projectBudget.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true, budget: true, currency: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return budgets;
  },

  async createOrReviseBudget(data, actorId) {
    const { projectId, category, allocatedAmount, revisedAmount, revisionReason, fiscalPeriod = "2026" } = data;

    if (!projectId || !category || allocatedAmount === undefined) {
      throw new Error("Project ID, category, and allocated budget amount are required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    const budget = await prisma.projectBudget.create({
      data: {
        projectId,
        category,
        allocatedAmount: Number(allocatedAmount),
        revisedAmount: revisedAmount ? Number(revisedAmount) : null,
        revisionReason: revisionReason || null,
        fiscalPeriod,
        status: "APPROVED",
        createdById: actorId,
        approvedById: actorId,
      },
      include: {
        project: { select: { projectName: true } },
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "ALLOCATE_PROJECT_BUDGET",
          entityType: "ProjectBudget",
          entityId: budget.id,
          details: { projectId, category, allocatedAmount, revisedAmount },
        },
      });

      await notificationService.createNotification({
        recipientRole: "GENERAL_MANAGER",
        title: "Budget Allocation Recorded",
        message: `${category} budget of ${allocatedAmount} ETB recorded for "${budget.project.projectName}"`,
        type: "INFO",
        category: "BUDGET",
        link: "/accountant/budgets",
      });
    } catch (e) {
      console.warn("Audit/Notification warning:", e.message);
    }

    return budget;
  },

  /**
   * Expense Management
   */
  async getExpenses({ projectId, category, approvalStatus, paymentStatus, startDate, endDate, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (projectId && projectId !== "all") where.projectId = projectId;
    if (category && category !== "all") where.category = category;
    if (approvalStatus && approvalStatus !== "all") where.approvalStatus = approvalStatus;
    if (paymentStatus && paymentStatus !== "all") where.paymentStatus = paymentStatus;

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
        },
      }),
      prisma.projectExpense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  async createExpense(data, actorId) {
    const {
      projectId,
      category,
      amount,
      description,
      expenseDate,
      payee,
      supplierId,
      paymentMethod = "BANK_TRANSFER",
      receiptUrl,
      notes,
    } = data;

    if (!projectId || !category || !amount) {
      throw new Error("Project, category, and expense amount are required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { projectName: true },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    const count = await prisma.projectExpense.count();
    const refNum = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const expense = await prisma.projectExpense.create({
      data: {
        referenceNumber: refNum,
        projectId,
        category,
        amount: Number(amount),
        currency: "ETB",
        description: description || null,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        payee: payee || null,
        supplierId: supplierId || null,
        paymentMethod,
        receiptUrl: receiptUrl || null,
        approvalStatus: "SUBMITTED",
        paymentStatus: "UNPAID",
        recordedById: actorId || data.recordedById || data.actorId || data.createdBy || null,
        notes: notes || null,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "CREATE_PROJECT_EXPENSE",
          entityType: "ProjectExpense",
          entityId: expense.id,
          details: { referenceNumber: refNum, amount, category, projectId },
        },
      });

      await notificationService.createNotification({
        recipientRole: "ACCOUNTANT",
        title: "New Expense Submitted for Review",
        message: `${category} expense of ${amount} ETB (${refNum}) submitted for "${project.projectName}"`,
        type: "INFO",
        category: "FINANCE",
        link: "/accountant/expenses",
      });
    } catch (e) {
      console.warn("Notification warning:", e.message);
    }

    return expense;
  },

  /**
   * Approve or Reject Expense with Separation of Duties
   */
  async reviewExpense(expenseId, { approvalStatus, rejectionReason }, actorId, userRole) {
    const expense = await prisma.projectExpense.findUnique({
      where: { id: expenseId },
      include: { project: true },
    });

    if (!expense) {
      throw new Error("Expense record not found");
    }

    // Enforce separation of duties: A user cannot approve their own expense unless GM/Admin
    if (expense.recordedById === actorId && userRole !== "GENERAL_MANAGER") {
      throw new Error("Separation of Duties Violation: You cannot approve an expense entry created by yourself. Another authorized accountant or manager must review it.");
    }

    const updated = await prisma.projectExpense.update({
      where: { id: expenseId },
      data: {
        approvalStatus,
        approvedById: actorId,
        approvedAt: new Date(),
        notes: rejectionReason ? `${expense.notes ? expense.notes + " | " : ""}Reason: ${rejectionReason}` : expense.notes,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: approvalStatus === "APPROVED" ? "APPROVE_EXPENSE" : "REJECT_EXPENSE",
          entityType: "ProjectExpense",
          entityId: expenseId,
          details: { approvalStatus, rejectionReason },
        },
      });
    } catch (e) {
      console.warn("Audit warning:", e.message);
    }

    return updated;
  },

  /**
   * Record payment for an approved expense
   */
  async recordExpensePayment(expenseId, { paymentMethod = "BANK_TRANSFER", paymentDate, receiptUrl, notes }, actorId) {
    const expense = await prisma.projectExpense.findUnique({
      where: { id: expenseId },
      include: { project: true },
    });

    if (!expense) {
      throw new Error("Expense not found");
    }

    if (expense.approvalStatus !== "APPROVED") {
      throw new Error("Cannot pay an expense that has not been approved");
    }

    const count = await prisma.payment.count();
    const payNum = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [updatedExpense, payment] = await prisma.$transaction([
      prisma.projectExpense.update({
        where: { id: expenseId },
        data: {
          paymentStatus: "PAID",
          paymentMethod,
          receiptUrl: receiptUrl || expense.receiptUrl,
        },
      }),
      prisma.payment.create({
        data: {
          paymentNumber: payNum,
          expenseId,
          projectId: expense.projectId,
          supplierId: expense.supplierId || null,
          amount: expense.amount,
          currency: expense.currency || "ETB",
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          referenceNumber: expense.referenceNumber,
          receiptUrl: receiptUrl || null,
          status: "COMPLETED",
          notes: notes || `Payment for expense ${expense.referenceNumber}`,
          recordedById: actorId,
        },
      }),
    ]);

    return { expense: updatedExpense, payment };
  },

  /**
   * Labor Cost Review & Authorized Posting
   * Integrates approved daily attendance sheets with accounting ledger!
   */
  async getEligibleAttendanceSheets(projectId) {
    const where = {
      approvalStatus: { in: ["APPROVED", "SUBMITTED"] },
      laborCostPosted: false,
    };
    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    // Group attendances by date and projectId
    const sheets = await prisma.attendance.groupBy({
      by: ["date", "projectId"],
      where,
      _count: true,
      orderBy: { date: "desc" },
    });

    const enriched = await Promise.all(
      sheets.map(async (s) => {
        const project = s.projectId ? await prisma.project.findUnique({ where: { id: s.projectId }, select: { projectName: true, projectCode: true } }) : null;
        
        // Calculate total labor cost for this date/project
        const logs = await prisma.attendance.findMany({
          where: {
            date: s.date,
            projectId: s.projectId,
            approvalStatus: { in: ["APPROVED", "SUBMITTED"] },
          },
          include: {
            employee: { select: { dailyRate: true, monthlySalary: true, employmentType: true, fullName: true, employeeCode: true } },
          },
        });

        let totalDayCost = 0;
        let totalOvertimeHours = 0;
        let presentWorkers = 0;

        logs.forEach((log) => {
          if (["PRESENT", "LATE", "HALF_DAY"].includes(log.status)) {
            const factor = log.status === "HALF_DAY" ? 0.5 : 1.0;
            presentWorkers += factor;

            const dailyRate = Number(log.employee.dailyRate || 0);
            const monthlySalary = Number(log.employee.monthlySalary || 0);
            const baseDaily = dailyRate > 0 ? dailyRate : (monthlySalary > 0 ? monthlySalary / 26 : 0);
            const hourlyRate = baseDaily / 8;
            const otHours = Number(log.overtimeHours || 0);
            totalOvertimeHours += otHours;
            const otPay = otHours * hourlyRate * 1.5;

            totalDayCost += (baseDaily * factor) + otPay;
          }
        });

        return {
          date: s.date.toISOString().split("T")[0],
          projectId: s.projectId,
          projectName: project?.projectName || "All Sites",
          projectCode: project?.projectCode || "",
          project: {
            id: s.projectId,
            name: project?.projectName || "Site Project",
            code: project?.projectCode || "",
          },
          workerCount: s._count,
          approvedCount: logs.length,
          totalHours: Math.round(logs.reduce((sum, l) => sum + (Number(l.workHours) || 0), 0) * 10) / 10,
          totalOvertime: Math.round(totalOvertimeHours * 10) / 10,
          presentWorkers: Math.round(presentWorkers * 10) / 10,
          totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
          estimatedLaborCost: Math.round(totalDayCost * 100) / 100,
          estimatedCost: Math.round(totalDayCost * 100) / 100,
          isPosted: false,
          status: logs.every((l) => l.approvalStatus === "APPROVED") ? "APPROVED" : "SUBMITTED",
          currency: "ETB",
        };
      })
    );

    return enriched;
  },

  /**
   * Post authorized labor cost to Project Expenses
   */
  async postLaborCost({ projectId, date, authorizedAmount, notes }, actorId) {
    if (!projectId || !date) {
      throw new Error("Project ID and attendance date are required");
    }

    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, projectCode: true },
    });
    if (!project) {
      throw new Error("Project not found");
    }

    // Verify if already posted
    const existingExpense = await prisma.projectExpense.findFirst({
      where: {
        projectId,
        attendanceSheetDate: targetDate,
        category: "LABOR",
      },
    });

    if (existingExpense) {
      throw new Error(`Labor cost for project "${project.projectName}" on ${date} has ALREADY been posted under reference ${existingExpense.referenceNumber}. Duplicate financial postings are prohibited.`);
    }

    // Calculate actual labor cost from submitted or approved attendance
    const logs = await prisma.attendance.findMany({
      where: {
        projectId,
        date: targetDate,
        approvalStatus: { in: ["APPROVED", "SUBMITTED"] },
      },
      include: {
        employee: { select: { dailyRate: true, monthlySalary: true, employmentType: true } },
      },
    });

    if (logs.length === 0) {
      throw new Error(`No attendance records found for project on ${date}`);
    }

    let calculatedCost = 0;
    logs.forEach((log) => {
      if (["PRESENT", "LATE", "HALF_DAY"].includes(log.status)) {
        const factor = log.status === "HALF_DAY" ? 0.5 : 1.0;
        const dailyRate = Number(log.employee.dailyRate || 0);
        const monthlySalary = Number(log.employee.monthlySalary || 0);
        const baseDaily = dailyRate > 0 ? dailyRate : (monthlySalary > 0 ? monthlySalary / 26 : 0);
        const hourlyRate = baseDaily / 8;
        const otHours = Number(log.overtimeHours || 0);
        calculatedCost += (baseDaily * factor) + (otHours * hourlyRate * 1.5);
      }
    });

    const finalAmount = authorizedAmount ? Number(authorizedAmount) : Math.round(calculatedCost * 100) / 100;
    const count = await prisma.projectExpense.count();
    const refNum = `LAB-${date.replace(/-/g, "")}-${String(count + 1).padStart(3, "0")}`;

    const [expense] = await prisma.$transaction([
      prisma.projectExpense.create({
        data: {
          referenceNumber: refNum,
          projectId,
          category: "LABOR",
          amount: finalAmount,
          currency: "ETB",
          description: `Daily Site Labor Cost for ${date} (${logs.length} worker logs)`,
          expenseDate: targetDate,
          attendanceSheetDate: targetDate,
          payee: `Site Laborers (${logs.length} workers)`,
          paymentMethod: "CASH_OR_TRANSFER",
          approvalStatus: "APPROVED",
          approvedById: actorId,
          approvedAt: new Date(),
          paymentStatus: "PAID",
          recordedById: actorId,
          notes: notes || `Authorized labor posting for attendance date ${date}`,
        },
      }),
      prisma.attendance.updateMany({
        where: { projectId, date: targetDate },
        data: {
          laborCostPosted: true,
          approvalStatus: "APPROVED",
          reviewedById: actorId,
          reviewedAt: new Date(),
        },
      }),
    ]);

    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: actorId,
          action: "POST_LABOR_COST_EXPENSE",
          entityType: "ProjectExpense",
          entityId: expense.id,
          details: { referenceNumber: refNum, projectId, date, amount: finalAmount },
        },
      });

      // Notify Site Supervisor that attendance has been authorized and posted for wage payout
      await notificationService.createNotification({
        recipientRole: "SUPERVISOR",
        title: "Daily Attendance & Labor Cost Authorized",
        message: `Accountant approved site attendance for "${project.projectName}" on ${date} and posted ${finalAmount.toLocaleString()} ETB labor cost for disbursement.`,
        type: "SUCCESS",
        category: "FINANCIAL",
        link: `/supervisor/attendance?projectId=${projectId}&date=${date}`,
      });

      await notificationService.createNotification({
        recipientRole: "PROJECT_MANAGER",
        title: "Labor Cost Financial Entry Posted",
        message: `Labor cost of ${finalAmount} ETB posted for "${project.projectName}" on ${date}`,
        type: "SUCCESS",
        category: "FINANCE",
        link: "/accountant/expenses",
      });
    } catch (e) {
      console.warn("Audit/Notification warning:", e.message);
    }

    return expense;
  },

  /**
   * Procurement & Supplier Invoices
   */
  async getInvoices(projectId) {
    const where = {};
    if (projectId && projectId !== "all") where.projectId = projectId;

    const invoices = await prisma.supplierInvoice.findMany({
      where,
      include: {
        project: { select: { projectName: true, projectCode: true } },
      },
      orderBy: { issueDate: "desc" },
    });

    // Attach supplier name
    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const sup = await prisma.$queryRawUnsafe(`
          SELECT name, "contactPerson", phone, email FROM suppliers WHERE id = $1
        `, inv.supplierId).then(r => r[0] || null).catch(() => null);

        return {
          ...inv,
          supplierName: sup?.name || "Standard Supplier",
          supplierContact: sup?.contactPerson || "",
          supplierPhone: sup?.phone || "",
        };
      })
    );

    return enriched;
  },

  async createInvoice(data, actorId) {
    const {
      invoiceNumber,
      supplierId,
      projectId,
      purchaseOrderId,
      issueDate,
      dueDate,
      subtotal,
      taxAmount = 0.0,
      totalAmount,
      paymentTerms,
      notes,
      attachmentUrl,
    } = data;

    if (!invoiceNumber || !supplierId || !projectId || !totalAmount) {
      throw new Error("Invoice number, supplier, project, and total amount are required");
    }

    const existing = await prisma.supplierInvoice.findUnique({
      where: { invoiceNumber },
    });
    if (existing) {
      throw new Error(`Invoice number "${invoiceNumber}" already exists in the system`);
    }

    const tot = Number(totalAmount);
    const sub = subtotal ? Number(subtotal) : tot;
    const tax = taxAmount ? Number(taxAmount) : 0.0;

    const invoice = await prisma.supplierInvoice.create({
      data: {
        invoiceNumber: invoiceNumber.trim(),
        supplierId,
        projectId,
        purchaseOrderId: purchaseOrderId || null,
        issueDate: new Date(issueDate || Date.now()),
        dueDate: new Date(dueDate || Date.now() + 30 * 86400000),
        subtotal: sub,
        taxAmount: tax,
        totalAmount: tot,
        paidAmount: 0.0,
        balanceDue: tot,
        currency: "ETB",
        status: "APPROVED",
        paymentTerms: paymentTerms || "Net 30 Days",
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        createdById: actorId,
        approvedById: actorId,
      },
    });

    return invoice;
  },

  async payInvoice(invoiceId, { amount, paymentMethod = "BANK_TRANSFER", referenceNumber, notes }, actorId) {
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const currentBalance = Number(invoice.balanceDue);
    if (payAmount > currentBalance) {
      throw new Error(`Payment amount (${payAmount}) exceeds invoice balance due (${currentBalance})`);
    }

    const newPaid = Number(invoice.paidAmount) + payAmount;
    const newBalance = currentBalance - payAmount;
    const newStatus = newBalance <= 0 ? "PAID" : "PARTIALLY_PAID";

    const count = await prisma.payment.count();
    const payNum = `PAY-INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const [updatedInvoice, payment] = await prisma.$transaction([
      prisma.supplierInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          balanceDue: newBalance,
          status: newStatus,
        },
      }),
      prisma.payment.create({
        data: {
          paymentNumber: payNum,
          invoiceId,
          projectId: invoice.projectId,
          supplierId: invoice.supplierId,
          amount: payAmount,
          currency: invoice.currency,
          paymentDate: new Date(),
          paymentMethod,
          referenceNumber: referenceNumber || invoice.invoiceNumber,
          status: "COMPLETED",
          notes: notes || `Payment for invoice ${invoice.invoiceNumber}`,
          recordedById: actorId,
        },
      }),
    ]);

    return { invoice: updatedInvoice, payment };
  },

  /**
   * Financial Reports Generator
   */
  async getFinancialReports({ projectId, startDate, endDate }) {
    const where = {};
    if (projectId && projectId !== "all") where.projectId = projectId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const expenses = await prisma.projectExpense.findMany({
      where: {
        ...where,
        approvalStatus: { in: ["APPROVED", "POSTED"] },
      },
      include: {
        project: { select: { projectName: true, projectCode: true, budget: true } },
      },
      orderBy: { expenseDate: "desc" },
    });

    const categorySummary = {};
    expenses.forEach((e) => {
      const cat = e.category || "OTHER";
      categorySummary[cat] = (categorySummary[cat] || 0) + Number(e.amount);
    });

    const totalExpenditure = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return {
      generatedAt: new Date().toISOString(),
      totalExpensesCount: expenses.length,
      totalExpenditure: Math.round(totalExpenditure * 100) / 100,
      categorySummary,
      currency: "ETB",
      records: expenses,
    };
  },

  /**
   * Get list of suppliers for expense and invoice dropdowns
   */
  async getSuppliers() {
    const suppliers = await prisma.$queryRawUnsafe(`
      SELECT id, name, code, "contactPerson", email, phone, city 
      FROM suppliers 
      WHERE "isActive" = true 
      ORDER BY name ASC
    `);
    return suppliers;
  },
};
