import prisma from "../../config/prisma.js";

export const pmMaterialTrackingRepository = {
  /**
   * Aggregate material usage logs recorded by Site Engineers,
   * planned requisitions, and inventory stock monitoring.
   */
  async getMaterialTracking(managerId, { projectId, search } = {}) {
    // 1. Get projects assigned to manager
    const pmProjects = await prisma.project.findMany({
      where: {
        ...(managerId ? { projectManagerId: managerId } : {}),
        archivedAt: null,
      },
      select: { id: true, projectName: true, projectCode: true },
    });

    const allowedProjectIds = pmProjects.map((p) => p.id);
    if (allowedProjectIds.length === 0) {
      return {
        dailyUsageLogs: [],
        requisitionComparison: [],
        inventoryStock: [],
        summary: {
          totalUsageLogs: 0,
          totalApprovedRequests: 0,
          inventoryItemsTracked: 0,
          lowStockAlerts: 0,
        },
        projects: [],
      };
    }

    const targetProjectIds = projectId ? [projectId] : allowedProjectIds;

    // 2. Fetch Daily Site Activities where materials were recorded by Site Engineers
    const activitiesDb = await prisma.dailySiteActivity.findMany({
      where: {
        projectId: { in: targetProjectIds },
        materialsUsed: { not: null },
        ...(search
          ? {
              OR: [
                { materialsUsed: { contains: search, mode: "insensitive" } },
                { activityDescription: { contains: search, mode: "insensitive" } },
                { workCompleted: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { activityDate: "desc" },
      take: 50,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        siteEngineer: { select: { id: true, fullName: true, email: true } },
        task: { select: { id: true, taskName: true } },
      },
    });

    const dailyUsageLogs = activitiesDb
      .filter((a) => a.materialsUsed && a.materialsUsed.trim().length > 0)
      .map((a) => ({
        id: a.id,
        activityDate: a.activityDate ? a.activityDate.toISOString().split("T")[0] : null,
        projectId: a.projectId,
        projectName: a.project?.projectName || "Construction Project",
        projectCode: a.project?.projectCode || "",
        siteEngineer: a.siteEngineer?.fullName || "Site Engineer",
        siteEngineerEmail: a.siteEngineer?.email,
        taskName: a.task?.taskName || "General Site Operations",
        workCompleted: a.workCompleted,
        materialsUsed: a.materialsUsed,
        laborCount: a.laborCount || 0,
      }));

    // 3. Fetch Material Requisitions for Planned vs Actual comparison
    const requisitionsDb = await prisma.materialRequest.findMany({
      where: {
        projectId: { in: targetProjectIds },
      },
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        requestedBy: { select: { id: true, fullName: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate planned quantities per material name
    const materialPlanMap = {};

    for (const req of requisitionsDb) {
      for (const item of req.items) {
        const matName = item.materialName.trim();
        if (!materialPlanMap[matName]) {
          materialPlanMap[matName] = {
            materialName: matName,
            unit: item.unit,
            requestedQty: 0,
            approvedQty: 0,
            estimatedUnitCost: Number(item.estimatedUnitCost || 0),
            totalCost: 0,
            requestCount: 0,
            projects: new Set(),
          };
        }
        materialPlanMap[matName].requestCount += 1;
        materialPlanMap[matName].requestedQty += Number(item.quantity || 0);
        if (req.status === "APPROVED") {
          materialPlanMap[matName].approvedQty += Number(item.quantity || 0);
          materialPlanMap[matName].totalCost += Number(item.estimatedTotalCost || 0);
        }
        materialPlanMap[matName].projects.add(req.project?.projectName || "Project");
      }
    }

    const requisitionComparison = Object.values(materialPlanMap).map((item) => ({
      ...item,
      projects: Array.from(item.projects).join(", "),
    }));

    // 4. Fetch Central Inventory Stock levels from materials table
    const materialsDb = await prisma.materials.findMany({
      where: {
        isActive: true,
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      include: {
        material_categories: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    let lowStockAlerts = 0;
    const inventoryStock = materialsDb.map((m) => {
      const current = Number(m.currentStock || 0);
      const reorder = Number(m.reorderLevel || 0);

      let stockStatus = "ADEQUATE";
      if (current <= 0) {
        stockStatus = "OUT_OF_STOCK";
        lowStockAlerts++;
      } else if (current <= reorder) {
        stockStatus = "LOW_STOCK";
        lowStockAlerts++;
      }

      return {
        id: m.id,
        code: m.code,
        name: m.name,
        category: m.material_categories?.name || "General Materials",
        unit: m.unit,
        currentStock: current,
        reorderLevel: reorder,
        description: m.description,
        stockStatus,
      };
    });

    return {
      dailyUsageLogs,
      requisitionComparison,
      inventoryStock,
      summary: {
        totalUsageLogs: dailyUsageLogs.length,
        totalApprovedRequests: requisitionsDb.filter((r) => r.status === "APPROVED").length,
        inventoryItemsTracked: inventoryStock.length,
        lowStockAlerts,
      },
      projects: pmProjects,
    };
  },
};
