import { seAttendanceRepository } from "../../repositories/site-engineer/index.js";
import { seProjectService } from "./projectService.js";

export const seAttendanceService = {
  /**
   * Get eligible active workers assigned to the project
   */
  async getProjectWorkers(projectId, engineerId) {
    await seProjectService.ensureProjectAssigned(projectId, engineerId);
    return seAttendanceRepository.findEligibleWorkers(projectId);
  },

  /**
   * Get attendance records
   */
  async getAttendance(engineerId, query) {
    if (query.projectId) {
      await seProjectService.ensureProjectAssigned(query.projectId, engineerId);
    }
    return seAttendanceRepository.findAttendance(query);
  },

  /**
   * Record attendance for one or more workers on a project
   */
  async recordAttendance(engineerId, data) {
    const { projectId, date, records, employeeId, status, workHours, overtimeHours, notes, checkInTime, checkOutTime } = data;

    // 1. Verify project assignment
    await seProjectService.ensureProjectAssigned(projectId, engineerId);

    // 2. Fetch eligible workers for the project to prevent recording for unassigned workers
    const eligibleWorkers = await seAttendanceRepository.findEligibleWorkers(projectId);
    const eligibleWorkerMap = new Map(eligibleWorkers.map((w) => [w.id, w]));

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const itemsToProcess = records || [
      { employeeId, status, workHours, overtimeHours, notes, checkInTime, checkOutTime },
    ];

    const results = [];
    const duplicates = [];
    const invalidWorkers = [];

    for (const item of itemsToProcess) {
      // Worker validation
      if (!eligibleWorkerMap.has(item.employeeId)) {
        invalidWorkers.push(item.employeeId);
        continue;
      }

      // Duplicate check
      const existing = await seAttendanceRepository.checkExisting(item.employeeId, targetDate);
      if (existing) {
        duplicates.push({
          employeeId: item.employeeId,
          workerName: eligibleWorkerMap.get(item.employeeId)?.fullName,
          date: targetDate.toISOString().split("T")[0],
        });
        continue;
      }

      const created = await seAttendanceRepository.create({
        employeeId: item.employeeId,
        projectId,
        date: targetDate,
        status: item.status || "PRESENT",
        workHours: item.workHours !== undefined ? Number(item.workHours) : 8.0,
        overtimeHours: item.overtimeHours !== undefined ? Number(item.overtimeHours) : 0.0,
        checkInTime: item.checkInTime || null,
        checkOutTime: item.checkOutTime || null,
        notes: item.notes || null,
        recordedById: engineerId,
      });

      results.push(created);
    }

    if (invalidWorkers.length > 0 && results.length === 0) {
      const error = new Error(`One or more workers are not assigned to this project: ${invalidWorkers.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    if (duplicates.length > 0 && results.length === 0) {
      const error = new Error(
        `Attendance already recorded for: ${duplicates.map((d) => d.workerName || d.employeeId).join(", ")} on ${targetDate.toISOString().split("T")[0]}`
      );
      error.statusCode = 409;
      error.duplicates = duplicates;
      throw error;
    }

    return {
      success: true,
      recordedCount: results.length,
      records: results,
      duplicates,
      invalidWorkers,
    };
  },

  /**
   * Correct historical attendance record
   */
  async updateAttendance(attendanceId, engineerId, data) {
    const existing = await seAttendanceRepository.findById(attendanceId);
    if (!existing) {
      const error = new Error("Attendance record not found.");
      error.statusCode = 404;
      throw error;
    }

    if (existing.projectId) {
      await seProjectService.ensureProjectAssigned(existing.projectId, engineerId);
    }

    const payload = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.workHours !== undefined) payload.workHours = Number(data.workHours);
    if (data.overtimeHours !== undefined) payload.overtimeHours = Number(data.overtimeHours);
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.checkInTime !== undefined) payload.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) payload.checkOutTime = data.checkOutTime;
    if (data.correctionReason !== undefined) payload.correctionReason = data.correctionReason.trim();

    payload.updatedAt = new Date();

    return seAttendanceRepository.update(attendanceId, payload);
  },
};
