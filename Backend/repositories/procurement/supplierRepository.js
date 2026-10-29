import prisma from "../../config/prisma.js";

export const supplierRepository = {
  async findAll(options = {}) {
    const { includeInactive = false, search } = options;

    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
        { contactPerson: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { country: { contains: term, mode: "insensitive" } },
        { address: { contains: term, mode: "insensitive" } },
      ];
    }

    return await prisma.supplier.findMany({
      where,
      include: {
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
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  async findByCode(code) {
    if (!code) return null;
    return await prisma.supplier.findUnique({
      where: { code },
    });
  },

  async create(data) {
    return await prisma.supplier.create({
      data: {
        code: data.code || null,
        name: data.name,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        website: data.website || null,
        taxId: data.taxId || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  },

  async update(id, data) {
    const updateData = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.taxId !== undefined) updateData.taxId = data.taxId;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  },

  async delete(id) {
    return await prisma.supplier.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  },

  async getStats() {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        isActive: true,
        phone: true,
        email: true,
      },
    });

    const activeSuppliers = suppliers.filter((s) => s.isActive).length;
    const inactiveSuppliers = suppliers.length - activeSuppliers;
    const withContactDetails = suppliers.filter(
      (s) => (s.phone && s.phone.trim().length > 0) || (s.email && s.email.trim().length > 0)
    ).length;

    return {
      totalSuppliers: suppliers.length,
      activeSuppliers,
      inactiveSuppliers,
      withContactDetails,
    };
  },
};
