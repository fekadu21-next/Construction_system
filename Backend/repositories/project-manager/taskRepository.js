import prisma from "../../config/prisma.js";

export const pmTaskRepository = {
  /**
   * Get all tasks for manager's assigned projects
   */
  async getTasks(managerId, { projectId, status, priority, search, page = 1, limit = 50 } = {}) {
    // 1. Get all project IDs assigned to this manager (or all if GM)
    const pmProjects = await prisma.project.findMany({
      where: {
        ...(managerId ? { projectManagerId: managerId } : {}),
        archivedAt: null,
      },
      select: { id: true, projectName: true, projectCode: true },
    });

    const allowedProjectIds = pmProjects.map((p) => p.id);
    if (allowedProjectIds.length === 0) {
      return { tasks: [], total: 0, page: 1, limit: Number(limit) };
    }

    const where = {
      projectId: projectId ? projectId : { in: allowedProjectIds },
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { taskName: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: Number(limit),
        include: {
          project: {
            select: { id: true, projectName: true, projectCode: true },
          },
          milestone: {
            select: { id: true, milestoneName: true, status: true },
          },
          assignedTo: {
            select: { id: true, fullName: true, email: true, phone: true, role: true },
          },
          activities: {
            orderBy: { activityDate: "desc" },
            take: 3,
            select: {
              id: true,
              activityDate: true,
              workCompleted: true,
              materialsUsed: true,
              siteEngineer: { select: { fullName: true } },
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page: Number(page),
      limit: Number(limit),
      projects: pmProjects,
    };
  },

  /**
   * Get assignable users & workers for PM projects
   */
  async getAssignees(managerId, projectId) {
    const pmProjects = await prisma.project.findMany({
      where: {
        ...(managerId ? { projectManagerId: managerId } : {}),
        archivedAt: null,
      },
      select: { id: true },
    });
    const allowedProjectIds = pmProjects.map((p) => p.id);

    // Get site engineers & project users
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["SITE_ENGINEER", "PROJECT_MANAGER"] },
      },
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: "asc" },
    });

    // Get employees / workers assigned to this project or PM projects
    const employees = await prisma.employees.findMany({
      where: {
        assignedProjectId: projectId ? projectId : { in: allowedProjectIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        trade: true,
        assignedProjectId: true,
      },
      orderBy: { fullName: "asc" },
    });

    return { users, employees };
  },

  /**
   * Create a new task
   */
  async createTask(managerId, taskData) {
    const {
      projectId,
      milestoneId,
      assignedToId,
      taskName,
      description,
      priority = "MEDIUM",
      startDate,
      dueDate,
    } = taskData;

    // Verify project belongs to manager
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ...(managerId ? { projectManagerId: managerId } : {}),
        archivedAt: null,
      },
    });

    if (!project) {
      const error = new Error("Project not found or not assigned to you.");
      error.statusCode = 404;
      throw error;
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        milestoneId: milestoneId || null,
        assignedToId: assignedToId || null,
        taskName,
        description: description || null,
        priority,
        status: "PENDING",
        progressPercent: 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: managerId || null,
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        milestone: { select: { id: true, milestoneName: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    return task;
  },

  /**
   * Update task
   */
  async updateTask(managerId, taskId, updateData) {
    // Check task existence and manager ownership
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!existing) {
      const error = new Error("Task not found.");
      error.statusCode = 404;
      throw error;
    }

    if (managerId && existing.project.projectManagerId !== managerId) {
      const error = new Error("Unauthorized to modify tasks for this project.");
      error.statusCode = 403;
      throw error;
    }

    const {
      taskName,
      description,
      priority,
      status,
      progressPercent,
      startDate,
      dueDate,
      assignedToId,
      milestoneId,
      completionNotes,
      issues,
    } = updateData;

    const data = {};
    if (taskName !== undefined) data.taskName = taskName;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (milestoneId !== undefined) data.milestoneId = milestoneId || null;
    if (completionNotes !== undefined) data.completionNotes = completionNotes;
    if (issues !== undefined) data.issues = issues;

    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (status !== undefined) {
      data.status = status;
      if (status === "COMPLETED") {
        data.progressPercent = 100;
        data.completedAt = new Date();
      }
    }

    if (progressPercent !== undefined) {
      const p = Math.max(0, Math.min(100, parseInt(progressPercent, 10)));
      data.progressPercent = p;
      if (p === 100 && (!status || status !== "COMPLETED")) {
        data.status = "COMPLETED";
        data.completedAt = new Date();
      } else if (p < 100 && status === "COMPLETED") {
        data.status = "IN_PROGRESS";
        data.completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        milestone: { select: { id: true, milestoneName: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });

    return updated;
  },

  /**
   * Delete task
   */
  async deleteTask(managerId, taskId) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!existing) {
      const error = new Error("Task not found.");
      error.statusCode = 404;
      throw error;
    }

    if (managerId && existing.project.projectManagerId !== managerId) {
      const error = new Error("Unauthorized to delete tasks for this project.");
      error.statusCode = 403;
      throw error;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { id: taskId, message: "Task deleted successfully" };
  },
};
