import prisma from "../../config/prisma.js";

export const materialRepository = {
  async findAll(options = {}) {
    const { includeInactive = false, categoryId, search } = options;

    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { category: { name: { contains: term, mode: "insensitive" } } },
      ];
    }

    return await prisma.material.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findById(id) {
    return await prisma.material.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        stockMovements: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  },

  async findByCode(code) {
    return await prisma.material.findUnique({
      where: { code },
    });
  },

  async create(data) {
    const openingQty = Number(data.openingQuantity ?? data.openingStock ?? data.currentStock ?? 0);
    const initialBalance = isNaN(openingQty) || openingQty < 0 ? 0 : openingQty;

    return await prisma.$transaction(async (tx) => {
      const material = await tx.material.create({
        data: {
          code: data.code,
          name: data.name,
          categoryId: data.categoryId,
          unit: data.unit,
          reorderLevel: data.reorderLevel,
          currentStock: initialBalance,
          description: data.description || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdById: data.createdById,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Record controlled opening stock transaction if initial balance > 0
      if (initialBalance > 0) {
        await tx.stockMovement.create({
          data: {
            materialId: material.id,
            movementType: "RECEIPT",
            quantity: initialBalance,
            reference: data.openingStockReference || data.reference || "Opening Balance",
            notes: data.openingStockNotes || data.notes || "Controlled opening inventory registration",
            createdById: data.createdById,
          },
        });
      }

      return material;
    });
  },

  async update(id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  async delete(id) {
    return await prisma.material.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  },

  async getLowStockMaterials() {
    const materials = await prisma.material.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        currentStock: "asc",
      },
    });

    return materials.filter((m) => Number(m.currentStock) <= Number(m.reorderLevel));
  },

  async getStockStats() {
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        currentStock: true,
        reorderLevel: true,
        isActive: true,
      },
    });

    const activeMaterials = materials.filter((m) => m.isActive);
    let totalStock = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const m of activeMaterials) {
      const stock = Number(m.currentStock);
      const reorder = Number(m.reorderLevel);
      totalStock += stock;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= reorder) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    }

    return {
      totalMaterials: materials.length,
      activeMaterials: activeMaterials.length,
      inactiveMaterials: materials.length - activeMaterials.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalStock,
    };
  },

  async getStockHistory(materialId) {
    return await prisma.stockMovement.findMany({
      where: { materialId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};
