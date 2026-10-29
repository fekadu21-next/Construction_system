import prisma from "../../config/prisma.js";

export const materialCategoryRepository = {
  async findAll() {
    return await prisma.materialCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });
  },

  async findById(id) {
    return await prisma.materialCategory.findUnique({
      where: { id },
      include: {
        materials: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  },

  async create(data) {
    return await prisma.materialCategory.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  },

  async update(id, data) {
    return await prisma.materialCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  },

  async delete(id) {
    const categoryWithMaterials = await prisma.materialCategory.findUnique({
      where: { id },
      include: {
        materials: true,
      },
    });

    if (categoryWithMaterials && categoryWithMaterials.materials.length > 0) {
      throw new Error("Cannot delete category with associated materials");
    }

    return await prisma.materialCategory.delete({
      where: { id },
    });
  },
};
