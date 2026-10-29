import prisma from "../config/prisma.js";

const projectInclude = {
  projectManager: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profilePhotoUrl: true,
    },
  },
  supervisor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profilePhotoUrl: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
};

export const projectRepository = {
  async findMany({ where = {}, skip = 0, take = 10, orderBy = { createdAt: "desc" } }) {
    return prisma.project.findMany({
      where,
      skip,
      take,
      orderBy,
      include: projectInclude,
    });
  },

  async count({ where = {} }) {
    return prisma.project.count({ where });
  },

  async findById(id) {
    return prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
  },

  async findByCode(projectCode) {
    return prisma.project.findUnique({
      where: { projectCode },
    });
  },

  async create(data) {
    return prisma.project.create({
      data,
      include: projectInclude,
    });
  },

  async update(id, data) {
    return prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    });
  },

  async archive(id) {
    return prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  },

  async restore(id) {
    return prisma.project.update({
      where: { id },
      data: { archivedAt: null },
    });
  },

  async delete(id) {
    return prisma.project.delete({
      where: { id },
    });
  },

  async getMetrics() {
    const activeWhere = { archivedAt: null };

    // Group active projects by status in a single query
    const statusGroups = await prisma.project.groupBy({
      by: ["status"],
      _count: { id: true },
      where: activeWhere,
    });

    const statusMap = {
      IN_PROGRESS: 0,
      COMPLETED: 0,
      PLANNED: 0,
      ON_HOLD: 0,
      CANCELLED: 0,
    };

    let totalProjects = 0;
    for (const group of statusGroups) {
      if (group.status) {
        statusMap[group.status] = group._count.id;
        totalProjects += group._count.id;
      }
    }

    const unassigned = await prisma.project.count({
      where: { ...activeWhere, projectManagerId: null },
    });

    const archived = await prisma.project.count({
      where: { archivedAt: { not: null } },
    });

    return {
      totalProjects,
      inProgress: statusMap["IN_PROGRESS"] || 0,
      completed: statusMap["COMPLETED"] || 0,
      unassigned,
      planned: statusMap["PLANNED"] || 0,
      onHold: statusMap["ON_HOLD"] || 0,
      cancelled: statusMap["CANCELLED"] || 0,
      archived,
    };
  },
};
