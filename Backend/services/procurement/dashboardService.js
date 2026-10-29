import { materialService } from "./materialService.js";
import { supplierService } from "./supplierService.js";
import { equipmentService } from "./equipmentService.js";

export const dashboardService = {
  async getDashboardStats() {
    const [stockStats, supplierStats, lowStockMaterials, equipmentStats] =
      await Promise.all([
        materialService.getStockStats(),
        supplierService.getStats(),
        materialService.getLowStockMaterials(),
        equipmentService.getEquipmentStats(),
      ]);

    return {
      materials: {
        total: stockStats.totalMaterials,
        lowStock: stockStats.lowStockCount,
        outOfStock: stockStats.outOfStockCount,
        totalStock: stockStats.totalStock,
      },
      suppliers: {
        total: supplierStats.totalSuppliers,
        active: supplierStats.activeSuppliers || supplierStats.totalSuppliers,
      },
      equipment: {
        total: equipmentStats.totalEquipment,
        activeOnSite: equipmentStats.activeOnSite,
        rented: equipmentStats.rentedCount,
        companyOwned: equipmentStats.companyOwnedCount,
        inMaintenance: equipmentStats.inMaintenance,
        dailyRentalBurnETB: equipmentStats.dailyRentalBurnETB,
      },
      alerts: lowStockMaterials.map((material) => ({
        id: material.id,
        type: "low_stock",
        message: `${material.name} (${material.code}) is below reorder level`,
        severity: "warning",
        material: {
          id: material.id,
          name: material.name,
          code: material.code,
          currentStock: material.currentStock,
          reorderLevel: material.reorderLevel,
          unit: material.unit,
        },
      })),
    };
  },
};
