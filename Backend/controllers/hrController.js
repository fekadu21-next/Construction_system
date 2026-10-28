import { hrService } from "../services/hrService.js";

export const hrController = {
  async getHRMetrics(req, res, next) {
    try {
      const metrics = await hrService.getHRMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error("Get HR metrics error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch HR metrics",
      });
    }
  },

  async getNextEmployeeCode(req, res, next) {
    try {
      const code = await hrService.generateNextEmployeeCode();
      res.json({
        success: true,
        data: { nextCode: code },
      });
    } catch (error) {
      console.error("Get next employee code error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to generate employee code",
      });
    }
  },

  async getSystemUsers(req, res, next) {
    try {
      const users = await hrService.getSystemUsersForImport();
      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Get system users error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch system users for workforce import",
      });
    }
  },

  async importUsersToEmployees(req, res, next) {
    try {
      const actorId = req.userId;
      const { userIds } = req.body || {};
      const result = await hrService.importUsersToEmployees(actorId, userIds);

      res.status(200).json({
        success: true,
        data: result,
        message: result.importedCount > 0
          ? `Successfully imported ${result.importedCount} user(s) into workforce roster.`
          : `No new users were imported (${result.skippedCount} already exist in workforce).`,
      });
    } catch (error) {
      console.error("Import users to workforce error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to import users to employee table",
      });
    }
  },

  async getEmployees(req, res, next) {
    try {
      const {
        page,
        limit,
        search,
        trade,
        employmentType,
        status,
        assignedProjectId,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await hrService.getEmployees({
        page,
        limit,
        search,
        trade,
        employmentType,
        status,
        assignedProjectId,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get employees error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch workforce roster",
      });
    }
  },

  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await hrService.getEmployeeById(id);

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      if (error.message === "Employee not found") {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      console.error("Get employee by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch employee details",
      });
    }
  },

  async createEmployee(req, res, next) {
    try {
      const actorId = req.userId;
      const employee = await hrService.createEmployee(req.body, actorId);

      res.status(201).json({
        success: true,
        data: employee,
        message: "Employee registered successfully",
      });
    } catch (error) {
      if (
        error.message === "Employee code already exists" ||
        error.message === "Assigned project not found"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      console.error("Create employee error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to register employee",
      });
    }
  },

  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      const updated = await hrService.updateEmployee(id, req.body, actorId);

      res.json({
        success: true,
        data: updated,
        message: "Employee details updated successfully",
      });
    } catch (error) {
      if (error.message === "Employee not found") {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to update employee",
      });
    }
  },

  async approveEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      const approved = await hrService.approveDailyWorker(id, actorId);

      res.json({
        success: true,
        data: approved,
        message: `Worker ${approved.fullName} (${approved.employeeCode}) approved successfully`,
      });
    } catch (error) {
      console.error("Approve employee error:", error);
      if (error.message === "Employee not found") {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to approve employee",
      });
    }
  },

  async rejectEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      const { reason } = req.body || {};
      const rejected = await hrService.rejectDailyWorker(id, reason, actorId);

      res.json({
        success: true,
        data: rejected,
        message: `Worker registration rejected`,
      });
    } catch (error) {
      if (error.message === "Employee not found") {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to reject employee",
      });
    }
  },

  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      await hrService.deleteEmployee(id, actorId);

      res.json({
        success: true,
        message: "Employee removed successfully",
      });
    } catch (error) {
      if (error.message === "Employee not found") {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      console.error("Delete employee error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to delete employee",
      });
    }
  },

  async recordAttendance(req, res, next) {
    try {
      const { date, projectId, records, saveAction } = req.body;
      const actorId = req.userId;
      const userRole = req.userRole;

      const result = await hrService.recordDailyAttendance(date, projectId, records, actorId, userRole, saveAction);

      res.json({
        success: true,
        data: result,
        message: `Attendance saved for ${result.count} worker(s) (${result.approvalStatus})`,
      });
    } catch (error) {
      console.error("Record attendance error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Unable to record site attendance",
      });
    }
  },

  async getDailyAttendance(req, res, next) {
    try {
      const { date, projectId } = req.query;
      const targetDate = date || new Date().toISOString().split("T")[0];

      const result = await hrService.getDailyAttendance(targetDate, projectId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get daily attendance error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch attendance records",
      });
    }
  },

  async submitDailyAttendance(req, res, next) {
    try {
      const { date, projectId } = req.body;
      const actorId = req.userId;

      const result = await hrService.submitDailyAttendance(date, projectId, actorId);

      res.json({
        success: true,
        data: result,
        message: `Attendance sheet for ${date} submitted for review`,
      });
    } catch (error) {
      console.error("Submit attendance error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Unable to submit attendance sheet",
      });
    }
  },

  async reviewDailyAttendance(req, res, next) {
    try {
      const { date, projectId, status, reviewerNote } = req.body;
      const actorId = req.userId;

      const result = await hrService.reviewDailyAttendance(date, projectId, { status, reviewerNote }, actorId);

      res.json({
        success: true,
        data: result,
        message: `Attendance sheet for ${date} marked as ${status.toLowerCase()}`,
      });
    } catch (error) {
      console.error("Review attendance error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Unable to review attendance sheet",
      });
    }
  },

  async updateSingleAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const actorId = req.userId;
      const userRole = req.userRole;

      const updated = await hrService.updateSingleAttendance(id, req.body, actorId, userRole);

      res.json({
        success: true,
        data: updated,
        message: "Attendance entry updated successfully",
      });
    } catch (error) {
      if (error.message === "Attendance record not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("Only HR Managers")) {
        return res.status(403).json({ success: false, message: error.message });
      }
      console.error("Update single attendance error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Unable to update attendance record",
      });
    }
  },

  async getAttendanceDashboard(req, res, next) {
    try {
      const { date, projectId } = req.query;
      const data = await hrService.getAttendanceDashboard({ date, projectId });

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Get attendance dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to load attendance dashboard data",
      });
    }
  },

  async getAttendanceHistory(req, res, next) {
    try {
      const result = await hrService.getAttendanceHistory(req.query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get attendance history error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch attendance history",
      });
    }
  },

  async getWorkerAttendance(req, res, next) {
    try {
      const { workerId } = req.params;
      const result = await hrService.getWorkerAttendance(workerId, req.query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Worker not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      console.error("Get worker attendance error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch worker attendance history",
      });
    }
  },

  async getAttendanceReports(req, res, next) {
    try {
      const result = await hrService.getAttendanceReports(req.query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get attendance reports error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to generate attendance reports",
      });
    }
  },

  async getLeaveRequests(req, res, next) {
    try {
      const { page, limit, status, employeeId } = req.query;
      const result = await hrService.getLeaveRequests({
        page,
        limit,
        status,
        employeeId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get leave requests error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch leave requests",
      });
    }
  },

  async submitLeaveRequest(req, res, next) {
    try {
      const actorId = req.userId;
      const leave = await hrService.submitLeaveRequest(req.body, actorId);

      res.status(201).json({
        success: true,
        data: leave,
        message: "Leave application submitted successfully",
      });
    } catch (error) {
      if (error.message === "Employee not found") {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      console.error("Submit leave request error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to submit leave request",
      });
    }
  },

  async reviewLeaveRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reviewerNote } = req.body;
      const actorId = req.userId;

      const updated = await hrService.reviewLeaveRequest(id, status, reviewerNote, actorId);

      res.json({
        success: true,
        data: updated,
        message: `Leave request ${status.toLowerCase()} successfully`,
      });
    } catch (error) {
      if (error.message === "Leave request not found") {
        return res.status(404).json({
          success: false,
          message: "Leave request not found",
        });
      }
      console.error("Review leave request error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to process leave review",
      });
    }
  },

  async getPayrollSheet(req, res, next) {
    try {
      const { month, year, projectId } = req.query;
      const sheet = await hrService.getPayrollSheet({ month, year, projectId });

      res.json({
        success: true,
        data: sheet,
      });
    } catch (error) {
      console.error("Get payroll sheet error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to compute payroll sheet",
      });
    }
  },

  async getProjects(req, res, next) {
    try {
      const projects = await hrService.getProjects();
      res.json({
        success: true,
        data: { projects },
      });
    } catch (error) {
      console.error("Get HR projects error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to fetch projects",
      });
    }
  },

  async getAvailableWorkers(req, res, next) {
    try {
      const workers = await hrService.getAvailableWorkers();
      res.json({
        success: true,
        data: { workers },
      });
    } catch (error) {
      next(error);
    }
  },

  async assignWorker(req, res, next) {
    try {
      const assignment = await hrService.assignWorkerToProject(req.body, req.userId);
      res.status(201).json({
        success: true,
        message: "Worker successfully assigned to project",
        data: assignment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to assign worker",
      });
    }
  },

  async transferWorker(req, res, next) {
    try {
      const assignment = await hrService.transferWorker(req.body, req.userId);
      res.json({
        success: true,
        message: "Worker successfully transferred to project",
        data: assignment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to transfer worker",
      });
    }
  },

  async getWorkerAssignments(req, res, next) {
    try {
      const { id } = req.params;
      const assignments = await hrService.getWorkerAssignments(id);
      res.json({
        success: true,
        data: { assignments },
      });
    } catch (error) {
      next(error);
    }
  },
};
