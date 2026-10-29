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

    const [
      totalProjects,
      inProgress,
      completed,
      unassigned,
      planned,
      onHold,
      cancelled,
      archived,
    ] = await Promise.all([
      prisma.project.count({ where: activeWhere }),
      prisma.project.count({ where: { ...activeWhere, status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { ...activeWhere, status: "COMPLETED" } }),
      prisma.project.count({ where: { ...activeWhere, projectManagerId: null } }),
      prisma.project.count({ where: { ...activeWhere, status: "PLANNED" } }),
      prisma.project.count({ where: { ...activeWhere, status: "ON_HOLD" } }),
      prisma.project.count({ where: { ...activeWhere, status: "CANCELLED" } }),
      prisma.project.count({ where: { archivedAt: { not: null } } }),
    ]);

    return {
      totalProjects,
      inProgress,
      completed,
      unassigned,
      planned,
      onHold,
      cancelled,
      archived,
    };
  },
};
