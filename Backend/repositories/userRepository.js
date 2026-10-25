import prisma from "../config/prisma.js";

export const userRepository = {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
  },

  async findActiveProjectManagers() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: "PROJECT_MANAGER",
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePhotoUrl: true,
        isActive: true,
        role: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });
  },
};
