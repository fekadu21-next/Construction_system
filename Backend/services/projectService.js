import { projectRepository } from "../repositories/projectRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { ALLOWED_STATUS_TRANSITIONS, DEFAULT_CURRENCY } from "../constants/projectConstants.js";
import prisma from "../config/prisma.js";

export const projectService = {
  async getProjects({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    managerId = "",
    supervisorId = "",
    startDateFrom = "",
    startDateTo = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    includeArchived = false,
  }) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Archiving filter: by default exclude archived projects
    if (!includeArchived) {
      where.archivedAt = null;
    }

    // Search filter across projectName, projectCode, location
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { projectName: { contains: q, mode: "insensitive" } },
        { projectCode: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status && status.trim()) {
      where.status = status.trim();
    }

    // Manager filter
    if (managerId === "unassigned") {
      where.projectManagerId = null;
    } else if (managerId && managerId.trim()) {
      where.projectManagerId = managerId.trim();
    }

    // Supervisor filter
    if (supervisorId === "unassigned") {
      where.supervisorId = null;
    } else if (supervisorId && supervisorId.trim()) {
      where.supervisorId = supervisorId.trim();
    }

    // Date range filter
    if (startDateFrom || startDateTo) {
      where.startDate = {};
      if (startDateFrom) {
        where.startDate.gte = new Date(startDateFrom);
      }
      if (startDateTo) {
        where.startDate.lte = new Date(startDateTo);
      }
    }

    // Valid sort columns
    const allowedSortColumns = ["projectName", "projectCode", "startDate", "endDate", "budget", "status", "createdAt"];
    const sortField = allowedSortColumns.includes(sortBy) ? sortBy : "createdAt";
    const orderDirection = sortOrder.toLowerCase() === "asc" ? "asc" : "desc";

    const [projects, total, metrics] = await Promise.all([
      projectRepository.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: orderDirection },
      }),
      projectRepository.count({ where }),
      projectRepository.getMetrics(),
    ]);

    return {
      projects,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      metrics,
    };
  },

  async getProjectMetrics() {
    return projectRepository.getMetrics();
  },

  async getProjectById(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  },

  async generateNextProjectCode() {
    const latestProjects = await prisma.project.findMany({
      take: 1,
      orderBy: { createdAt: "desc" },
      select: { projectCode: true },
    });

    const prefix = "BM-PRJ-";
    if (latestProjects.length === 0) {
      return `${prefix}0001`;
    }

    const lastCode = latestProjects[0].projectCode;
    const match = lastCode.match(/\d+$/);
    if (match) {
      const nextNum = parseInt(match[0], 10) + 1;
      return `${prefix}${nextNum.toString().padStart(4, "0")}`;
    }

    return `${prefix}${Date.now().toString().slice(-4)}`;
  },

  async createProject(data, actorId) {
    const code = (data.projectCode || "").trim().toUpperCase();

    // Check unique code
    const existing = await projectRepository.findByCode(code);
    if (existing) {
      throw new Error("Project code already exists");
    }

    // Validate Project Manager if assigned
    const pmId = data.projectManagerId && data.projectManagerId.trim() ? data.projectManagerId.trim() : null;
    if (pmId) {
      const manager = await userRepository.findById(pmId);
      if (!manager) {
        throw new Error("Project manager not found");
      }
      if (!manager.isActive) {
        throw new Error("Selected project manager is not active");
      }
      if (manager.role?.name !== "PROJECT_MANAGER") {
        throw new Error("Selected user is not a Project Manager");
      }
    }

    // Validate Site Supervisor if assigned
    const supId = data.supervisorId && data.supervisorId.trim() ? data.supervisorId.trim() : null;
    if (supId) {
      const supervisor = await userRepository.findById(supId);
      if (!supervisor) {
        throw new Error("Site supervisor not found");
      }
      if (!supervisor.isActive) {
        throw new Error("Selected site supervisor is not active");
      }
      if (!["SUPERVISOR", "SUPERVISER"].includes(supervisor.role?.name)) {
        throw new Error("Selected user is not a Site Supervisor");
      }
    }

    const project = await projectRepository.create({
      projectName: data.projectName.trim(),
      projectCode: code,
      description: data.description ? data.description.trim() : null,
      location: data.location.trim(),
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      budget: parseFloat(data.budget),
      currency: (data.currency || DEFAULT_CURRENCY).trim().toUpperCase(),
      status: data.status || "PLANNED",
      projectManagerId: pmId,
      supervisorId: supId,
      createdById: actorId,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: project.id,
        details: {
          projectName: project.projectName,
          projectCode: project.projectCode,
          location: project.location,
          budget: project.budget.toString(),
          currency: project.currency,
          status: project.status,
          projectManagerId: project.projectManagerId,
          supervisorId: project.supervisorId,
        },
      },
    });

    return project;
  },

  async updateProject(id, data, actorId) {
    const current = await projectRepository.findById(id);
    if (!current) {
      throw new Error("Project not found");
    }

    const updateData = {};

    if (data.projectName !== undefined) {
      updateData.projectName = data.projectName.trim();
    }

    if (data.projectCode !== undefined) {
      const code = data.projectCode.trim().toUpperCase();
      if (code !== current.projectCode) {
        const existing = await projectRepository.findByCode(code);
        if (existing && existing.id !== id) {
          throw new Error("Project code already exists");
        }
      }
      updateData.projectCode = code;
    }

    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }

    if (data.location !== undefined) {
      updateData.location = data.location.trim();
    }

    if (data.startDate !== undefined) {
      updateData.startDate = new Date(data.startDate);
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    if (data.budget !== undefined) {
      const budget = parseFloat(data.budget);
      if (isNaN(budget) || budget < 0) {
        throw new Error("Budget must be a non-negative number");
      }
      updateData.budget = budget;
    }

    if (data.currency !== undefined) {
      updateData.currency = data.currency.trim().toUpperCase();
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.projectManagerId !== undefined) {
      const pmId = data.projectManagerId && data.projectManagerId.trim() ? data.projectManagerId.trim() : null;
      if (pmId) {
        const manager = await userRepository.findById(pmId);
        if (!manager) {
          throw new Error("Project manager not found");
        }
        if (!manager.isActive) {
          throw new Error("Selected project manager is not active");
        }
        if (manager.role?.name !== "PROJECT_MANAGER") {
          throw new Error("Selected user is not a Project Manager");
        }
      }
      updateData.projectManagerId = pmId;
    }

    if (data.supervisorId !== undefined) {
      const supId = data.supervisorId && data.supervisorId.trim() ? data.supervisorId.trim() : null;
      if (supId) {
        const supervisor = await userRepository.findById(supId);
        if (!supervisor) {
          throw new Error("Site supervisor not found");
        }
        if (!supervisor.isActive) {
          throw new Error("Selected site supervisor is not active");
        }
        if (!["SUPERVISOR", "SUPERVISER"].includes(supervisor.role?.name)) {
          throw new Error("Selected user is not a Site Supervisor");
        }
      }
      updateData.supervisorId = supId;
    }

    const updated = await projectRepository.update(id, updateData);

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_UPDATED",
        entityType: "Project",
        entityId: id,
        details: { changes: updateData },
      },
    });

    return updated;
  },

  async assignManager(id, projectManagerId, actorId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }

    const pmId = projectManagerId && projectManagerId.trim() ? projectManagerId.trim() : null;
    if (pmId) {
      const manager = await userRepository.findById(pmId);
      if (!manager) {
        throw new Error("Project manager not found");
      }
      if (!manager.isActive) {
        throw new Error("Selected project manager is not active");
      }
      if (manager.role?.name !== "PROJECT_MANAGER") {
        throw new Error("Selected user is not a Project Manager");
      }
    }

    const previousManager = project.projectManager?.fullName || "Unassigned";

    const updated = await projectRepository.update(id, { projectManagerId: pmId });

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_MANAGER_ASSIGNED",
        entityType: "Project",
        entityId: id,
        details: {
          previousManager,
          newManagerId: pmId,
        },
      },
    });

    return updated;
  },

  async assignSupervisor(id, supervisorId, actorId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }

    const supId = supervisorId && supervisorId.trim() ? supervisorId.trim() : null;
    if (supId) {
      const supervisor = await userRepository.findById(supId);
      if (!supervisor) {
        throw new Error("Site supervisor not found");
      }
      if (!supervisor.isActive) {
        throw new Error("Selected site supervisor is not active");
      }
      if (!["SUPERVISOR", "SUPERVISER"].includes(supervisor.role?.name)) {
        throw new Error("Selected user is not a Site Supervisor");
      }
    }

    const previousSupervisor = project.supervisor?.fullName || "Unassigned";

    const updated = await projectRepository.update(id, { supervisorId: supId });

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_SUPERVISOR_ASSIGNED",
        entityType: "Project",
        entityId: id,
        details: {
          previousSupervisor,
          newSupervisorId: supId,
        },
      },
    });

    return updated;
  },

  async updateProjectStatus(id, newStatus, actorId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }

    // Validate transition
    const currentStatus = project.status;
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
    if (allowed && !allowed.includes(newStatus) && currentStatus !== newStatus) {
      // Still allow GM override if required, but log warning
      console.warn(`Non-standard status transition from ${currentStatus} to ${newStatus}`);
    }

    const updated = await projectRepository.update(id, { status: newStatus });

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_STATUS_CHANGED",
        entityType: "Project",
        entityId: id,
        details: {
          previousStatus: currentStatus,
          newStatus,
        },
      },
    });

    return updated;
  },

  async archiveProject(id, actorId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }

    const updated = await projectRepository.archive(id);

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_ARCHIVED",
        entityType: "Project",
        entityId: id,
        details: {
          projectName: project.projectName,
          projectCode: project.projectCode,
        },
      },
    });

    return updated;
  },

  async deleteProject(id, actorId) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new Error("Project not found");
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: actorId,
        action: "PROJECT_DELETED",
        entityType: "Project",
        entityId: id,
        details: {
          projectName: project.projectName,
          projectCode: project.projectCode,
        },
      },
    });

    await projectRepository.delete(id);
    return { success: true };
  },
};
