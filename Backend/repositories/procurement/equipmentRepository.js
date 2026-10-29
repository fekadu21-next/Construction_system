import prisma from "../../config/prisma.js";

export const equipmentRepository = {
  async findAll(options = {}) {
    const { status, ownership, category, search, projectId } = options;

    const where = {};

    if (status && status !== "ALL") where.status = status;
    if (ownership && ownership !== "ALL") where.ownership = ownership;
    if (category && category !== "ALL") where.category = category;
    if (projectId) where.projectId = projectId;

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { model: { contains: term, mode: "insensitive" } },
        { supplierName: { contains: term, mode: "insensitive" } },
        { serialOrPlate: { contains: term, mode: "insensitive" } },
        { agreementRef: { contains: term, mode: "insensitive" } },
      ];
    }

    return await prisma.equipment.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, contactPerson: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id) {
    return await prisma.equipment.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            contactPerson: true,
            email: true,
          },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    });
  },

  async findByCode(code) {
    return await prisma.equipment.findUnique({ where: { code } });
  },

  async create(data) {
    return await prisma.equipment.create({
      data: {
        code: data.code,
        name: data.name,
        model: data.model || null,
        category: data.category || "EARTHMOVING",
        ownership: data.ownership || "RENTED",
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        supplierContact: data.supplierContact || null,
        rentalRateDailyETB: data.rentalRateDailyETB
          ? Number(data.rentalRateDailyETB)
          : 0,
        internalCostPerDayETB: data.internalCostPerDayETB
          ? Number(data.internalCostPerDayETB)
          : 0,
        rentalStartDate: data.rentalStartDate
          ? new Date(data.rentalStartDate)
          : null,
        rentalEndDate: data.rentalEndDate ? new Date(data.rentalEndDate) : null,
        agreementRef: data.agreementRef || null,
        projectId: data.projectId || null,
        projectName: data.projectName || null,
        status: data.status || (data.projectId ? "ON_SITE" : "AVAILABLE"),
        serialOrPlate: data.serialOrPlate || null,
        currentHourMeter: data.currentHourMeter
          ? Number(data.currentHourMeter)
          : 0,
        nextServiceHours: data.nextServiceHours
          ? Number(data.nextServiceHours)
          : null,
        fuelRateType: data.fuelRateType || "DRY_RATE",
        condition: data.condition || "GOOD",
        notes: data.notes || null,
        createdById: data.createdById || null,
      },
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, contactPerson: true },
        },
      },
    });
  },

  async update(id, data) {
    const updateData = {};

    const fields = [
      "name",
      "model",
      "category",
      "ownership",
      "supplierId",
      "supplierName",
      "supplierContact",
      "agreementRef",
      "projectId",
      "projectName",
      "status",
      "serialOrPlate",
      "fuelRateType",
      "condition",
      "notes",
      "offHireCertificateRef",
      "returnInspectionNotes",
    ];

    fields.forEach((f) => {
      if (data[f] !== undefined) updateData[f] = data[f];
    });

    const numericFields = [
      "rentalRateDailyETB",
      "internalCostPerDayETB",
      "currentHourMeter",
      "nextServiceHours",
      "finalHourMeter",
    ];
    numericFields.forEach((f) => {
      if (data[f] !== undefined)
        updateData[f] = data[f] !== null ? Number(data[f]) : null;
    });

    const dateFields = [
      "rentalStartDate",
      "rentalEndDate",
      "returnedAt",
    ];
    dateFields.forEach((f) => {
      if (data[f] !== undefined)
        updateData[f] = data[f] ? new Date(data[f]) : null;
    });

    return await prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, contactPerson: true },
        },
      },
    });
  },

  async delete(id) {
    return await prisma.equipment.delete({ where: { id } });
  },

  async getStats() {
    const all = await prisma.equipment.findMany({
      select: {
        status: true,
        ownership: true,
        rentalRateDailyETB: true,
      },
    });

    const totalEquipment = all.length;
    const activeOnSite = all.filter((e) => e.status === "ON_SITE").length;
    const availableInYard = all.filter((e) => e.status === "AVAILABLE").length;
    const inMaintenance = all.filter((e) => e.status === "MAINTENANCE").length;
    const rentedCount = all.filter(
      (e) => e.ownership === "RENTED" && e.status !== "RETURNED"
    ).length;
    const companyOwnedCount = all.filter(
      (e) => e.ownership === "COMPANY_OWNED"
    ).length;

    const dailyRentalBurnETB = all
      .filter(
        (e) =>
          e.ownership === "RENTED" &&
          e.status === "ON_SITE"
      )
      .reduce((acc, e) => acc + (Number(e.rentalRateDailyETB) || 0), 0);

    return {
      totalEquipment,
      activeOnSite,
      availableInYard,
      inMaintenance,
      rentedCount,
      companyOwnedCount,
      dailyRentalBurnETB,
    };
  },
};
