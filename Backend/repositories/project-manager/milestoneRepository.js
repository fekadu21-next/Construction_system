import prisma from "../../config/prisma.js";

export const pmMilestoneRepository = {
  /**
   * Retrieve milestones for a project
   */
  async findByProjectId(projectId, managerId) {
    return prisma.milestone.findMany({
      where: {
        projectId,
        project: managerId ? { projectManagerId: managerId, archivedAt: null } : { archivedAt: null },
      },
      orderBy: { dueDate: "asc" },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        assignedEngineer: { select: { id: true, fullName: true, email: true } },
      },
    });
  },

  /**
   * Find single milestone by ID ensuring project manager ownership
   */
  async findById(milestoneId, managerId) {
    return prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        project: managerId ? { projectManagerId: managerId, archivedAt: null } : { archivedAt: null },
      },
      include: {
        project: { select: { id: true, projectName: true, projectManagerId: true } },
      },
    });
  },

  /**
   * Update milestone status or progress
   */
  async update(milestoneId, data) {
    return prisma.milestone.update({
      where: { id: milestoneId },
      data,
      include: {
        project: { select: { id: true, projectName: true } },
        assignedEngineer: { select: { id: true, fullName: true } },
      },
    });
  },
};
