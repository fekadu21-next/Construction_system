import { seAttendanceService } from "../../services/site-engineer/index.js";

export const seAttendanceController = {
  async getProjectWorkers(req, res, next) {
    try {
      const workers = await seAttendanceService.getProjectWorkers(req.params.projectId, req.userId);
      res.json({
        success: true,
        data: workers,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAttendance(req, res, next) {
    try {
      const result = await seAttendanceService.getAttendance(req.userId, req.query);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async recordAttendance(req, res, next) {
    try {
      const result = await seAttendanceService.recordAttendance(req.userId, req.body);
      res.status(201).json({
        success: true,
        message: `Successfully recorded attendance for ${result.recordedCount} worker(s).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAttendance(req, res, next) {
    try {
      const updated = await seAttendanceService.updateAttendance(req.params.attendanceId, req.userId, req.body);
      res.json({
        success: true,
        message: "Attendance record updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
};
