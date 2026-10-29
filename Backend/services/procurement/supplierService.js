import { supplierRepository } from "../../repositories/procurement/supplierRepository.js";
import prisma from "../../config/prisma.js";

export const supplierService = {
  async getAllSuppliers(options = {}) {
    return await supplierRepository.findAll(options);
  },

  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }
    return supplier;
  },

  async createSupplier(data, userId) {
    if (data.code && data.code.trim()) {
      const existing = await supplierRepository.findByCode(data.code.trim());
      if (existing) {
        throw new Error("Supplier with this code already exists");
      }
      data.code = data.code.trim();
    } else {
      // Auto-generate unique code e.g. SUP-001
      const count = await prisma.supplier.count();
      let nextNum = count + 1;
      let candidate = `SUP-${String(nextNum).padStart(3, "0")}`;
      while (await supplierRepository.findByCode(candidate)) {
        nextNum++;
        candidate = `SUP-${String(nextNum).padStart(3, "0")}`;
      }
      data.code = candidate;
    }

    return await supplierRepository.create({
      ...data,
      createdById: userId,
    });
  },

  async updateSupplier(id, data) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (data.code && data.code.trim() && data.code.trim() !== supplier.code) {
      const existing = await supplierRepository.findByCode(data.code.trim());
      if (existing && existing.id !== id) {
        throw new Error("Supplier with this code already exists");
      }
      data.code = data.code.trim();
    }

    return await supplierRepository.update(id, data);
  },

  async deleteSupplier(id) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return await supplierRepository.delete(id);
  },

  async getStats() {
    return await supplierRepository.getStats();
  },
};
