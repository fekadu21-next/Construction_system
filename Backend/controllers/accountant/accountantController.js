import { accountantService } from "../../services/accountant/accountantService.js";

export const accountantController = {
  async getDashboard(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await accountantService.getDashboardMetrics(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getBudgets(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await accountantService.getBudgets(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createBudget(req, res, next) {
    try {
      const data = await accountantService.createOrReviseBudget(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async updateProjectBudget(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await accountantService.updateProjectAllocatedBudget(projectId, req.body, req.userId);
      res.json({ success: true, data, message: "Project allocated budget updated successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getExpenses(req, res, next) {
    try {
      const data = await accountantService.getExpenses(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createExpense(req, res, next) {
    try {
      const data = await accountantService.createExpense(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async reviewExpense(req, res, next) {
    try {
      const { id } = req.params;
      const data = await accountantService.reviewExpense(id, req.body, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async recordPayment(req, res, next) {
    try {
      const { id } = req.params;
      const data = await accountantService.recordExpensePayment(id, req.body, req.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getEligibleLaborCosts(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await accountantService.getEligibleAttendanceSheets(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async postLaborCost(req, res, next) {
    try {
      const data = await accountantService.postLaborCost(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getInvoices(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await accountantService.getInvoices(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createInvoice(req, res, next) {
    try {
      const data = await accountantService.createInvoice(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async payInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const data = await accountantService.payInvoice(id, req.body, req.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getReports(req, res, next) {
    try {
      const data = await accountantService.getFinancialReports(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getSuppliers(req, res, next) {
    try {
      const data = await accountantService.getSuppliers();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getMaterialCosts(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await accountantService.getMaterialCosts(projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async recordMaterialCost(req, res, next) {
    try {
      const data = await accountantService.recordMaterialCost(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
