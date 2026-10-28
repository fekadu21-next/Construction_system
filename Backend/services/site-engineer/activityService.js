import { seActivityRepository } from "../../repositories/site-engineer/index.js";
import { seProjectService } from "./projectService.js";

export const seActivityService = {
  /**
   * Get paginated daily site activities
   */
  async getActivities(engineerId, query) {
    return seActivityRepository.findActivities(engineerId, query);
  },

  /**
   * Get single activity by ID
   */
  async getActivityById(activityId, engineerId) {
    const activity = await seActivityRepository.findById(activityId);
    if (!activity) {
      const error = new Error("Daily site activity record not found.");
      error.statusCode = 404;
      throw error;
    }
    // Verify engineer has access to the project
    await seProjectService.ensureProjectAssigned(activity.projectId, engineerId);
    return activity;
  },

  /**
   * Record new daily site activity
   */
  async createActivity(engineerId, data) {
    // 1. Verify project assignment
    await seProjectService.ensureProjectAssigned(data.projectId, engineerId);

    const payload = {
      projectId: data.projectId,
      siteEngineerId: engineerId,
      taskId: data.taskId || null,
      activityDate: new Date(data.activityDate),
      activityDescription: data.activityDescription.trim(),
      workCompleted: data.workCompleted.trim(),
      laborCount: data.laborCount ? parseInt(data.laborCount, 10) : null,
      materialsUsed: data.materialsUsed ? data.materialsUsed.trim() : null,
      issues: data.issues ? data.issues.trim() : null,
      weatherConditions: data.weatherConditions ? data.weatherConditions.trim() : null,
      safetyObservations: data.safetyObservations ? data.safetyObservations.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
    };

    return seActivityRepository.create(payload);
  },

  /**
   * Update daily site activity (restricted to original author)
   */
  async updateActivity(activityId, engineerId, data) {
    const existing = await seActivityRepository.findById(activityId);
    if (!existing) {
      const error = new Error("Daily site activity record not found.");
      error.statusCode = 404;
      throw error;
    }

    if (existing.siteEngineerId !== engineerId) {
      const error = new Error("You are not authorized to modify another engineer's activity record.");
      error.statusCode = 403;
      throw error;
    }

    const payload = {};
    if (data.activityDate !== undefined) payload.activityDate = new Date(data.activityDate);
    if (data.activityDescription !== undefined) payload.activityDescription = data.activityDescription.trim();
    if (data.workCompleted !== undefined) payload.workCompleted = data.workCompleted.trim();
    if (data.laborCount !== undefined) payload.laborCount = parseInt(data.laborCount, 10) || 0;
    if (data.materialsUsed !== undefined) payload.materialsUsed = data.materialsUsed;
    if (data.issues !== undefined) payload.issues = data.issues;
    if (data.weatherConditions !== undefined) payload.weatherConditions = data.weatherConditions;
    if (data.safetyObservations !== undefined) payload.safetyObservations = data.safetyObservations;
    if (data.notes !== undefined) payload.notes = data.notes;

    return seActivityRepository.update(activityId, payload);
  },
};
