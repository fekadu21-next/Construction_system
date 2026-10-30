import { supervisorService } from "../../services/supervisor/supervisorService.js";

export const supervisorController = {
  async getDashboard(req, res, next) {
    try {
      const data = await supervisorService.getDashboardMetrics(req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getProjects(req, res, next) {
    try {
      const data = await supervisorService.getAuthorizedProjects(req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getProjectWorkers(req, res, next) {
    try {
      const { projectId } = req.params;
      const data = await supervisorService.getProjectWorkers(projectId, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async addDailyWorker(req, res, next) {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const data = await supervisorService.addDailyWorker(projectId, req.body, req.userId, req.userRole);
      res.status(201).json({ success: true, data, message: "Daily worker added successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getAttendance(req, res, next) {
    try {
      const { projectId, date } = req.query;
      const isManager = ["GENERAL_MANAGER", "ADMIN", "HR_MANAGER", "ACCOUNTANT"].includes(req.userRole);
      if (!projectId && !isManager) {
        return res.status(400).json({ success: false, message: "Project ID is required" });
      }
      const data = await supervisorService.getDailyAttendance(projectId || "all", date, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getAttendanceHistory(req, res, next) {
    try {
      const data = await supervisorService.getAttendanceHistory(req.query, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async saveAttendance(req, res, next) {
    try {
      if (["HR_MANAGER", "ACCOUNTANT"].includes(req.userRole)) {
        return res.status(403).json({
          success: false,
          message: `${req.userRole === "ACCOUNTANT" ? "Accountants" : "HR Managers"} monitor attendance and costs; daily site attendance is recorded by Site Supervisors.`,
        });
      }
      const data = await supervisorService.saveAttendance(req.body, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async submitAttendance(req, res, next) {
    try {
      if (["HR_MANAGER", "ACCOUNTANT"].includes(req.userRole)) {
        return res.status(403).json({
          success: false,
          message: `${req.userRole === "ACCOUNTANT" ? "Accountants" : "HR Managers"} monitor attendance and costs; daily site attendance is submitted by Site Supervisors.`,
        });
      }
      const data = await supervisorService.submitAttendance(req.body, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async requestCorrection(req, res, next) {
    try {
      const data = await supervisorService.requestAttendanceCorrection(req.body, req.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getTasks(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await supervisorService.getTasks(projectId, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async updateTaskProgress(req, res, next) {
    try {
      const { taskId } = req.params;
      const data = await supervisorService.updateTaskProgress(taskId, req.body, req.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getDailyActivities(req, res, next) {
    try {
      const { projectId, date } = req.query;
      const data = await supervisorService.getDailySiteActivities(projectId, date);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async recordDailyActivity(req, res, next) {
    try {
      const data = await supervisorService.recordDailySiteActivity(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getMaterials(req, res, next) {
    try {
      const data = await supervisorService.getMaterials();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getMaterialRequests(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await supervisorService.getMaterialRequests(projectId, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createMaterialRequest(req, res, next) {
    try {
      const data = await supervisorService.createMaterialRequest(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getIncidents(req, res, next) {
    try {
      const { projectId } = req.query;
      const data = await supervisorService.getSiteIncidents(projectId, req.userId, req.userRole);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async reportIncident(req, res, next) {
    try {
      const data = await supervisorService.reportSiteIncident(req.body, req.userId);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async resolveIncident(req, res, next) {
    try {
      const { id } = req.params;
      const data = await supervisorService.resolveSiteIncident(id, req.body, req.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
