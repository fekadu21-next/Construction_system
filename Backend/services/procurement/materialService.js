import { materialRepository } from "../../repositories/procurement/materialRepository.js";
import { materialCategoryRepository } from "../../repositories/procurement/materialCategoryRepository.js";

export const materialService = {
  async getAllMaterials(options = {}) {
    return await materialRepository.findAll(options);
  },

  async getMaterialById(id) {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error("Material not found");
    }
    return material;
  },

  async createMaterial(data, userId) {
    const existingMaterial = await materialRepository.findByCode(data.code);
    if (existingMaterial) {
      throw new Error("Material with this code already exists");
    }

    const category = await materialCategoryRepository.findById(data.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    return await materialRepository.create({
      ...data,
      createdById: userId,
    });
  },

  async updateMaterial(id, data) {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error("Material not found");
    }

    if (data.categoryId) {
      const category = await materialCategoryRepository.findById(data.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
    }

    return await materialRepository.update(id, data);
  },

  async deleteMaterial(id) {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error("Material not found");
    }

    return await materialRepository.delete(id);
  },

  async getLowStockMaterials() {
    return await materialRepository.getLowStockMaterials();
  },

  async getStockStats() {
    return await materialRepository.getStockStats();
  },

  async getStockHistory(materialId) {
    const material = await materialRepository.findById(materialId);
    if (!material) {
      throw new Error("Material not found");
    }
    return await materialRepository.getStockHistory(materialId);
  },

  async getAllCategories() {
    return await materialCategoryRepository.findAll();
  },

  async createCategory(data) {
    return await materialCategoryRepository.create(data);
  },

  async updateCategory(id, data) {
    return await materialCategoryRepository.update(id, data);
  },

  async deleteCategory(id) {
    return await materialCategoryRepository.delete(id);
  },
};
